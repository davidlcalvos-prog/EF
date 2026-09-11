-- 2026-09-11 — Invitaciones a grupo con aceptar / rechazar.
--
-- DECISIÓN DE PRODUCTO (David, 2026-09-11): las membresías YA EXISTENTES quedan
-- como están — son miembros y siguen siéndolo; no se les pregunta
-- retroactivamente. Esta migración NO modifica `group_memberships` a propósito
-- (ni columnas ni filas): al usar una TABLA APARTE para las invitaciones, toda
-- fila de `group_memberships` sigue significando "es miembro" y ninguna
-- consulta de membresías tiene que filtrar pendientes. Un invitado no existe en
-- `group_memberships` hasta que acepta (la membresía se crea en la misma
-- transacción que marca la invitación como aceptada).
--
-- UNIQUE (groupId, userId): una fila por par. Tras un rechazo se reabre a
-- `pending` (reinvitar); nunca se duplica. Si dos líderes invitan a la vez, el
-- segundo INSERT falla por el unique y el servicio responde 409.

-- CreateEnum
CREATE TYPE "GroupInvitationStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateTable
CREATE TABLE "group_invitations" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "invitedBy" UUID NOT NULL,
    "status" "GroupInvitationStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_invitations_groupId_userId_key" ON "group_invitations"("groupId", "userId");
CREATE INDEX "group_invitations_userId_status_idx" ON "group_invitations"("userId", "status");

-- AddForeignKey
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
