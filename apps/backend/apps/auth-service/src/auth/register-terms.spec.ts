import 'reflect-metadata'; // decoradores de class-validator/transformer fuera del bootstrap de Nest
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from '@ef/contracts';
import { AuthService } from './auth.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const VALID = {
  email: 'Ana@Gmail.com',
  name: 'Ana Pérez',
  password: 'Clave1234',
  acceptTerms: true,
  termsVersion: '2026-09-11',
};

async function errorsOf(body: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(RegisterDto, body);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

/**
 * La aceptación se exige en el BACKEND (class-validator sobre RegisterDto en
 * el gateway): el checkbox del navegador no es garantía.
 */
describe('RegisterDto — aceptación de términos', () => {
  test('cuerpo completo: válido', async () => {
    await expect(errorsOf(VALID)).resolves.toEqual([]);
  });

  test('sin acceptTerms → 400', async () => {
    const { acceptTerms: _omit, ...body } = VALID;
    await expect(errorsOf(body)).resolves.toContain('acceptTerms');
  });

  test('acceptTerms false o "true" (string) → 400', async () => {
    await expect(errorsOf({ ...VALID, acceptTerms: false })).resolves.toContain('acceptTerms');
    await expect(errorsOf({ ...VALID, acceptTerms: 'true' })).resolves.toContain('acceptTerms');
  });

  test('termsVersion ausente o con formato distinto de YYYY-MM-DD → 400', async () => {
    const { termsVersion: _omit, ...body } = VALID;
    await expect(errorsOf(body)).resolves.toContain('termsVersion');
    await expect(errorsOf({ ...VALID, termsVersion: 'v1' })).resolves.toContain('termsVersion');
    await expect(errorsOf({ ...VALID, termsVersion: '11/09/2026' })).resolves.toContain(
      'termsVersion',
    );
  });
});

describe('AuthService.register — trazabilidad', () => {
  test('pasa termsVersion al repositorio (que guarda termsAcceptedAt con hora del servidor)', async () => {
    const userRepository = {
      findByEmail: jest.fn(async () => null),
      create: jest.fn(async (data: { email: string; termsVersion?: string }) => ({
        id: 'u1',
        email: data.email,
        passwordHash: 'h',
        name: 'Ana',
        role: 'Jugador',
        estado: true,
      })),
    };
    const jwtService = { signAsync: jest.fn(async () => 'jwt') };
    const service = new AuthService(
      userRepository as never,
      jwtService as never,
      {} as never,
      {} as never,
      { get: () => undefined } as never,
    );
    await service.register(VALID as never);
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@gmail.com', termsVersion: '2026-09-11' }),
    );
  });
});
