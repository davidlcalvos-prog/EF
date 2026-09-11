-- 2026-09-11 — Aceptación de los Términos y Condiciones en el registro.
--
-- users.termsAcceptedAt: cuándo aceptó (hora del servidor, no del cliente).
-- users.termsVersion:   QUÉ versión aceptó — la fecha de publicación del
--                       documento (p. ej. '2026-09-11'), única fuente de verdad
--                       en apps/web/lib/legal/terms.ts. Sin la versión, dentro
--                       de seis meses no se podría demostrar qué texto firmó.
--
-- DECISIÓN DE PRODUCTO (David, 2026-09-11): los usuarios YA REGISTRADOS (25 a
-- esta fecha) NO tienen que aceptar nada retroactivamente. Esta migración deja
-- ambas columnas en NULL para todas las filas existentes A PROPÓSITO: NULL
-- significa "cuenta anterior a la aceptación obligatoria" (o creada por el
-- administrador, como los dueños de cancha). No hay backfill ni default.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "termsVersion" TEXT;
