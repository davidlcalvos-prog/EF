import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Pressable, RefreshControl, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAuth } from "@/context/AuthContext"
import type { PlayerPositionId } from "@/data/suggestPlayerPosition"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { MemberProfileModal } from "@/screens/groups/components/MemberProfileModal"
import { getPositionLabel } from "@/screens/profile/components/ProfileHeader"
import { api, type RankingEntryApiDto, type TournamentRankingsApiResponse } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

/** Oro/plata/bronce para el podio; el resto sin color especial. */
const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const

function useTournamentRankings(tournamentId: string) {
  const [rankings, setRankings] = useState<TournamentRankingsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setRefreshing(true)
    setError(null)

    const result = await api.getTournamentRankings(tournamentId)
    if (result.kind === "ok") {
      setRankings(result.rankings)
    } else {
      setError(result)
    }

    setRefreshing(false)
    setLoading(false)
    inFlightRef.current = false
  }, [tournamentId])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId])

  return { rankings, loading, refreshing, error, refresh }
}

function RankingRow({
  entry,
  rank,
  valueText,
  secondaryText,
  isMe,
  onPress,
}: {
  entry: RankingEntryApiDto
  rank: number
  valueText: string
  secondaryText: string | null
  isMe: boolean
  onPress: () => void
}) {
  const medalColor = rank <= 3 ? MEDAL_COLORS[rank - 1] : null
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <XStack
        alignItems="center"
        gap={10}
        paddingVertical={10}
        paddingHorizontal={10}
        borderRadius={10}
        backgroundColor={isMe ? "rgba(0,206,200,0.1)" : "transparent"}
        borderWidth={isMe ? 1 : 0}
        borderColor={isMe ? eliteForgeColors.emerald : "transparent"}
      >
        <XStack
          width={28}
          height={28}
          borderRadius={14}
          alignItems="center"
          justifyContent="center"
          backgroundColor={medalColor ? `${medalColor}26` : eliteForgeColors.carbonInput}
        >
          {medalColor ? (
            <Ionicons name="medal" size={15} color={medalColor} />
          ) : (
            <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="800">
              {rank}
            </Text>
          )}
        </XStack>

        <YStack flex={1} gap={1}>
          <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
            {entry.displayName}
          </Text>
          {entry.favoritePosition ? (
            <Text color="rgba(255,255,255,0.45)" fontSize={11}>
              {getPositionLabel(entry.favoritePosition as PlayerPositionId)}
            </Text>
          ) : null}
        </YStack>

        <YStack alignItems="flex-end" gap={1}>
          <Text color={eliteForgeColors.emerald} fontWeight="800" fontSize={14}>
            {valueText}
          </Text>
          {secondaryText ? (
            <Text color="rgba(255,255,255,0.45)" fontSize={11}>
              {secondaryText}
            </Text>
          ) : null}
        </YStack>
      </XStack>
    </Pressable>
  )
}

function RankingSection({
  title,
  entries,
  formatValue,
  authUserId,
  onEntryPress,
}: {
  title: string
  entries: RankingEntryApiDto[]
  formatValue: (entry: RankingEntryApiDto) => string
  authUserId?: string
  onEntryPress: (userId: string) => void
}) {
  return (
    <YStack
      backgroundColor={eliteForgeColors.carbonElevated}
      borderRadius={14}
      borderWidth={1}
      borderColor={eliteForgeColors.carbonBorder}
      padding={14}
      gap={6}
      marginBottom={12}
    >
      <Text color="#FFFFFF" fontWeight="800" fontSize={15} marginBottom={4}>
        {title}
      </Text>

      {entries.length === 0 ? (
        <Text color="rgba(255,255,255,0.5)" fontSize={13} paddingVertical={10} textAlign="center">
          {translate("rankingsScreen:emptySection")}
        </Text>
      ) : (
        entries.map((entry, index) => (
          <RankingRow
            key={entry.userId}
            entry={entry}
            rank={index + 1}
            valueText={formatValue(entry)}
            secondaryText={
              entry.secondary != null
                ? translate("rankingsScreen:matchesPlayed", { count: entry.secondary })
                : null
            }
            isMe={entry.userId === authUserId}
            onPress={() => onEntryPress(entry.userId)}
          />
        ))
      )}
    </YStack>
  )
}

