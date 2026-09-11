// expo-server-sdk es ESM y jest (CommonJS) no lo parsea; acá no se usa — el
// servicio de notificaciones se mockea entero en build().
jest.mock('expo-server-sdk', () => ({ Expo: jest.fn() }));

import {
  formatKickoff,
  formatRelative,
  MatchRemindersService,
  REMINDER_WINDOW_MS,
} from './match-reminders.service';
import type { ReminderCandidate } from './repositories/match.repository';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-09-10T20:00:00.000Z');

function candidate(hoursUntil: number, claimedKinds: string[] = []): ReminderCandidate {
  return {
    id: 'match-1',
    scheduledAt: new Date(NOW + hoursUntil * HOUR),
    originGroupName: 'Los Pibes',
    claimedKinds,
  };
}

function build() {
  const matchRepository = {
    findMatchesNeedingReminder: jest.fn(async () => [] as ReminderCandidate[]),
    findParticipantUserIds: jest.fn(async () => ['u1', 'u2', 'u3']),
  };
  const reminderRepository = {
    claim: jest.fn(async () => 'claim-1'),
    markSent: jest.fn(async () => undefined),
  };
  const notificationsService = { sendToUsers: jest.fn(async () => undefined) };
  const service = new MatchRemindersService(
    matchRepository as never,
    reminderRepository as never,
    notificationsService as never,
  );
  return { service, matchRepository, reminderRepository, notificationsService };
}

describe('MatchRemindersService.evaluate — umbrales', () => {
  test('a 2 h del kickoff manda SOLO el de 3 h, a los participantes, con contrato PushData', async () => {
    const { service, reminderRepository, notificationsService, matchRepository } = build();
    await expect(service.evaluate(candidate(2), NOW)).resolves.toBe('3h');

    expect(reminderRepository.claim).toHaveBeenCalledTimes(1);
    expect(reminderRepository.claim).toHaveBeenCalledWith('match-1', '3h', new Date(NOW + 2 * HOUR));
    expect(matchRepository.findParticipantUserIds).toHaveBeenCalledWith('match-1');
    expect(notificationsService.sendToUsers).toHaveBeenCalledTimes(1);
    const [userIds, title, body, data] = notificationsService.sendToUsers.mock.calls[0] as unknown as [
      string[],
      string,
      string,
      Record<string, unknown>,
    ];
    expect(userIds).toEqual(['u1', 'u2', 'u3']);
    expect(title).toBe('Recordatorio de partido');
    expect(body).toContain('Los Pibes');
    expect(body).toContain('en 2 horas');
    expect(data).toEqual({
      v: 1,
      type: 'match_reminder',
      screen: 'MatchDetail',
      params: { matchId: 'match-1', reminder: '3h' },
    });
    expect(reminderRepository.markSent).toHaveBeenCalledWith('claim-1', 3);
  });

  test('a 11 h del kickoff manda el de 12 h', async () => {
    const { service, reminderRepository } = build();
    await expect(service.evaluate(candidate(11), NOW)).resolves.toBe('12h');
    expect(reminderRepository.claim).toHaveBeenCalledWith('match-1', '12h', expect.any(Date));
  });

  test('a 13 h no manda nada (fuera de ambos umbrales)', async () => {
    const { service, reminderRepository, notificationsService } = build();
    await expect(service.evaluate(candidate(13), NOW)).resolves.toBeNull();
    expect(reminderRepository.claim).not.toHaveBeenCalled();
    expect(notificationsService.sendToUsers).not.toHaveBeenCalled();
  });

  test('a 2 h con el de 3 h ya reclamado: no manda nada (ni el de 12 h que faltó)', async () => {
    const { service, reminderRepository, notificationsService } = build();
    await expect(service.evaluate(candidate(2, ['3h']), NOW)).resolves.toBeNull();
    expect(reminderRepository.claim).not.toHaveBeenCalled();
    expect(notificationsService.sendToUsers).not.toHaveBeenCalled();
  });

  test('cron caído: a 5 h sin nada enviado manda el de 12 h con el tiempo REAL en el texto', async () => {
    const { service, notificationsService } = build();
    await expect(service.evaluate(candidate(5), NOW)).resolves.toBe('12h');
    const call = notificationsService.sendToUsers.mock.calls[0] as unknown as [string[], string, string];
    expect(call[2]).toContain('en 5 horas');
  });

  test('a 5 h con el de 12 h ya enviado: no manda nada', async () => {
    const { service, notificationsService } = build();
    await expect(service.evaluate(candidate(5, ['12h']), NOW)).resolves.toBeNull();
    expect(notificationsService.sendToUsers).not.toHaveBeenCalled();
  });

  test('kickoff ya pasado: no manda nada', async () => {
    const { service, reminderRepository } = build();
    await expect(service.evaluate(candidate(-1), NOW)).resolves.toBeNull();
    expect(reminderRepository.claim).not.toHaveBeenCalled();
  });
});

