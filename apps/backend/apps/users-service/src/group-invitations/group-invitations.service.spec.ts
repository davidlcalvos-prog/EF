// expo-server-sdk es ESM y jest (CommonJS) no lo parsea; NotificationsService se mockea entero.
jest.mock('expo-server-sdk', () => ({ Expo: jest.fn() }));

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GroupInvitationsService } from './group-invitations.service';

const GROUP = { id: 'g1', name: 'Los Pibes', creatorId: 'leader' };
const DTO = { id: 'inv-1', status: 'pending' } as never;

function build(options: {
  role?: 'creator' | 'admin' | 'member' | null;
  targetMembership?: boolean;
  existing?: { id: string; groupId: string; userId: string; invitedBy: string; status: string } | null;
  group?: typeof GROUP | null;
} = {}) {
  const role = options.role === undefined ? 'creator' : options.role;
  const invitationRepository = {
    findByGroupAndUser: jest.fn(async () => options.existing ?? null),
    findById: jest.fn(async () => options.existing ?? null),
    createPending: jest.fn(async () => 'inv-new'),
    reopen: jest.fn(async () => undefined),
    accept: jest.fn(async () => ({ alreadyMember: false })),
    decline: jest.fn(async () => undefined),
    delete: jest.fn(async () => undefined),
    listForGroup: jest.fn(async () => []),
    listMineForUser: jest.fn(async () => []),
    getDto: jest.fn(async () => DTO),
    findUserName: jest.fn(async () => ({ firstname: 'Ana', lastname: 'Pérez' })),
  };
  const groupRepository = {
    findGroupById: jest.fn(async () => (options.group === undefined ? GROUP : options.group)),
    // Primera llamada: rol del que invita; segunda: ¿el invitado ya es miembro?
    findMembership: jest
      .fn()
      .mockResolvedValueOnce(role ? { role } : null)
      .mockResolvedValueOnce(options.targetMembership ? { role: 'member' } : null),
    findUserByEmail: jest.fn(async (email: string) => (email === 'nadie@x.com' ? null : { id: 'target' })),
  };
  const notificationsService = { sendToUser: jest.fn(async () => undefined) };
  const service = new GroupInvitationsService(
    invitationRepository as never,
    groupRepository as never,
    notificationsService as never,
  );
  return { service, invitationRepository, groupRepository, notificationsService };
}

