import { useCallback, useMemo, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useGroups } from "@/screens/groups/useGroups"
import type { TournamentApiDto, TournamentMatchApiDto, TournamentTeamApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { formatDate } from "@/utils/formatDate"

import { EnrollTeamModal } from "./components/EnrollTeamModal"
import { courtSizeLabel, playedCount, sortMatchesByDate, standingSort } from "./tournamentHelpers"
import { useTournamentDetail } from "./useTournamentDetail"

type Tab = "fixture" | "standings" | "teams"

const TABS: { id: Tab; labelKey: string }[] = [
  { id: "fixture", labelKey: "tournamentsScreen:tabFixture" },
  { id: "standings", labelKey: "tournamentsScreen:tabStandings" },
  { id: "teams", labelKey: "tournamentsScreen:tabTeams" },
]

function TabChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <XStack
        paddingHorizontal={14}
        paddingVertical={8}
        borderRadius={10}
        backgroundColor={active ? "rgba(0,206,200,0.15)" : eliteForgeColors.carbonInput}
        borderWidth={1}
        borderColor={active ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder}
      >
        <Text
          color={active ? eliteForgeColors.emerald : "rgba(255,255,255,0.7)"}
          fontSize={13}
          fontWeight="700"
        >
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}

function FixtureCard({
  match,
  teamNameById,
}: {
  match: TournamentMatchApiDto
  teamNameById: Map<string, string>
}) {
  const played = match.status !== "scheduled"
  return (
    <YStack
      backgroundColor={eliteForgeColors.carbonElevated}
      borderRadius={14}
      borderWidth={1}
      borderColor={eliteForgeColors.carbonBorder}
      padding={14}
      gap={6}
      marginBottom={10}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <Text color="rgba(255,255,255,0.45)" fontSize={11} fontWeight="700" letterSpacing={0.5}>
          {match.roundLabel.toUpperCase()}
        </Text>
        <Text color={eliteForgeColors.emerald} fontSize={11} fontWeight="600">
          {match.startsAt
            ? formatDate(match.startsAt, "EEE d MMM · HH:mm")
            : translate("tournamentsScreen:noDate")}
        </Text>
      </XStack>

      <XStack alignItems="center" gap={8}>
        <Text color="#FFFFFF" fontWeight="700" fontSize={14} flex={1} numberOfLines={1}>
          {teamNameById.get(match.homeTeamId) ?? "?"}
        </Text>
        <Text color={played ? eliteForgeColors.orange : "rgba(255,255,255,0.4)"} fontWeight="800" fontSize={14}>
          {match.homeGoals ?? "-"} : {match.awayGoals ?? "-"}
        </Text>
        <Text
          color="#FFFFFF"
          fontWeight="700"
          fontSize={14}
          flex={1}
          numberOfLines={1}
          textAlign="right"
        >
          {teamNameById.get(match.awayTeamId) ?? "?"}
        </Text>
      </XStack>

      <XStack alignItems="center" justifyContent="space-between">
        <Text color="rgba(255,255,255,0.5)" fontSize={12}>
          {match.venueName ?? translate("tournamentsScreen:noVenue")}
        </Text>
        <Text color="rgba(255,255,255,0.5)" fontSize={12}>
          {translate(`tournamentsScreen:matchStatus_${match.status}` as never)}
        </Text>
      </XStack>
    </YStack>
  )
}

