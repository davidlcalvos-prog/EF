-- Fase 11.1: comodín múltiple — hasta 5 cupos por búsqueda y varias posiciones aceptadas.

-- AlterTable
ALTER TABLE "match_guest_requests" ADD COLUMN "requestedPositions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "match_guest_requests" ADD COLUMN "slotsTotal" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "match_guest_requests" ADD COLUMN "slotsFilled" INTEGER NOT NULL DEFAULT 0;

-- Backfill: la posición única pasa a ser un array de una; una búsqueda `filled`
-- de la Fase 11 era de 1 cupo ya ocupado (slotsTotal queda en su default 1).
UPDATE "match_guest_requests"
SET
  "requestedPositions" = CASE
    WHEN "requestedPosition" IS NOT NULL THEN ARRAY["requestedPosition"]
    ELSE ARRAY[]::TEXT[]
  END,
  "slotsFilled" = CASE WHEN "status" = 'filled' THEN 1 ELSE 0 END;

-- DropColumn (después del backfill)
ALTER TABLE "match_guest_requests" DROP COLUMN "requestedPosition";
