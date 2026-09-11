import 'reflect-metadata';
import { UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';
import { SessionStateResponse } from '@ef/contracts';
import { JwtStrategy } from './jwt.strategy';

const PAYLOAD = { sub: 'u1', email: 'ana@gmail.com', role: 'Jugador' };
/** passwordChangedAt con milisegundos (Prisma guarda `new Date()`); el iat del JWT va en segundos enteros. */
const CHANGED_AT_MS = Date.parse('2026-09-11T12:00:00.800Z');
const CHANGED_AT_SEC = Math.floor(CHANGED_AT_MS / 1000);

function build(state: SessionStateResponse) {
  const authClient = { send: jest.fn(() => of(state)) };
  const config = { get: () => 'secreto-de-test' };
  const strategy = new JwtStrategy(config as never, authClient as never);
  return { strategy, authClient };
}

describe('JwtStrategy.validate — revocación por passwordChangedAt', () => {
  test('el token firmado en el MISMO segundo del cambio (el que devuelve password/change) es válido', async () => {
    const { strategy } = build({ estado: true, passwordChangedAt: CHANGED_AT_MS });
    await expect(strategy.validate({ ...PAYLOAD, iat: CHANGED_AT_SEC })).resolves.toEqual(
      expect.objectContaining({ sub: 'u1' }),
    );
  });

  test('un token del segundo anterior al cambio se rechaza', async () => {
    const { strategy } = build({ estado: true, passwordChangedAt: CHANGED_AT_MS });
    await expect(strategy.validate({ ...PAYLOAD, iat: CHANGED_AT_SEC - 1 })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  test('sin cambio de clave registrado, cualquier iat pasa', async () => {
    const { strategy } = build({ estado: true, passwordChangedAt: null });
    await expect(strategy.validate({ ...PAYLOAD, iat: 1 })).resolves.toBeDefined();
  });

  test('cuenta desactivada → 401 aunque el token sea posterior', async () => {
    const { strategy } = build({ estado: false, passwordChangedAt: null });
    await expect(strategy.validate({ ...PAYLOAD, iat: CHANGED_AT_SEC + 100 })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  test('caché de 10 s por usuario; forget() la invalida (lo llama el gateway tras password/change)', async () => {
    const { strategy, authClient } = build({ estado: true, passwordChangedAt: null });
    await strategy.validate({ ...PAYLOAD, iat: 1 });
    await strategy.validate({ ...PAYLOAD, iat: 1 });
    expect(authClient.send).toHaveBeenCalledTimes(1);
    strategy.forget('u1');
    await strategy.validate({ ...PAYLOAD, iat: 1 });
    expect(authClient.send).toHaveBeenCalledTimes(2);
  });
});
