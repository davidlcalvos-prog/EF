import { Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { translate } from "@/i18n/translate"
import type { MatchStatusApi, MatchSummaryApiDto, MatchTypeApi } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { formatDate } from "@/utils/formatDate"

export interface MatchCardProps {
  match: MatchSummaryApiDto
  groupName?: string
  onPress: () => void
}

const STATUS_COLORS = {
  draft: eliteForgeColors.orange,
  pending_opponent: eliteForgeColors.orange,
  scheduled: eliteForgeColors.emerald,
  played: "rgba(255,255,255,0.55)",
  cancelled: "#E74C3C",
} as const satisfies Record<MatchStatusApi, string>

export function statusLabel(status: MatchStatusApi) {
  return translate(`matchesScreen:status_${status}` as never)
}

export function typeLabel(type: MatchTypeApi) {
  return translate(`matchesScreen:type_${type}` as never)
}

export function MatchCard({ match, groupName, onPress }: MatchCardProps) {
  const motion = useInteractiveMotion("card")
  const dateLabel = match.scheduledAt
    ? formatDate(match.scheduledAt, "d MMM yyyy, HH:mm")
    : translate("matchesScreen:noDate")

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
          <Ionicons name="football" size={22} color={eliteForgeColors.emerald} />
        </XStack>

        <YStack flex={1} gap={4}>
          <XStack alignItems="center" gap={8} flexWrap="wrap">
            <Text color="#FFFFFF" fontWeight="700" fontSize={15}>
              {match.format}
            </Text>
            <XStack
              backgroundColor="rgba(255,255,255,0.08)"
              borderRadius={6}
              paddingHorizontal={8}
              paddingVertical={2}
            >
              <Text color={STATUS_COLORS[match.status]} fontSize={11} fontWeight="700">
                {statusLabel(match.status)}
              </Text>
            </XStack>
            {match.type === "vs" ? (
              <XStack
                backgroundColor="rgba(255,140,0,0.15)"
                borderRadius={6}
                paddingHorizontal={8}
                paddingVertical={2}
              >
                <Text color={eliteForgeColors.orange} fontSize={11} fontWeight="700">
                  {typeLabel(match.type)}
                </Text>
              </XStack>
            ) : null}
          </XStack>

          <Text color="rgba(255,255,255,0.5)" fontSize={13} numberOfLines={1}>
            {groupName ? `${groupName} · ` : ""}
            {dateLabel}
          </Text>

          <Text color="rgba(255,255,255,0.5)" fontSize={13}>
            {translate("matchesScreen:participantCount", {
              count: match.participantCount,
              max: match.maxPlayers,
            })}
          </Text>
        </YStack>

        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
      </XStack>
    </Pressable>
  )
}
