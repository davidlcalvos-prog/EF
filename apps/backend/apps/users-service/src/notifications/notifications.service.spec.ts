import type { PushData } from '@ef/contracts';

const mockSend = jest.fn(async (chunk: unknown[]) => chunk.map(() => ({ status: 'ok' })));
const mockChunk = jest.fn((messages: unknown[]) => [messages]);

jest.mock('expo-server-sdk', () => ({
  Expo: Object.assign(
    jest.fn().mockImplementation(() => ({
      chunkPushNotifications: mockChunk,
      sendPushNotificationsAsync: mockSend,
    })),
    { isExpoPushToken: (token: string) => token.startsWith('ExponentPushToken[') },
  ),
}));

import { NotificationsService } from './notifications.service';

const DATA: PushData = { v: 1, type: 'match_created', screen: 'MatchDetail', params: { matchId: 'm1' } };
const token = (n: string) => `ExponentPushToken[${n}]`;

function build(options: { muted?: string[]; tokens?: { userId: string; token: string }[] } = {}) {
  const prisma = {
    userPreferences: {
      findMany: jest.fn(async () => (options.muted ?? []).map((userId) => ({ userId }))),
    },
  };
  const pushTokenRepository = {
    // Como el repositorio real: solo los tokens de los ids pedidos.
    findByUserIds: jest.fn(async (ids: string[]) =>
      (options.tokens ?? []).filter((row) => ids.includes(row.userId)),
    ),
    removeByTokenValue: jest.fn(async () => undefined),
  };
  const service = new NotificationsService(pushTokenRepository as never, prisma as never);
  return { service, prisma, pushTokenRepository };
}

beforeEach(() => {
  mockSend.mockClear();
  mockChunk.mockClear();
});

describe('NotificationsService — filtro de user_preferences.notifications', () => {
  test('un usuario con notifications=false NO recibe, aunque tenga token', async () => {
    const { service, prisma, pushTokenRepository } = build({
      muted: ['u2'],
      tokens: [
        { userId: 'u1', token: token('a') },
        { userId: 'u2', token: token('b') },
      ],
    });
    await service.sendToUsers(['u1', 'u2'], 'T', 'B', DATA);

    expect(prisma.userPreferences.findMany).toHaveBeenCalledWith({
      where: { userId: { in: ['u1', 'u2'] }, notifications: false },
      select: { userId: true },
    });
    // Los tokens se piden SOLO para los no silenciados.
    expect(pushTokenRepository.findByUserIds).toHaveBeenCalledWith(['u1']);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sent = mockSend.mock.calls[0][0] as { to: string }[];
    expect(sent.map((m) => m.to)).toEqual([token('a')]);
  });

  test('si todos están silenciados no se consulta tokens ni se llama a Expo', async () => {
    const { service, pushTokenRepository } = build({ muted: ['u1'] });
    await service.sendToUsers(['u1'], 'T', 'B', DATA);
    expect(pushTokenRepository.findByUserIds).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('sendToUser pasa por el mismo camino (y el mismo filtro) que sendToUsers', async () => {
    const { service, prisma } = build({ muted: ['u1'], tokens: [{ userId: 'u1', token: token('a') }] });
    await service.sendToUser('u1', 'T', 'B', DATA);
    expect(prisma.userPreferences.findMany).toHaveBeenCalledTimes(1);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe('NotificationsService — envío en lote', () => {
  test('deduplica userIds, ignora tokens inválidos y manda data con espejo legado', async () => {
    const { service } = build({
      tokens: [
        { userId: 'u1', token: token('a') },
        { userId: 'u1', token: token('a2') },
        { userId: 'u3', token: 'basura' },
      ],
    });
    await service.sendToUsers(['u1', 'u1', 'u3'], 'Nuevo partido', 'cuerpo', DATA);
    const sent = mockSend.mock.calls[0][0] as { to: string; data: Record<string, unknown> }[];
    expect(sent.map((m) => m.to).sort()).toEqual([token('a'), token('a2')].sort());
    expect(sent[0].data).toMatchObject({ ...DATA, matchId: 'm1' }); // espejo para builds ≤ 5
  });

  test('sin destinatarios o sin tokens no llama a Expo', async () => {
    const { service } = build();
    await service.sendToUsers([], 'T', 'B', DATA);
    await service.sendToUsers(['sin-token'], 'T', 'B', DATA);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('DeviceNotRegistered borra el token; otros errores solo se loguean', async () => {
    const { service, pushTokenRepository } = build({
      tokens: [
        { userId: 'u1', token: token('dead') },
        { userId: 'u2', token: token('ok') },
      ],
    });
    mockSend.mockResolvedValueOnce([
      { status: 'error', message: 'gone', details: { error: 'DeviceNotRegistered' } },
      { status: 'error', message: 'creds', details: { error: 'InvalidCredentials' } },
    ] as never);
    await service.sendToUsers(['u1', 'u2'], 'T', 'B', DATA);
    expect(pushTokenRepository.removeByTokenValue).toHaveBeenCalledTimes(1);
    expect(pushTokenRepository.removeByTokenValue).toHaveBeenCalledWith(token('dead'));
  });
});