describe('invite', () => {
  test('creador invita por email: crea pending y manda push con contrato PushData', async () => {
    const { service, invitationRepository, notificationsService } = build();
    await service.invite({ groupId: 'g1', requesterId: 'leader', email: 'ana@x.com' });
    expect(invitationRepository.createPending).toHaveBeenCalledWith('g1', 'target', 'leader');
    expect(notificationsService.sendToUser).toHaveBeenCalledTimes(1);
    const [to, title, body, data] = notificationsService.sendToUser.mock.calls[0] as unknown as [
      string,
      string,
      string,
      Record<string, unknown>,
    ];
    expect(to).toBe('target');
    expect(title).toBe('Invitación a grupo');
    expect(body).toBe('Ana Pérez te invitó al grupo Los Pibes');
    expect(data).toEqual({
      v: 1,
      type: 'group_invitation',
      screen: 'Groups',
      params: { initialSection: 'invitations', invitationId: 'inv-new', groupId: 'g1' },
      pending: 'groupInvites',
    });
  });

  test('un miembro raso NO puede invitar (403) — mismo guard que el alta directa', async () => {
    const { service, invitationRepository } = build({ role: 'member' });
    await expect(
      service.invite({ groupId: 'g1', requesterId: 'u', userId: 'target' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(invitationRepository.createPending).not.toHaveBeenCalled();
  });

  test('grupo inexistente → 404; email inexistente → 404', async () => {
    const a = build({ group: null });
    await expect(a.service.invite({ groupId: 'g1', requesterId: 'leader', userId: 'target' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    const b = build();
    await expect(b.service.invite({ groupId: 'g1', requesterId: 'leader', email: 'nadie@x.com' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  test('ya es miembro → 409, sin invitación ni push', async () => {
    const { service, invitationRepository, notificationsService } = build({ targetMembership: true });
    await expect(
      service.invite({ groupId: 'g1', requesterId: 'leader', userId: 'target' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(invitationRepository.createPending).not.toHaveBeenCalled();
    expect(notificationsService.sendToUser).not.toHaveBeenCalled();
  });

  test('invitación pendiente duplicada → 409 y SIN segundo push', async () => {
    const { service, invitationRepository, notificationsService } = build({
      existing: { id: 'inv-1', groupId: 'g1', userId: 'target', invitedBy: 'leader', status: 'pending' },
    });
    await expect(
      service.invite({ groupId: 'g1', requesterId: 'leader', userId: 'target' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(invitationRepository.createPending).not.toHaveBeenCalled();
    expect(invitationRepository.reopen).not.toHaveBeenCalled();
    expect(notificationsService.sendToUser).not.toHaveBeenCalled();
  });

  test('rechazada → se reabre la misma fila (reinvitar) y se manda push de nuevo', async () => {
    const { service, invitationRepository, notificationsService } = build({
      existing: { id: 'inv-1', groupId: 'g1', userId: 'target', invitedBy: 'otro', status: 'declined' },
    });
    await service.invite({ groupId: 'g1', requesterId: 'leader', userId: 'target' });
    expect(invitationRepository.reopen).toHaveBeenCalledWith('inv-1', 'leader');
    expect(invitationRepository.createPending).not.toHaveBeenCalled();
    expect(notificationsService.sendToUser).toHaveBeenCalledTimes(1);
  });

  test('si el push falla, la invitación queda creada igual', async () => {
    const { service, notificationsService } = build();
    notificationsService.sendToUser.mockRejectedValueOnce(new Error('expo down') as never);
    await expect(service.invite({ groupId: 'g1', requesterId: 'leader', userId: 'target' })).resolves.toBe(DTO);
  });
});

describe('accept', () => {
  const pending = { id: 'inv-1', groupId: 'g1', userId: 'target', invitedBy: 'leader', status: 'pending' };

  test('el invitado acepta: membresía + accepted en la transacción del repositorio', async () => {
    const { service, invitationRepository } = build({ existing: pending });
    await expect(service.accept({ invitationId: 'inv-1', requesterId: 'target' })).resolves.toBe(DTO);
    expect(invitationRepository.accept).toHaveBeenCalledWith('inv-1', 'g1', 'target');
  });

  test('grupo borrado: la invitación cayó en cascada → 404', async () => {
    const { service } = build({ existing: null });
    await expect(service.accept({ invitationId: 'inv-x', requesterId: 'target' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  test('no es el invitado → 403', async () => {
    const { service } = build({ existing: pending });
    await expect(service.accept({ invitationId: 'inv-1', requesterId: 'intruso' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  test('ya respondida → 409', async () => {
    const { service } = build({ existing: { ...pending, status: 'declined' } });
    await expect(service.accept({ invitationId: 'inv-1', requesterId: 'target' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  test('ya era miembro por otro camino → 409, pero la invitación se cierra igual', async () => {
    const { service, invitationRepository } = build({ existing: pending });
    invitationRepository.accept.mockResolvedValueOnce({ alreadyMember: true });
    await expect(service.accept({ invitationId: 'inv-1', requesterId: 'target' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(invitationRepository.accept).toHaveBeenCalledTimes(1);
  });
});

describe('decline / cancel', () => {
  const pending = { id: 'inv-1', groupId: 'g1', userId: 'target', invitedBy: 'leader', status: 'pending' };

  test('el invitado rechaza → declined', async () => {
    const { service, invitationRepository } = build({ existing: pending });
    await expect(service.decline({ invitationId: 'inv-1', requesterId: 'target' })).resolves.toEqual({
      success: true,
    });
    expect(invitationRepository.decline).toHaveBeenCalledWith('inv-1');
  });

  test('un admin cancela una pendiente (aunque no sea quien invitó): la invitación es del grupo', async () => {
    const { service, invitationRepository } = build({ role: 'admin', existing: pending });
    await expect(service.cancel({ invitationId: 'inv-1', requesterId: 'otro-admin' })).resolves.toEqual({
      success: true,
    });
    expect(invitationRepository.delete).toHaveBeenCalledWith('inv-1');
  });

  test('un miembro raso no puede cancelar → 403', async () => {
    const { service } = build({ role: 'member', existing: pending });
    await expect(service.cancel({ invitationId: 'inv-1', requesterId: 'u' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
