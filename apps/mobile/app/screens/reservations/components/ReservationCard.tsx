import { Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { translate } from "@/i18n/translate"
import type { MyReservationApiDto, ReservationStatusApi } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { formatDate } from "@/utils/formatDate"

export interface ReservationCardProps {
  reservation: MyReservationApiDto
  onPress: () => void
}

const STATUS_COLORS = {
  pending: eliteForgeColors.orange,
  confirmed: eliteForgeColors.emerald,
  cancelled: "#E74C3C",
} as const satisfies Record<ReservationStatusApi, string>

export function statusLabel(status: ReservationStatusApi) {
  return translate(`reservationsScreen:status_${status}` as never)
}

/** "18 Aug 2026, 19:00 – 20:00" si es el mismo día, rango completo si no. */
export function formatReservationRange(startsAt: string, endsAt: string): string {
  const sameDay = formatDate(startsAt, "yyyy-MM-dd") === formatDate(endsAt, "yyyy-MM-dd")
  const start = formatDate(startsAt, "d MMM yyyy, HH:mm")
  const end = formatDate(endsAt, sameDay ? "HH:mm" : "d MMM yyyy, HH:mm")
  return `${start} – ${end}`
}

export function ReservationCard({ reservation, onPress }: ReservationCardProps) {
  const motion = useInteractiveMotion("card")

  return (
    <Pressable
      onPress={onPress}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      onHoverIn={motion.onHoverIn}
      onHoverOut={motion.onHoverOut}
      accessibilityRole="button"
    >
      <XStack
        backgroundColor={eliteForgeColors.carbonElevated}
        borderRadius={14}
        borderWidth={1}
        borderColor={eliteForgeColors.carbonBorder}
        padding={14}
        marginBottom={12}
        alignItems="center"
        gap={12}
      >
        <XStack
          width={44}
          height={44}
          borderRadius={22}
          backgroundColor="rgba(0,206,200,0.12)"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="calendar" size={22} color={eliteForgeColors.emerald} />
        </XStack>

        <YStack flex={1} gap={4}>
          <XStack alignItems="center" gap={8} flexWrap="wrap">
            <Text color="#FFFFFF" fontWeight="700" fontSize={15} numberOfLines={1}>
              {reservation.venueName}
              {reservation.courtName ? ` · ${reservation.courtName}` : ""}
            </Text>
            <XStack
              backgroundColor="rgba(255,255,255,0.08)"
              borderRadius={6}
              paddingHorizontal={8}
              paddingVertical={2}
            >
              <Text color={STATUS_COLORS[reservation.status]} fontSize={11} fontWeight="700">
                {statusLabel(reservation.status)}
              </Text>
            </XStack>
          </XStack>

          <Text color="rgba(255,255,255,0.5)" fontSize={13} numberOfLines={1}>
            {formatReservationRange(reservation.startsAt, reservation.endsAt)}
          </Text>

          {reservation.status === "pending" ? (
            <Text color={eliteForgeColors.orange} fontSize={12} numberOfLines={1}>
              {translate("reservationsScreen:pendingNote")}
            </Text>
          ) : null}

          {reservation.notes ? (
            <Text color="rgba(255,255,255,0.4)" fontSize={12} numberOfLines={1}>
              {reservation.notes}
            </Text>
          ) : null}
        </YStack>

        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
      </XStack>
    </Pressable>
  )
}
