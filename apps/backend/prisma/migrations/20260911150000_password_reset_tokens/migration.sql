-- 2026-09-11 — Recuperación de contraseña ("olvidé mi contraseña").
--
-- users.passwordChangedAt: último cambio/reset. Null en todas las filas
-- existentes (sin backfill, a propósito): "nunca cambió desde el registro". El
-- gateway rechaza JWT con iat anterior a este valor, así una sesión robada no
-- sobrevive al reset (el JWT dura 7 días y es stateless).
--
-- password_reset_tokens: TABLA APARTE de users (mismo criterio que
-- group_invitations). Solo se guarda el SHA-256 del token (los 32 bytes
-- aleatorios van en el enlace del correo). UNIQUE (userId) = un solo token
-- activo por usuario; pedir otro pisa el anterior. usedAt = canjeado; el canje
-- es un UPDATE atómico WHERE usedAt IS NULL AND expiresAt > now().
-- No toca contraseñas existentes.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_userId_key" ON "password_reset_tokens"("userId");
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