export function TournamentRankingsScreen({
  route,
  navigation,
}: AppStackScreenProps<"TournamentRankings">) {
  const { tournamentId, tournamentName } = route.params
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { rankings, loading, refreshing, error, refresh } = useTournamentRankings(tournamentId)
  const { authUserId } = useAuth()
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  const handleEntryPress = useCallback((userId: string) => {
    setProfileUserId(userId)
  }, [])

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
      <YStack paddingTop={insets.top} paddingHorizontal={horizontalPadding} gap={14} flex={1}>
        <XStack alignItems="center" justifyContent="space-between" paddingTop={8}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button">
            <XStack
              width={40}
              height={40}
              borderRadius={12}
              backgroundColor={eliteForgeColors.carbonInput}
              borderWidth={1}
              borderColor={eliteForgeColors.carbonBorder}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="arrow-back" size={20} color={eliteForgeColors.emerald} />
            </XStack>
          </Pressable>

          <Text
            color="#FFFFFF"
            fontWeight="800"
            fontSize={18}
            numberOfLines={1}
            flex={1}
            textAlign="center"
          >
            {translate("rankingsScreen:title")}
          </Text>

          <XStack width={40} height={40} />
        </XStack>

        <Text color="rgba(255,255,255,0.55)" fontSize={13} textAlign="center" numberOfLines={1}>
          {tournamentName}
        </Text>

        {loading ? (
          <YStack paddingVertical={48} alignItems="center">
            <ActivityIndicator color={eliteForgeColors.emerald} />
          </YStack>
        ) : error || !rankings ? (
          <YStack paddingVertical={48} alignItems="center" gap={12}>
            <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
              {translate("rankingsScreen:loadError")}
            </Text>
            <Pressable onPress={refresh} accessibilityRole="button">
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={12}
                paddingHorizontal={18}
                paddingVertical={10}
              >
                <Text color="#1a1a1a" fontWeight="700" fontSize={13}>
                  {translate("matchesScreen:retry")}
                </Text>
              </XStack>
            </Pressable>
          </YStack>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={eliteForgeColors.emerald}
              />
            }
            contentContainerStyle={{
              paddingBottom: insets.bottom + 24,
              maxWidth: contentMaxWidth,
              width: "100%",
              alignSelf: "center",
            }}
          >
            <RankingSection
              title={translate("rankingsScreen:topScorers")}
              entries={rankings.topScorers}
              formatValue={(entry) =>
                translate("rankingsScreen:goalsValue", { count: entry.value })
              }
              authUserId={authUserId}
              onEntryPress={handleEntryPress}
            />

            <RankingSection
              title={translate("rankingsScreen:bestGoalkeepers")}
              entries={rankings.bestGoalkeepers}
              formatValue={(entry) =>
                translate("rankingsScreen:concededValue", { value: entry.value.toFixed(2) })
              }
              authUserId={authUserId}
              onEntryPress={handleEntryPress}
            />

            <RankingSection
              title={translate("rankingsScreen:bestDefenders")}
              entries={rankings.bestDefenders}
              formatValue={(entry) =>
                translate("rankingsScreen:recoveriesValue", { count: entry.value })
              }
              authUserId={authUserId}
              onEntryPress={handleEntryPress}
            />

            <RankingSection
              title={translate("rankingsScreen:topAssisters")}
              entries={rankings.topAssisters}
              formatValue={(entry) =>
                translate("rankingsScreen:assistsValue", { count: entry.value })
              }
              authUserId={authUserId}
              onEntryPress={handleEntryPress}
            />
          </ScrollView>
        )}
      </YStack>

      {profileUserId ? (
        <MemberProfileModal
          visible={profileUserId != null}
          onClose={() => setProfileUserId(null)}
          userId={profileUserId}
          source="rankings"
        />
      ) : null}
    </YStack>
  )
}
