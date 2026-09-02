-- Fase W.3: los roles del sistema son datos de referencia obligatorios (sin
-- "Jugador" nadie se registra) — viven en una migración para que
-- `migrate deploy` los garantice en todo entorno, sin depender de scripts
-- manuales (seed.ts / bootstrap-prod.js). Valores copiados literalmente de
-- SYSTEM_ROLES_SEED (libs/common/src/constants/roles.ts) — una migración no
-- puede importar TS. Idempotente: ON CONFLICT DO NOTHING no toca bases que ya
-- tienen los roles (producción y dev). "updatedAt" no tiene default en la DB
-- (lo maneja el cliente de Prisma), por eso se provee explícito.

INSERT INTO "roles" ("name", "description", "createdAt", "updatedAt") VALUES
  ('Viewer', 'Acceso de solo lectura a contenido público.', now(), now()),
  ('Jugador', 'Usuario jugador de la plataforma Elite Forge.', now(), now()),
  ('Empresario', 'Gestión de negocio; asignación solo vía endpoints administrativos.', now(), now()),
  ('Administrador', 'Administración del sistema; asignación solo vía endpoints administrativos.', now(), now())
ON CONFLICT ("name") DO NOTHING;
