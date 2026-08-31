import { ActivityIndicator, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { translate } from "@/i18n/translate"
import type { MatchGuestRequestApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { formatDate } from "@/utils/formatDate"

export interface GuestRequestCardProps {
  request: MatchGuestRequestApiDto
  applying: boolean
  onApply: () => void
}

export function GuestRequestCard({ request, applying, onApply }: GuestRequestCardProps) {
  const motion = useInteractiveMotion("card")
  const dateLabel = request.match.scheduledAt
    ? formatDate(request.match.scheduledAt, "d MMM yyyy, HH:mm")
    : translate("matchesScreen:noDate")
  const positionLabel =
    request.requestedPositions.length > 0
      ? request.requestedPositions
          .map((position) => translate(`profileScreen:position_${position}` as never))
          .join(", ")
      : translate("matchesScreen:guestAnyPosition")
  const slotsRemaining = Math.max(0, request.slotsTotal - request.slotsFilled)

  return (
    <Pressable
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      onHoverIn={motion.onHoverIn}
      onHoverOut={motion.onHoverOut}
    >
      <YStack
        backgroundColor={eliteForgeColors.carbonElevated}
        borderRadius={14}
        borderWidth={1}
        borderColor={eliteForgeColors.carbonBorder}
        padding={14}
        marginBottom={12}
        gap={8}
      >
        <XStack alignItems="center" justifyContent="space-between">
          <Text color="#FFFFFF" fontWeight="700" fontSize={15} flex={1} numberOfLines={1}>
            {request.match.originGroupName}
          </Text>
          {request.distanceKm != null ? (
            <XStack
              backgroundColor="rgba(0,206,200,0.12)"
              borderRadius={6}
              paddingHorizontal={8}
              paddingVertical={2}
            >
              <Text color={eliteForgeColors.emerald} fontSize={11} fontWeight="700">
                {translate("matchesScreen:guestDistance", {
                  km: request.distanceKm.toFixed(1),
                })}
              </Text>
            </XStack>
          ) : null}
        </XStack>

        <Text color="rgba(255,255,255,0.5)" fontSize={13} numberOfLines={1}>
          {request.match.format} · {dateLabel}
        </Text>

        {request.match.venueName || request.match.city ? (
          <XStack alignItems="center" gap={4}>
            <Ionicons name="location-outline" size={11} color={eliteForgeColors.emerald} />
            <Text color="rgba(255,255,255,0.45)" fontSize={11} numberOfLines={1}>
              {request.match.venueName ?? request.match.city}
            </Text>
          </XStack>
        ) : null}

        <XStack alignItems="center" gap={8} flexWrap="wrap">
          <XStack
            backgroundColor="rgba(255,140,0,0.12)"
            borderRadius={6}
            paddingHorizontal={8}
            paddingVertical={2}
          >
            <Text color={eliteForgeColors.orange} fontSize={11} fontWeight="700">
              {positionLabel}
            </Text>
          </XStack>
          <XStack
            backgroundColor="rgba(0,206,200,0.12)"
            borderRadius={6}
            paddingHorizontal={8}
            paddingVertical={2}
          >
            <Text color={eliteForgeColors.emerald} fontSize={11} fontWeight="700">
              {translate("matchesScreen:guestSlotsRemaining", { count: slotsRemaining })}
            </Text>
          </XStack>
          <Text color="rgba(255,255,255,0.45)" fontSize={12}>
            {translate("matchesScreen:guestApplicantsCount", { count: request.applicationsCount })}
          </Text>
        </XStack>

        {request.myApplicationStatus === "none" ? (
          <Pressable onPress={onApply} disabled={applying} accessibilityRole="button">
            <XStack
              backgroundColor={eliteForgeColors.emerald}
              borderRadius={10}
              paddingVertical={10}
              alignItems="center"
              justifyContent="center"
              opacity={applying ? 0.6 : 1}
            >
              {applying ? <ActivityIndicator size="small" color="#1a1a1a" /> : null}
              <Text color="#1a1a1a" fontWeight="800" fontSize={13} marginLeft={applying ? 8 : 0}>
                {translate("matchesScreen:guestApplyButton")}
              </Text>
            </XStack>
          </Pressable>
        ) : (
          <XStack
            backgroundColor={eliteForgeColors.carbonInput}
            borderRadius={10}
            paddingVertical={10}
            alignItems="center"
            justifyContent="center"
          >
            <Text color="rgba(255,255,255,0.6)" fontWeight="700" fontSize={13}>
              {translate(
                `matchesScreen:guestMyApplicationStatus_${request.myApplicationStatus}` as never,
              )}
            </Text>
          </XStack>
        )}
      </YStack>
    </Pressable>
  )
}
