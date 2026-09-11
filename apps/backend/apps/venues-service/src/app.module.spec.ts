import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@ef/database';
import { AppModule } from './app.module';

// expo-server-sdk es ESM: NotificationsService lo importa y jest no lo transforma.
jest.mock('expo-server-sdk', () => ({ Expo: jest.fn() }));

/**
 * Smoke test del árbol de dependencias COMPLETO de venues-service (ver el
 * comentario en api-gateway/src/app.module.spec.ts: incidente del build 7).
 * Cubre, entre otras, la inyección de NotificationsService en
 * TournamentsService (A3) que entró en el mismo build.
 */
describe('venues-service AppModule — el árbol de dependencias de Nest compila', () => {
  test('compila e inicializa completo', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    await moduleRef.init();
    await moduleRef.close();
  }, 60_000);
});
