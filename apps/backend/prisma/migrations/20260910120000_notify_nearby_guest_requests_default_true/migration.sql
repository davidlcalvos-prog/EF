-- 2026-09-10 — DECISIÓN DE PRODUCTO (David): el aviso "se busca comodín cerca
-- tuyo" (match_guest_request) ya funcionaba, pero dependía de una preferencia
-- opt-in (profiles.notifyNearbyGuestRequests) con default false: en la prueba
-- cerrada nadie lo recibía aunque estuviera dentro del radio. Pasa a ACTIVADO:
--   1) para cuentas nuevas, cambiando el default de la columna;
--   2) para las cuentas YA creadas, con un UPDATE explícito — cambio deliberado
--      de comportamiento sobre usuarios existentes, no un efecto colateral.
-- El toggle en Editar perfil sigue existiendo: quien no quiera el aviso lo apaga.
-- Además, desde esta misma fecha todo push respeta user_preferences.notifications
-- (silenciar todo), así que este default no puede pasar por encima de quien
-- desactivó las notificaciones en general.

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "notifyNearbyGuestRequests" SET DEFAULT true;

-- Backfill deliberado sobre cuentas existentes
UPDATE "profiles" SET "notifyNearbyGuestRequests" = true;
