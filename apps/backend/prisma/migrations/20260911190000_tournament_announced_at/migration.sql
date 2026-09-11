-- 2026-09-11 — A3: aviso push "Copa Elite Forge abrió inscripciones".
--
-- tournaments.announcedAt: cuándo se mandó el push a todos los jugadores
-- activos (rol Jugador). Se fija UNA sola vez, con un UPDATE condicional
-- (kind = elite_forge AND status = registration AND announcedAt IS NULL), así
-- dos ediciones seguidas del torneo no lo anuncian dos veces.
--
-- DECISIÓN DE PRODUCTO (David, 2026-09-11): el aviso sale cuando el torneo
-- ENTRA en inscripción (al crearlo ya en 'registration', o al pasarlo de
-- 'draft' a 'registration'), no al crear un borrador. Solo Copa Elite Forge
-- (kind = elite_forge); los torneos privados de dueños de cancha no avisan.
-- Las filas existentes quedan en NULL a propósito: un torneo que ya estaba en
-- inscripción antes de este cambio NO se anuncia retroactivamente (el push
-- saldría semanas tarde); si el administrador lo pasa a 'registration' de
-- nuevo, sí se anuncia.

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN "announcedAt" TIMESTAMP(3);