function StandingsTable({
  teams,
  matches,
  title,
}: {
  teams: TournamentTeamApiDto[]
  matches: TournamentMatchApiDto[]
  title: string | null
}) {
  const sorted = [...teams].sort(standingSort)
  return (
    <YStack
      backgroundColor={eliteForgeColors.carbonElevated}
      borderRadius={14}
      borderWidth={1}
      borderColor={eliteForgeColors.carbonBorder}
      padding={14}
      gap={8}
      marginBottom={10}
    >
      {title ? (
        <Text color={eliteForgeColors.emerald} fontSize={12} fontWeight="800" letterSpacing={0.5}>
          {title}
        </Text>
      ) : null}
      <XStack gap={4}>
        <Text color="rgba(255,255,255,0.45)" fontSize={11} fontWeight="700" flex={1}>
          {translate("tournamentsScreen:colTeam")}
        </Text>
        {["colPlayed", "colWins", "colDraws", "colLosses", "colGoalDiff", "colPoints"].map((key) => (
          <Text
            key={key}
            color="rgba(255,255,255,0.45)"
            fontSize={11}
            fontWeight="700"
            width={30}
            textAlign="center"
          >
            {translate(`tournamentsScreen:${key}` as never)}
          </Text>
        ))}
      </XStack>
      {sorted.map((team) => (
        <XStack key={team.id} gap={4} alignItems="center">
          <Text color="#FFFFFF" fontSize={13} fontWeight="600" flex={1} numberOfLines={1}>
            {team.name}
          </Text>
          <Text color="rgba(255,255,255,0.7)" fontSize={13} width={30} textAlign="center">
            {playedCount(team, matches)}
          </Text>
          <Text color="rgba(255,255,255,0.7)" fontSize={13} width={30} textAlign="center">
            {team.wins}
          </Text>
          <Text color="rgba(255,255,255,0.7)" fontSize={13} width={30} textAlign="center">
            {team.draws}
          </Text>
          <Text color="rgba(255,255,255,0.7)" fontSize={13} width={30} textAlign="center">
            {team.losses}
          </Text>
          <Text color="rgba(255,255,255,0.7)" fontSize={13} width={30} textAlign="center">
            {team.goalsFor - team.goalsAgainst}
          </Text>
          <Text color={eliteForgeColors.emerald} fontSize={13} fontWeight="800" width={30} textAlign="center">
            {team.points}
          </Text>
        </XStack>
      ))}
    </YStack>
  )
}

