import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAuth } from "@/context/AuthContext"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { api, type MatchParticipantApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { formatDate } from "@/utils/formatDate"

import { statusLabel, typeLabel } from "./components/MatchCard"
import { useMatchDetail } from "./useMatchDetail"

const AVATAR_PALETTE = ["#00CEC8", "#FF8C00", "#7B68EE", "#2ECC71", "#E74C3C"]

function pickAvatarColor(seed: string) {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

function describeProblem(problem: GeneralApiProblem): string {
  switch (problem.kind) {
    case "forbidden":
      return translate("matchesScreen:actionForbidden")
    case "conflict":
      return translate("matchesScreen:joinConflict")
    case "not-found":
      return translate("matchesScreen:notFoundError")
    default:
      return translate("matchesScreen:actionError")
  }
}

export function MatchDetailScreen({ route, navigation }: AppStackScreenProps<"MatchDetail">) {
  const { matchId } = route.params
  const { authUserId } = useAuth()
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { match, loading, error, refresh, join, leave, updateStatus, accept, reject } =
    useMatchDetail(matchId)
  const [isOriginLeader, setIsOriginLeader] = useState(false)
  const [isOpponentLeader, setIsOpponentLeader] = useState(false)
  const [busy, setBusy] = useState(false)

  const isGroupLeader = useCallback(
    async (groupId: string) => {
      if (!authUserId) return false
      const result = await api.getGroupDetail(groupId)
      if (result.kind !== "ok") return false
      const ownRole = result.group.members.find((m) => m.userId === authUserId)?.role
      return ownRole === "creator" || ownRole === "admin"
    },
    [authUserId],
  )

  useEffect(() => {
    if (!match?.originGroupId || !authUserId) {
      setIsOriginLeader(false)
      setIsOpponentLeader(false)
      return
    }
    let cancelled = false

    isGroupLeader(match.originGroupId).then((leader) => {
      if (!cancelled) setIsOriginLeader(leader)
    })

    if (match.opponentGroupId) {
      isGroupLeader(match.opponentGroupId).then((leader) => {
        if (!cancelled) setIsOpponentLeader(leader)
      })
    } else {
      setIsOpponentLeader(false)
    }

    return () => {
      cancelled = true
    }
  }, [match?.originGroupId, match?.opponentGroupId, authUserId, isGroupLeader])

  const isParticipant = !!match?.participants.some((p) => p.userId === authUserId)
  const hasCapacity = !!match && match.participants.length < match.maxPlayers
  const canManageStatus = isOriginLeader || isOpponentLeader
  const isPendingOpponent = match?.status === "pending_opponent"
  const canRespondToChallenge =
    match?.type === "vs" && isPendingOpponent && isOpponentLeader
  const isWaitingForOpponent = isPendingOpponent && !canRespondToChallenge

  const handleJoin = useCallback(async () => {
    setBusy(true)
    const result = await join()
    setBusy(false)
    if (result.kind !== "ok") {
      Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
    }
  }, [join])

  const handleLeave = useCallback(() => {
    Alert.alert(
      translate("matchesScreen:leaveConfirmTitle"),
      translate("matchesScreen:leaveConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("matchesScreen:leaveMatch"),
          style: "destructive",
          onPress: async () => {
            setBusy(true)
            const result = await leave()
            setBusy(false)
            if (result.kind !== "ok") {
              Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
            }
          },
        },
      ],
    )
  }, [leave])

  const handleMarkPlayed = useCallback(() => {
    Alert.alert(
      translate("matchesScreen:markPlayedConfirmTitle"),
      translate("matchesScreen:markPlayedConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("matchesScreen:markPlayed"),
          onPress: async () => {
            setBusy(true)
            const result = await updateStatus("played")
            setBusy(false)
            if (result.kind !== "ok") {
              Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
            }
          },
        },
      ],
    )
  }, [updateStatus])

  const handleCancelMatch = useCallback(() => {
    Alert.alert(
      translate("matchesScreen:cancelMatchConfirmTitle"),
      translate("matchesScreen:cancelMatchConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("matchesScreen:cancelMatch"),
          style: "destructive",
          onPress: async () => {
            setBusy(true)
            const result = await updateStatus("cancelled")
            setBusy(false)
            if (result.kind !== "ok") {
              Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
            }
          },
        },
      ],
    )
  }, [updateStatus])

  const handleAccept = useCallback(() => {
    Alert.alert(
      translate("matchesScreen:acceptChallengeConfirmTitle"),
      translate("matchesScreen:acceptChallengeConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("matchesScreen:acceptChallenge"),
          onPress: async () => {
            setBusy(true)
            const result = await accept()
            setBusy(false)
            if (result.kind !== "ok") {
              Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
            }
          },
        },
      ],
    )
  }, [accept])

  const handleReject = useCallback(() => {
    Alert.alert(
      translate("matchesScreen:rejectChallengeConfirmTitle"),
      translate("matchesScreen:rejectChallengeConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("matchesScreen:rejectChallenge"),
          style: "destructive",
          onPress: async () => {
            setBusy(true)
            const result = await reject()
            setBusy(false)
            if (result.kind !== "ok") {
              Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
            }
          },
        },
      ],
    )
  }, [reject])

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
      <StatusBar barStyle="light-content" backgroundColor={eliteForgeColors.carbon} />

      <YStack paddingTop={insets.top} paddingHorizontal={horizontalPadding} gap={16} flex={1}>
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
            {match?.format ?? translate("matchesScreen:title")}
          </Text>

          <XStack width={40} height={40} />
        </XStack>

        {loading ? (
          <YStack paddingVertical={48} alignItems="center">
            <ActivityIndicator color={eliteForgeColors.emerald} />
          </YStack>
        ) : error || !match ? (
          <YStack paddingVertical={48} alignItems="center" gap={12}>
            <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
              {translate("matchesScreen:loadError")}
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
            style={{ flex: 1 }}
            contentContainerStyle={{
              maxWidth: contentMaxWidth,
              width: "100%",
              alignSelf: "center",
              paddingBottom: 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            <YStack
              backgroundColor={eliteForgeColors.carbonElevated}
              borderRadius={14}
              borderWidth={1}
              borderColor={eliteForgeColors.carbonBorder}
              padding={16}
              gap={10}
              marginBottom={16}
            >
              <XStack gap={8} flexWrap="wrap">
                <XStack
                  backgroundColor="rgba(255,255,255,0.08)"
                  borderRadius={6}
                  paddingHorizontal={8}
                  paddingVertical={2}
                >
                  <Text color={eliteForgeColors.emerald} fontSize={11} fontWeight="700">
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

              <Text color="#FFFFFF" fontWeight="800" fontSize={20}>
                {match.format}
              </Text>

              <XStack alignItems="center" gap={8}>
                <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.5)" />
                <Text color="rgba(255,255,255,0.6)" fontSize={13}>
                  {translate("matchesScreen:participantCount", {
                    count: match.participants.length,
                    max: match.maxPlayers,
                  })}
                </Text>
              </XStack>

              <XStack alignItems="center" gap={8}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.5)" />
                <Text color="rgba(255,255,255,0.6)" fontSize={13}>
                  {match.scheduledAt
                    ? formatDate(match.scheduledAt, "d MMM yyyy, HH:mm")
                    : translate("matchesScreen:noDate")}
                </Text>
              </XStack>

              <XStack alignItems="center" gap={8}>
                <Ionicons name="shield-outline" size={16} color="rgba(255,255,255,0.5)" />
                <Text color="rgba(255,255,255,0.6)" fontSize={13} numberOfLines={1}>
                  {match.opponentGroupName
                    ? `${match.originGroupName} vs ${match.opponentGroupName}`
                    : match.originGroupName}
                </Text>
              </XStack>
            </YStack>

            <Text color="rgba(255,255,255,0.5)" fontSize={13} marginBottom={8}>
              {translate("matchesScreen:participantsTitle")}
            </Text>

            {match.participants.length === 0 ? (
              <Text color="rgba(255,255,255,0.4)" fontSize={13} marginBottom={16}>
                {translate("matchesScreen:noParticipants")}
              </Text>
            ) : (
              match.participants.map((participant: MatchParticipantApiDto) => (
                <XStack
                  key={participant.userId}
                  alignItems="center"
                  gap={12}
                  paddingVertical={10}
                  borderBottomWidth={1}
                  borderBottomColor="rgba(85,85,85,0.5)"
                >
                  <XStack
                    width={36}
                    height={36}
                    borderRadius={18}
                    backgroundColor={pickAvatarColor(participant.userId) as `#${string}`}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="#FFFFFF" fontWeight="800" fontSize={14}>
                      {participant.name.trim().charAt(0).toUpperCase() || "?"}
                    </Text>
                  </XStack>
                  <YStack flex={1}>
                    <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
                      {participant.name}
                    </Text>
                    <Text color="rgba(255,255,255,0.5)" fontSize={12} numberOfLines={1}>
                      {participant.email}
                    </Text>
                  </YStack>
                </XStack>
              ))
            )}

            <YStack gap={10} paddingTop={20}>
              {match.status === "scheduled" && !isParticipant && hasCapacity ? (
                <Pressable onPress={handleJoin} disabled={busy} accessibilityRole="button">
                  <XStack
                    backgroundColor={eliteForgeColors.emerald}
                    borderRadius={12}
                    paddingVertical={14}
                    alignItems="center"
                    justifyContent="center"
                    opacity={busy ? 0.6 : 1}
                  >
                    <Text color="#1a1a1a" fontWeight="800" fontSize={15}>
                      {translate("matchesScreen:joinMatch")}
                    </Text>
                  </XStack>
                </Pressable>
              ) : null}

              {isParticipant ? (
                <Pressable onPress={handleLeave} disabled={busy} accessibilityRole="button">
                  <XStack
                    backgroundColor="rgba(231,76,60,0.12)"
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="#E74C3C"
                    paddingVertical={14}
                    alignItems="center"
                    justifyContent="center"
                    opacity={busy ? 0.6 : 1}
                  >
                    <Text color="#E74C3C" fontWeight="800" fontSize={15}>
                      {translate("matchesScreen:leaveMatch")}
                    </Text>
                  </XStack>
                </Pressable>
              ) : null}

              {canRespondToChallenge ? (
                <>
                  <Pressable onPress={handleAccept} disabled={busy} accessibilityRole="button">
                    <XStack
                      backgroundColor={eliteForgeColors.emerald}
                      borderRadius={12}
                      paddingVertical={14}
                      alignItems="center"
                      justifyContent="center"
                      opacity={busy ? 0.6 : 1}
                    >
                      <Text color="#1a1a1a" fontWeight="800" fontSize={15}>
                        {translate("matchesScreen:acceptChallenge")}
                      </Text>
                    </XStack>
                  </Pressable>
                  <Pressable onPress={handleReject} disabled={busy} accessibilityRole="button">
                    <XStack
                      backgroundColor="rgba(231,76,60,0.12)"
                      borderRadius={12}
                      borderWidth={1}
                      borderColor="#E74C3C"
                      paddingVertical={14}
                      alignItems="center"
                      justifyContent="center"
                      opacity={busy ? 0.6 : 1}
                    >
                      <Text color="#E74C3C" fontWeight="800" fontSize={15}>
                        {translate("matchesScreen:rejectChallenge")}
                      </Text>
                    </XStack>
                  </Pressable>
                </>
              ) : null}

              {isWaitingForOpponent ? (
                <XStack
                  backgroundColor={eliteForgeColors.carbonInput}
                  borderRadius={12}
                  borderWidth={1}
                  borderColor={eliteForgeColors.carbonBorder}
                  paddingVertical={14}
                  paddingHorizontal={12}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
                    {translate("matchesScreen:waitingForOpponent")}
                  </Text>
                </XStack>
              ) : null}

              {match.status === "scheduled" && canManageStatus ? (
                <Pressable onPress={handleMarkPlayed} disabled={busy} accessibilityRole="button">
                  <XStack
                    backgroundColor={eliteForgeColors.carbonInput}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor={eliteForgeColors.carbonBorder}
                    paddingVertical={14}
                    alignItems="center"
                    justifyContent="center"
                    opacity={busy ? 0.6 : 1}
                  >
                    <Text color="#FFFFFF" fontWeight="800" fontSize={15}>
                      {translate("matchesScreen:markPlayed")}
                    </Text>
                  </XStack>
                </Pressable>
              ) : null}

              {(match.status === "scheduled" || match.status === "pending_opponent") &&
              canManageStatus ? (
                <Pressable onPress={handleCancelMatch} disabled={busy} accessibilityRole="button">
                  <XStack
                    backgroundColor="rgba(231,76,60,0.12)"
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="#E74C3C"
                    paddingVertical={14}
                    alignItems="center"
                    justifyContent="center"
                    opacity={busy ? 0.6 : 1}
                  >
                    <Text color="#E74C3C" fontWeight="800" fontSize={15}>
                      {translate("matchesScreen:cancelMatch")}
                    </Text>
                  </XStack>
                </Pressable>
              ) : null}
            </YStack>
          </ScrollView>
        )}
      </YStack>
    </YStack>
  )
}
