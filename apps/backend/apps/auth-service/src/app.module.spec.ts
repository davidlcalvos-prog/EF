import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@ef/database';
import { AppModule } from './app.module';

// El transporte SMTP real no se crea en tests (MailService lo construye en onModuleInit si hay SMTP_*).
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn(), verify: jest.fn() })),
}));

/**
 * Smoke test del árbol de dependencias COMPLETO de auth-service (ver el
 * comentario en api-gateway/src/app.module.spec.ts: incidente del build 7).
 * PrismaService se reemplaza por un objeto vacío: el contenedor se arma
 * entero sin base de datos.
 */
describe('auth-service AppModule — el árbol de dependencias de Nest compila', () => {
  test('compila e inicializa completo', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    await moduleRef.init();
    await moduleRef.close();
  }, 60_000);
});