export function TournamentDetailScreen({
  route,
  navigation,
}: AppStackScreenProps<"TournamentDetail">) {
  const { tournamentId } = route.params
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { tournament, loading, error, refresh, applyTournament } = useTournamentDetail(tournamentId)
  const { groups } = useGroups()
  const [tab, setTab] = useState<Tab>("fixture")
  const [enrollOpen, setEnrollOpen] = useState(false)

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>()
    tournament?.teams.forEach((team) => map.set(team.id, team.name))
    return map
  }, [tournament?.teams])

  const sortedMatches = useMemo(
    () => (tournament ? sortMatchesByDate(tournament.matches) : []),
    [tournament],
  )

  /** Grupos donde soy líder y que todavía no están inscritos en ESTE torneo. */
  const eligibleGroups = useMemo(() => {
    if (!tournament) return []
    const enrolledIds = new Set(
      tournament.teams.map((t) => t.enrolledGroupId).filter((id): id is string => id != null),
    )
    return groups.filter(
      (g) => (g.role === "creator" || g.role === "admin") && !enrolledIds.has(g.id),
    )
  }, [tournament, groups])

  const canEnroll = tournament?.status === "registration" && eligibleGroups.length > 0

  const standingsBlocks = useMemo(() => {
    if (!tournament) return []
    if (tournament.format === "groups_of_4") {
      const byGroup = new Map<string, TournamentTeamApiDto[]>()
      for (const team of tournament.teams) {
        const key = team.groupId ?? "?"
        const list = byGroup.get(key) ?? []
        list.push(team)
        byGroup.set(key, list)
      }
      return Array.from(byGroup.entries()).map(([groupId, teams]) => ({
        title: translate("tournamentsScreen:groupLabel", { group: groupId }),
        teams,
      }))
    }
    return [{ title: null as string | null, teams: tournament.teams }]
  }, [tournament])

  const handleEnrolled = useCallback(
    (next: TournamentApiDto) => {
      applyTournament(next)
      setEnrollOpen(false)
      setTab("teams")
    },
    [applyTournament],
  )

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
      <StatusBar barStyle="light-content" backgroundColor={eliteForgeColors.carbon} />

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
            {tournament?.name ?? translate("tournamentsScreen:title")}
          </Text>

          {tournament ? (
            <Pressable
              onPress={() =>
                navigation.navigate("TournamentRankings", {
                  tournamentId: tournament.id,
                  tournamentName: tournament.name,
                })
              }
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={translate("rankingsScreen:title")}
            >
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
                <Ionicons name="podium-outline" size={20} color={eliteForgeColors.emerald} />
              </XStack>
            </Pressable>
          ) : (
            <XStack width={40} height={40} />
          )}
        </XStack>

        {loading ? (
          <YStack paddingVertical={48} alignItems="center">
            <ActivityIndicator color={eliteForgeColors.emerald} />
          </YStack>
        ) : error || !tournament ? (
          <YStack paddingVertical={48} alignItems="center" gap={12}>
            <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
              {translate("tournamentsScreen:loadError")}
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
          <>
            <Text color="rgba(255,255,255,0.55)" fontSize={13} textAlign="center">
              {courtSizeLabel(tournament.courtSize)} ·{" "}
              {translate(`tournamentsScreen:format_${tournament.format}` as never)} ·{" "}
              {tournament.status === "registration"
                ? translate("tournamentsScreen:statusRegistration")
                : translate("tournamentsScreen:statusActive")}
            </Text>

            {canEnroll ? (
              <Pressable onPress={() => setEnrollOpen(true)} accessibilityRole="button">
                <XStack
                  backgroundColor={eliteForgeColors.emerald}
                  borderRadius={12}
                  paddingVertical={12}
                  alignItems="center"
                  justifyContent="center"
                  gap={8}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#1a1a1a" />
                  <Text color="#1a1a1a" fontWeight="800" fontSize={14}>
                    {translate("tournamentsScreen:enrollButton")}
                  </Text>
                </XStack>
              </Pressable>
            ) : null}

            <XStack gap={8}>
              {TABS.map((item) => (
                <TabChip
                  key={item.id}
                  label={translate(item.labelKey as never)}
                  active={tab === item.id}
                  onPress={() => setTab(item.id)}
                />
              ))}
            </XStack>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: insets.bottom + 24,
                maxWidth: contentMaxWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {tab === "fixture" &&
                (sortedMatches.length === 0 ? (
                  <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center" paddingVertical={32}>
                    {translate("tournamentsScreen:emptyFixture")}
                  </Text>
                ) : (
                  sortedMatches.map((match) => (
                    <FixtureCard key={match.id} match={match} teamNameById={teamNameById} />
                  ))
                ))}

              {tab === "standings" &&
                (tournament.teams.length === 0 ? (
                  <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center" paddingVertical={32}>
                    {translate("tournamentsScreen:emptyTeams")}
                  </Text>
                ) : (
                  standingsBlocks.map((block, i) => (
                    <StandingsTable
                      key={block.title ?? i}
                      title={block.title}
                      teams={block.teams}
                      matches={tournament.matches}
                    />
                  ))
                ))}

              {tab === "teams" &&
                (tournament.teams.length === 0 ? (
                  <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center" paddingVertical={32}>
                    {translate("tournamentsScreen:emptyTeams")}
                  </Text>
                ) : (
                  tournament.teams.map((team) => (
                    <YStack
                      key={team.id}
                      backgroundColor={eliteForgeColors.carbonElevated}
                      borderRadius={14}
                      borderWidth={1}
                      borderColor={eliteForgeColors.carbonBorder}
                      padding={14}
                      gap={8}
                      marginBottom={10}
                    >
                      <XStack alignItems="center" justifyContent="space-between">
                        <Text color="#FFFFFF" fontWeight="800" fontSize={15}>
                          {team.name}
                        </Text>
                        <Text color="rgba(255,255,255,0.5)" fontSize={12}>
                          {translate("tournamentsScreen:playersCount", {
                            count: team.players.length,
                          })}
                        </Text>
                      </XStack>
                      {team.players.map((player) => (
                        <XStack key={player.id} alignItems="center" gap={8}>
                          <Ionicons
                            name="person-outline"
                            size={14}
                            color="rgba(255,255,255,0.4)"
                          />
                          <Text color="rgba(255,255,255,0.75)" fontSize={13}>
                            {player.name}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>
                  ))
                ))}
            </ScrollView>
          </>
        )}
      </YStack>

      {tournament ? (
        <EnrollTeamModal
          visible={enrollOpen}
          onClose={() => setEnrollOpen(false)}
          tournament={tournament}
          eligibleGroups={eligibleGroups}
          onEnrolled={handleEnrolled}
        />
      ) : null}
    </YStack>
  )
}