describe('MatchRemindersService.evaluate — idempotencia', () => {
  test('si otra corrida/instancia ya reclamó (claim → null), NO envía ni marca', async () => {
    const { service, reminderRepository, notificationsService } = build();
    reminderRepository.claim.mockResolvedValueOnce(null as never);
    await expect(service.evaluate(candidate(2), NOW)).resolves.toBeNull();
    expect(notificationsService.sendToUsers).not.toHaveBeenCalled();
    expect(reminderRepository.markSent).not.toHaveBeenCalled();
  });

  test('dos corridas concurrentes sobre el mismo partido: la base arbitra y sale UN solo push', async () => {
    const { service, reminderRepository, notificationsService } = build();
    // Simula el UNIQUE (matchId, kind): la primera inserta, la segunda recibe P2002 → null.
    reminderRepository.claim
      .mockResolvedValueOnce('claim-1' as never)
      .mockResolvedValueOnce(null as never);
    const results = await Promise.all([
      service.evaluate(candidate(2), NOW),
      service.evaluate(candidate(2), NOW),
    ]);
    expect(results.sort()).toEqual([null, '3h'].sort());
    expect(notificationsService.sendToUsers).toHaveBeenCalledTimes(1);
    expect(reminderRepository.markSent).toHaveBeenCalledTimes(1);
  });

  test('la marca se reclama ANTES de enviar: si el envío falla, la fila queda y no se reintenta', async () => {
    const { service, reminderRepository, notificationsService } = build();
    notificationsService.sendToUsers.mockRejectedValueOnce(new Error('expo down') as never);
    await expect(service.evaluate(candidate(2), NOW)).rejects.toThrow('expo down');
    expect(reminderRepository.claim).toHaveBeenCalledTimes(1);
    expect(reminderRepository.markSent).not.toHaveBeenCalled(); // sentAt queda null: auditable
  });
});

describe('MatchRemindersService.run', () => {
  test('pide la ventana de 12 h y evalúa cada candidato aunque uno falle', async () => {
    const { service, matchRepository, reminderRepository, notificationsService } = build();
    matchRepository.findMatchesNeedingReminder.mockResolvedValueOnce([
      { ...candidate(2), id: 'a' },
      { ...candidate(2), id: 'b' },
    ]);
    reminderRepository.claim
      .mockRejectedValueOnce(new Error('db hiccup') as never)
      .mockResolvedValueOnce('claim-b' as never);
    // `now` fijo: con Date.now() el test dependía del reloj real y en CI
    // (día siguiente) los candidatos ya eran partidos pasados.
    await service.run(NOW);
    expect(matchRepository.findMatchesNeedingReminder).toHaveBeenCalledWith(REMINDER_WINDOW_MS);
    expect(notificationsService.sendToUsers).toHaveBeenCalledTimes(1);
    expect(reminderRepository.markSent).toHaveBeenCalledWith('claim-b', 3);
  });
});

describe('texto', () => {
  test('formatKickoff usa America/Bogota explícito (UTC−5), no la zona del contenedor', () => {
    // 2026-09-11T00:00Z = jueves 10 de septiembre, 19:00 en Bogotá.
    expect(formatKickoff(new Date('2026-09-11T00:00:00.000Z'))).toBe('jueves a las 19:00');
  });

  test('formatRelative redondea al tiempo real que falta', () => {
    expect(formatRelative(45)).toBe('en 45 minutos');
    expect(formatRelative(1)).toBe('en 1 minuto');
    expect(formatRelative(178)).toBe('en 3 horas');
    expect(formatRelative(60)).toBe('en 1 hora');
    expect(formatRelative(719)).toBe('en 12 horas');
  });
});
