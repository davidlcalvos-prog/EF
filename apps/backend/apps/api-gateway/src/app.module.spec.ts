import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';

/**
 * Smoke test del árbol de dependencias COMPLETO del gateway.
 *
 * Por qué existe (incidente del build 7, 2026-09-11): AuthProxyController
 * empezó a inyectar JwtStrategy, GatewayAuthModule no lo exportaba, y el
 * gateway murió al arrancar en producción con UnknownDependenciesException.
 * Los specs unitarios instancian servicios a mano (`new X(mock)`), así que
 * nunca construyen el contenedor de Nest y no podían verlo. Este test lo
 * construye igual que `NestFactory.create(AppModule)` — `compile()` resuelve
 * TODAS las inyecciones y `init()` instancia además guards, filtros e
 * interceptores de cada ruta — sin abrir puertos ni conectarse a nada:
 * los ClientProxy TCP no conectan hasta el primer `send`.
 *
 * Regla: cada servicio tiene su `app.module.spec.ts`. Si agregás una
 * dependencia a un controller/servicio y el módulo no la provee, este test
 * falla en segundos con el mismo mensaje que daría producción.
 */
describe('api-gateway AppModule — el árbol de dependencias de Nest compila', () => {
  test('compila e inicializa completo (rutas, guards, estrategias)', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    await app.close();
  }, 60_000);
});
