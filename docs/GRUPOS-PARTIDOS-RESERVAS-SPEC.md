# Elite Forge — Especificación: Grupos, Partidos, Reservas y Ranking (Fase 0)

Definiciones de producto resueltas antes de implementar Grupos (Fase 1) y Partidos (Fase 2) del roadmap del MVP. Referencia técnica para quien implemente estos módulos.

## Regla de creación de partidos

| Tipo de partido | Quién puede crearlo | Quién debe confirmarlo |
|---|---|---|
| Interno (jugadores del mismo grupo) | Cualquier miembro del grupo | Se confirma por cupo alcanzado — no requiere aprobación de líder/admin |
| VS (contra otro grupo) | Solo líder o administrador del grupo que reta | El líder o administrador del grupo retado debe aceptar antes de agendar |

## Contratos mínimos de datos

**Group**: `id, name, creatorId, adminIds[] (máx. 2), memberIds[], createdAt`

**GroupMembership**: `groupId, userId, role ('creator' | 'admin' | 'member'), joinedAt`

**Match**: `id, originGroupId, type ('internal' | 'vs'), opponentGroupId (nullable), format, maxPlayers, confirmedPlayerIds[], status ('draft' | 'pending_opponent' | 'scheduled' | 'played' | 'cancelled'), reservationId (nullable), scheduledAt, createdBy`

**Reservation** (ya existe en Prisma): se le agrega `matchId` (nullable) para vincular la reserva con el partido que la originó.

Decisión: Reservas del jugador reutiliza `venues-service` — no se crea un microservicio nuevo.

## Ranking tipo gamer

| Rango | Puntaje promedio (0–100) |
|---|---|
| Bronce | 0–39 |
| Plata | 40–59 |
| Oro | 60–74 |
| Platino | 75–84 |
| Diamante | 85–100 |

Para el MVP se calcula con el promedio de las 6 estadísticas físicas (con el mismo ajuste psicológico 72/28 que ya usa la sugerencia de posición). Cuando exista historial real de partidos, el cálculo debe re-ponderarse dando más peso al desempeño en cancha — deuda técnica intencional, no resolver todavía.

## Privacidad y consentimiento de datos

- Datos públicos por defecto: nombre/apodo, avatar, posición, Tag ID.
- Datos visibles solo para amigos/grupo (sujeto a la privacidad granular ya marcada como pendiente en el producto): estadísticas detalladas, historial de partidos, evaluación psicológica.
- Datos potencialmente comercializables a futuro: deben ser agregados/anonimizados por defecto, nunca datos personales identificables sin consentimiento explícito adicional.
- Acción recomendada en el registro: checkbox de consentimiento separado del de términos y condiciones, del tipo "Autorizo el uso de mis estadísticas de forma anonimizada/agregada para fines de análisis y scouting deportivo".

---

Ver la implementación real en [`docs/BACKEND.md`](./BACKEND.md) y [`docs/FRONTEND.md`](./FRONTEND.md), que puede diferir de esta especificación original en detalles.
