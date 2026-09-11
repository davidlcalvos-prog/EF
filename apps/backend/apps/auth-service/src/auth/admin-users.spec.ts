import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthService } from './auth.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const USER = {
  id: 'u1',
  email: 'ana@gamil.com',
  passwordHash: 'x',
  name: 'Ana',
  role: 'Jugador',
  estado: true,
};

function build(options: { user?: typeof USER | null; taken?: boolean } = {}) {
  const userRepository = {
    findById: jest.fn(async () => (options.user === undefined ? USER : options.user)),
    findByEmail: jest.fn(async () => (options.taken ? { ...USER, id: 'otro' } : null)),
    updateEmail: jest.fn(async (_id: string, email: string) => ({ ...USER, email })),
  };
  const service = new AuthService(
    userRepository as never,
    {} as never,
    {} as never,
    {} as never,
    { get: () => undefined } as never,
  );
  return { service, userRepository };
}

describe('updateUserEmail (Administrador)', () => {
  test('corrige el typo, normaliza y devuelve el usuario', async () => {
    const { service, userRepository } = build();
    await expect(
      service.updateUserEmail({ userId: 'u1', email: '  Ana@Gmail.com ' }),
    ).resolves.toEqual({ id: 'u1', email: 'ana@gmail.com', name: 'Ana', role: 'Jugador' });
    expect(userRepository.updateEmail).toHaveBeenCalledWith('u1', 'ana@gmail.com');
  });

  test('usuario inexistente → 404', async () => {
    const { service } = build({ user: null });
    await expect(
      service.updateUserEmail({ userId: 'nadie', email: 'a@b.com' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  test('correo ya registrado por otro → 409 sin tocar nada', async () => {
    const { service, userRepository } = build({ taken: true });
    await expect(
      service.updateUserEmail({ userId: 'u1', email: 'otro@gmail.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(userRepository.updateEmail).not.toHaveBeenCalled();
  });

  test('carrera con el unique de users.email (P2002) → 409', async () => {
    const { service, userRepository } = build();
    userRepository.updateEmail.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }) as never,
    );
    await expect(
      service.updateUserEmail({ userId: 'u1', email: 'otro@gmail.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
