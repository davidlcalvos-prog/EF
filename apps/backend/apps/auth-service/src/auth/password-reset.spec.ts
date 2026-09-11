import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthService, RESET_REQUEST_COOLDOWN_MS } from './auth.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const USER = {
  id: 'u1',
  email: 'ana@gmail.com',
  passwordHash: bcrypt.hashSync('Actual123', 4),
  name: 'Ana',
  role: 'Jugador',
  estado: true,
};

/**
 * Repositorio de tokens en memoria con la MISMA semántica que el real:
 * una fila por usuario (upsert), claim = update atómico sobre usedAt null y
 * no vencido. Así los tests prueban reutilización, vencimiento e invalidación
 * al re-pedir sin una base de datos.
 */
function fakeResetRepository(now: () => number) {
  const rows = new Map<
    string,
    { tokenHash: string; expiresAt: Date; requestedAt: Date; usedAt: Date | null }
  >();
  return {
    rows,
    findByUserId: jest.fn(async (userId: string) => {
      const row = rows.get(userId);
      return row ? { userId, ...row } : null;
    }),
    issue: jest.fn(async (userId: string, tokenHash: string, expiresAt: Date) => {
      rows.set(userId, { tokenHash, expiresAt, requestedAt: new Date(now()), usedAt: null });
    }),
    claim: jest.fn(async (tokenHash: string) => {
      for (const [userId, row] of rows) {
        if (row.tokenHash === tokenHash && row.usedAt === null && row.expiresAt.getTime() > now()) {
          row.usedAt = new Date(now());
          return userId;
        }
      }
      return null;
    }),
  };
}

function build(options: { user?: typeof USER | null } = {}) {
  let clock = Date.parse('2026-09-11T12:00:00.000Z');
  const now = () => clock;
  const advance = (ms: number) => {
    clock += ms;
  };
  const userRepository = {
    findByEmail: jest.fn(async () => (options.user === undefined ? USER : options.user)),
    findById: jest.fn(async () => (options.user === undefined ? USER : options.user)),
    updatePassword: jest.fn(async () => undefined),
    findSessionState: jest.fn(async () => ({ estado: true, passwordChangedAt: null })),
  };
  const resetRepository = fakeResetRepository(now);
  const mailService = {
    sendPasswordReset: jest.fn(async (_to: string, _resetUrl: string, _minutes: number) => true),
  };
  const configService = { get: () => 'https://eliteforge.tech' };
  const service = new AuthService(
    userRepository as never,
    {} as never,
    resetRepository as never,
    mailService as never,
    configService as never,
  );
  const nowSpy = jest.spyOn(Date, 'now').mockImplementation(now);
  return { service, userRepository, resetRepository, mailService, advance, nowSpy };
}

