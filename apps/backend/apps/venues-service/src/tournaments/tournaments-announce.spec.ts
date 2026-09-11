import { PushData, TournamentDto } from '@ef/contracts';
import { ANNOUNCE_PAGE_SIZE, TournamentsService } from './tournaments.service';

// expo-server-sdk es ESM: NotificationsService lo importa y jest no lo transforma.
jest.mock('expo-server-sdk', () => ({ Expo: jest.fn() }));

const COPA = {
  id: 't1',
  kind: 'elite_forge',
  status: 'registration',
  name: 'Copa Primavera',
} as unknown as TournamentDto;

/** Ids "u0001"… ordenados: el cursor por id del repositorio real se simula con slice. */
function playerIds(total: number): string[] {
  return Array.from({ length: total }, (_, i) => `u${String(i + 1).padStart(5, '0')}`);
}

function build(options: { players?: number; alreadyAnnounced?: boolean } = {}) {
  const all = playerIds(options.players ?? 0);
  const repository = {
    create: jest.fn(async () => COPA),
    update: jest.fn(async () => COPA),
    claimAnnouncement: jest.fn(async () => !options.alreadyAnnounced),
    listActivePlayerIds: jest.fn(async (afterId: string | null, take: number) => {
      const start = afterId ? all.indexOf(afterId) + 1 : 0;
      return all.slice(start, start + take);
    }),
  };
  const notifications = {
    sendToUsers: jest.fn(
      async (_ids: string[], _title: string, _body: string, _data: PushData) => undefined,
    ),
  };
  const service = new TournamentsService(repository as never, notifications as never);
  return { service, repository, notifications };
}

describe('A3 — anuncio "Copa Elite Forge abrió inscripciones"', () => {
  test('recorre a TODOS los jugadores activos por páginas y llama a sendToUsers una vez por página', async () => {
    const total = ANNOUNCE_PAGE_SIZE * 2 + 37; // 1037 jugadores → 3 páginas
    const { service, repository, notifications } = build({ players: total });

    await service.announceIfOpen(COPA);

    expect(repository.claimAnnouncement).toHaveBeenCalledWith('t1');
    expect(notifications.sendToUsers).toHaveBeenCalledTimes(3);
    const sent = notifications.sendToUsers.mock.calls.flatMap((call) => call[0] as string[]);
    expect(sent).toEqual(playerIds(total));
    // Ningún usuario repetido entre páginas.
    expect(new Set(sent).size).toBe(total);
    // Cada página es una consulta con cursor, nunca un findMany de todos.
    expect(repository.listActivePlayerIds).toHaveBeenCalledWith(null, ANNOUNCE_PAGE_SIZE);
    expect(repository.listActivePlayerIds).toHaveBeenCalledWith('u00500', ANNOUNCE_PAGE_SIZE);
    expect(repository.listActivePlayerIds).toHaveBeenCalledWith('u01000', ANNOUNCE_PAGE_SIZE);
  });

  test('el push lleva el contrato PushData con destino TournamentDetail + tournamentId', async () => {
    const { service, notifications } = build({ players: 3 });
    await service.announceIfOpen(COPA);
    const [ids, title, body, data] = notifications.sendToUsers.mock.calls[0];
    expect(ids).toEqual(['u00001', 'u00002', 'u00003']);
    expect(title).toBe('Nueva Copa Elite Forge');
    expect(body).toContain('Copa Primavera');
    expect(data).toEqual({
      v: 1,
      type: 'tournament_announced',
      screen: 'TournamentDetail',
      params: { tournamentId: 't1' },
    });
  });

  test('una página exacta: la consulta siguiente vuelve vacía y NO se manda un push sin destinatarios', async () => {
    const { service, repository, notifications } = build({ players: ANNOUNCE_PAGE_SIZE });
    await service.announceIfOpen(COPA);
    expect(repository.listActivePlayerIds).toHaveBeenCalledTimes(2);
    expect(notifications.sendToUsers).toHaveBeenCalledTimes(1);
  });

  test('ya anunciada (claim devuelve false) → no manda nada', async () => {
    const { service, repository, notifications } = build({ players: 10, alreadyAnnounced: true });
    await service.announceIfOpen(COPA);
    expect(notifications.sendToUsers).not.toHaveBeenCalled();
    expect(repository.listActivePlayerIds).not.toHaveBeenCalled();
  });

  test('torneo privado o fuera de inscripción → ni siquiera intenta el claim', async () => {
    const { service, repository } = build({ players: 10 });
    await service.announceIfOpen({ ...COPA, kind: 'private' });
    await service.announceIfOpen({ ...COPA, status: 'draft' });
    await service.announceIfOpen({ ...COPA, status: 'active' });
    expect(repository.claimAnnouncement).not.toHaveBeenCalled();
  });

  test('sin jugadores activos no llama a sendToUsers', async () => {
    const { service, notifications } = build({ players: 0 });
    await service.announceIfOpen(COPA);
    expect(notifications.sendToUsers).not.toHaveBeenCalled();
  });

  test('un fallo de Expo a mitad de camino queda en el log y no rompe al llamador', async () => {
    const { service, notifications } = build({ players: 5 });
    notifications.sendToUsers.mockRejectedValueOnce(new Error('expo caído'));
    await expect(service.announceIfOpen(COPA)).resolves.toBeUndefined();
  });
});

describe('A3 — cuándo se dispara', () => {
  test('createEliteForge anuncia (la Copa nace en registration)', async () => {
    const { service, repository } = build();
    const spy = jest.spyOn(service, 'announceIfOpen').mockResolvedValue(undefined);
    await service.createEliteForge('admin', {} as never);
    expect(repository.create).toHaveBeenCalledWith('admin', { kind: 'elite_forge' });
    expect(spy).toHaveBeenCalledWith(COPA);
  });

  test('update con status=registration anuncia; cualquier otro patch no', async () => {
    const { service } = build();
    const spy = jest.spyOn(service, 'announceIfOpen').mockResolvedValue(undefined);
    await service.update('t1', 'admin', { name: 'Otro nombre' });
    await service.update('t1', 'admin', { status: 'active' });
    expect(spy).not.toHaveBeenCalled();
    await service.update('t1', 'admin', { status: 'registration' });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
