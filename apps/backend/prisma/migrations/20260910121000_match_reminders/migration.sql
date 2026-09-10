-- 2026-09-10 — Recordatorios de partido (12 h y 3 h antes del kickoff).
-- Una fila por (partido, umbral): el UNIQUE es la garantía de "se manda UNA
-- vez" — el cron hace INSERT antes de enviar y, si otra corrida/instancia ya
-- insertó, la violación de unique corta el envío. Guarda el scheduledAt con el
-- que se mandó (scheduledAtSnapshot) para poder decidir qué hacer si algún día
-- existe reprogramar, y sentAt/recipients para auditar "¿se mandó? ¿a cuántos?".
-- Se eligió tabla y no flags booleanos en `matches` (como alertSent6h/3h/1h/30m
-- del aviso de cupo) por esas dos razones: auditoría y reprogramación.

-- CreateTable
CREATE TABLE "match_reminders" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "scheduledAtSnapshot" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "recipients" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "match_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "match_reminders_matchId_kind_key" ON "match_reminders"("matchId", "kind");

-- AddForeignKey
ALTER TABLE "match_reminders" ADD CONSTRAINT "match_reminders_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