/** Extrae el token crudo del enlace que se mandó por correo. */
function sentToken(mailService: { sendPasswordReset: jest.Mock }, call = 0): string {
  const url = mailService.sendPasswordReset.mock.calls[call][1] as string;
  return new URL(url).searchParams.get('token')!;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('forgotPassword — sin enumeración', () => {
  test('correo existente: guarda solo el SHA-256, manda el enlace con el token crudo, responde { ok: true }', async () => {
    const { service, resetRepository, mailService } = build();
    await expect(service.forgotPassword({ email: 'Ana@Gmail.com' })).resolves.toEqual({ ok: true });
    await Promise.resolve(); // el envío es fire-and-forget

    expect(mailService.sendPasswordReset).toHaveBeenCalledTimes(1);
    const token = sentToken(mailService);
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(resetRepository.rows.get('u1')!.tokenHash).toBe(sha256(token));
    expect(resetRepository.rows.get('u1')!.tokenHash).not.toContain(token);
    expect(mailService.sendPasswordReset.mock.calls[0][0]).toBe('ana@gmail.com');
    expect(mailService.sendPasswordReset.mock.calls[0][1]).toContain(
      'https://eliteforge.tech/auth/reset-password?token=',
    );
  });

  test('correo inexistente: misma respuesta, sin token ni correo, y hace el mismo bcrypt.compare', async () => {
    const compare = jest.spyOn(bcrypt, 'compare');
    const { service, resetRepository, mailService } = build({ user: null });
    await expect(service.forgotPassword({ email: 'nadie@gmail.com' })).resolves.toEqual({ ok: true });
    expect(resetRepository.issue).not.toHaveBeenCalled();
    expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    expect(compare).toHaveBeenCalledTimes(1);
  });

  test('cuenta desactivada: misma respuesta, sin correo', async () => {
    const { service, mailService } = build({ user: { ...USER, estado: false } });
    await expect(service.forgotPassword({ email: USER.email })).resolves.toEqual({ ok: true });
    expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  test('si el SMTP falla, la respuesta sigue siendo { ok: true }', async () => {
    const { service, mailService } = build();
    mailService.sendPasswordReset.mockRejectedValueOnce(new Error('535') as never);
    await expect(service.forgotPassword({ email: USER.email })).resolves.toEqual({ ok: true });
  });
});

describe('forgotPassword — rate limit por email y un solo token activo', () => {
  test('pedir dos veces en < 60 s manda UN correo y conserva el token vigente', async () => {
    const { service, resetRepository, mailService, advance } = build();
    await service.forgotPassword({ email: USER.email });
    const first = resetRepository.rows.get('u1')!.tokenHash;
    advance(RESET_REQUEST_COOLDOWN_MS - 1);
    await service.forgotPassword({ email: USER.email });
    expect(mailService.sendPasswordReset).toHaveBeenCalledTimes(1);
    expect(resetRepository.rows.get('u1')!.tokenHash).toBe(first);
  });

  test('pedir de nuevo después de 60 s pisa el token: el enlace anterior deja de valer', async () => {
    const { service, resetRepository, mailService, advance } = build();
    await service.forgotPassword({ email: USER.email });
    const oldToken = sentToken(mailService, 0);
    advance(RESET_REQUEST_COOLDOWN_MS + 1);
    await service.forgotPassword({ email: USER.email });
    const newToken = sentToken(mailService, 1);
    expect(newToken).not.toBe(oldToken);
    expect(resetRepository.rows.size).toBe(1); // sigue habiendo una sola fila

    await expect(service.resetPassword({ token: oldToken, password: 'Nueva1234' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.resetPassword({ token: newToken, password: 'Nueva1234' })).resolves.toEqual({
      ok: true,
    });
  });
});

describe('resetPassword — canje', () => {
  test('canje válido: bcrypt de la nueva y updatePassword (que marca passwordChangedAt)', async () => {
    const { service, userRepository, mailService } = build();
    await service.forgotPassword({ email: USER.email });
    const token = sentToken(mailService);
    await expect(service.resetPassword({ token, password: 'Nueva1234' })).resolves.toEqual({ ok: true });
    expect(userRepository.updatePassword).toHaveBeenCalledTimes(1);
    const [userId, hash] = userRepository.updatePassword.mock.calls[0] as unknown as [string, string];
    expect(userId).toBe('u1');
    expect(bcrypt.compareSync('Nueva1234', hash)).toBe(true);
  });

  test('el mismo enlace NO se puede reutilizar', async () => {
    const { service, userRepository, mailService } = build();
    await service.forgotPassword({ email: USER.email });
    const token = sentToken(mailService);
    await service.resetPassword({ token, password: 'Nueva1234' });
    await expect(service.resetPassword({ token, password: 'Otra12345' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(userRepository.updatePassword).toHaveBeenCalledTimes(1);
  });

  test('vencido a los 30 minutos → 400, sin cambiar la contraseña', async () => {
    const { service, userRepository, mailService, advance } = build();
    await service.forgotPassword({ email: USER.email });
    const token = sentToken(mailService);
    advance(30 * 60_000 + 1);
    await expect(service.resetPassword({ token, password: 'Nueva1234' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  test('token inventado → el mismo 400 que vencido o usado', async () => {
    const { service } = build();
    await expect(
      service.resetPassword({ token: 'x'.repeat(43), password: 'Nueva1234' }),
    ).rejects.toMatchObject({ message: 'invalid_or_expired' });
  });
});

describe('changePassword — logueado', () => {
  test('con la contraseña actual correcta cambia y marca passwordChangedAt', async () => {
    const { service, userRepository } = build();
    await expect(
      service.changePassword({ userId: 'u1', currentPassword: 'Actual123', newPassword: 'Nueva1234' }),
    ).resolves.toEqual({ ok: true });
    expect(userRepository.updatePassword).toHaveBeenCalledWith('u1', expect.any(String));
  });

  test('actual incorrecta → 401, sin tocar la contraseña', async () => {
    const { service, userRepository } = build();
    await expect(
      service.changePassword({ userId: 'u1', currentPassword: 'Mala1234', newPassword: 'Nueva1234' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });
});

test('getSessionState devuelve epoch ms de passwordChangedAt (o null)', async () => {
  const { service, userRepository } = build();
  userRepository.findSessionState.mockResolvedValueOnce({
    estado: true,
    passwordChangedAt: new Date('2026-09-11T12:00:00.000Z'),
  } as never);
  await expect(service.getSessionState('u1')).resolves.toEqual({
    estado: true,
    passwordChangedAt: Date.parse('2026-09-11T12:00:00.000Z'),
  });
  userRepository.findSessionState.mockResolvedValueOnce(null as never);
  await expect(service.getSessionState('nadie')).resolves.toEqual({ estado: false, passwordChangedAt: null });
});
