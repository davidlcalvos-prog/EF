import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAuth } from "@/context/AuthContext"
import type { PlayerPositionId } from "@/data/suggestPlayerPosition"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { api, type MatchParticipantApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { formatDate } from "@/utils/formatDate"

import { GuestApplicantsModal } from "./components/GuestApplicantsModal"
import { GuestRequestModal } from "./components/GuestRequestModal"
import { statusLabel, typeLabel } from "./components/MatchCard"
import { useMatchDetail } from "./useMatchDetail"
import { useMatchGuestRequest } from "./useMatchGuestRequest"

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

function describeRandomizeProblem(
  result: { kind: "not-full" } | { kind: "wrong-status" } | GeneralApiProblem,
): string {
  switch (result.kind) {
    case "not-full":
      return translate("matchesScreen:randomizeNotFull")
    case "wrong-status":
      return translate("matchesScreen:randomizeWrongStatus")
    case "forbidden":
      return translate("matchesScreen:actionForbidden")
    default:
      return translate("matchesScreen:actionError")
  }
}

function warningLine(warning: {
  team: "A" | "B"
  position: "goalkeeper" | "defense" | "midfield" | "forward"
}) {
  return translate("matchesScreen:warningLine", {
    team: warning.team,
    reason: translate(`matchesScreen:warningPosition_${warning.position}` as never),
  })
}

/**
 * Sección de un lado de un partido vs. Si el backend no mandó participantes
 * de este lado (porque no está confirmado y es el lado rival), `participants`
 * llega vacío aunque `count` sea > 0 — mostramos el conteo solo, sin lista.
 */
function VsSideSection({
  title,
  count,
  capacity,
  participants,
  confirmed,
  accentColor,
}: {
  title: string
  count: number
  capacity: number
  participants: MatchParticipantApiDto[]
  confirmed: boolean
  accentColor: `#${string}`
}) {
  const hidden = !confirmed && participants.length === 0 && count > 0

  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom={4}>
        <Text color={accentColor} fontWeight="800" fontSize={13} numberOfLines={1} flex={1}>
          {title}
        </Text>
        <Text color="rgba(255,255,255,0.5)" fontSize={12}>
          {translate("matchesScreen:sideCount", { count, capacity })}
        </Text>
      </XStack>
      {hidden ? (
        <Text color="rgba(255,255,255,0.35)" fontSize={12} fontStyle="italic">
          {translate("matchesScreen:sideHiddenUntilConfirmed")}
        </Text>
      ) : participants.length === 0 ? (
        <Text color="rgba(255,255,255,0.35)" fontSize={12}>
          {translate("matchesScreen:noParticipants")}
        </Text>
      ) : (
        participants.map((participant) => (
          <ParticipantRow key={participant.userId} participant={participant} />
        ))
      )}
    </YStack>
  )
}

/** Fila reusada para la lista plana y para cada sección de equipo — nunca muestra stats de nadie. */
function ParticipantRow({ participant }: { participant: MatchParticipantApiDto }) {
  return (
    <XStack
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
        <XStack alignItems="center" gap={6}>
          <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
            {participant.name}
          </Text>
          {participant.isGuest ? (
            <XStack
              backgroundColor="rgba(255,140,0,0.15)"
              borderRadius={6}
              paddingHorizontal={6}
              paddingVertical={1}
            >
              <Text color={eliteForgeColors.orange} fontSize={10} fontWeight="700">
                {translate("matchesScreen:guestBadge")}
              </Text>
            </XStack>
          ) : null}
        </XStack>
        <Text color="rgba(255,255,255,0.5)" fontSize={12} numberOfLines={1}>
          {participant.email}
        </Text>
      </YStack>
    </XStack>
  )
}

export function MatchDetailScreen({ route, navigation }: AppStackScreenProps<"MatchDetail">) {
  const { matchId } = route.params
  const { authUserId } = useAuth()
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const {
    match,
    loading,
    error,
    refresh,
    join,
    leave,
    updateStatus,
    accept,
    reject,
    randomizeTeams,
  } = useMatchDetail(matchId)
  const [isOriginLeader, setIsOriginLeader] = useState(false)
  const [isOpponentLeader, setIsOpponentLeader] = useState(false)
  const [isOriginMember, setIsOriginMember] = useState(false)
  const [isOpponentMember, setIsOpponentMember] = useState(false)
  const [busy, setBusy] = useState(false)
  const [guestModalVisible, setGuestModalVisible] = useState(false)
  const [applicantsModalVisible, setApplicantsModalVisible] = useState(false)

  // Comodín (Fase 11) — solo partidos internal; el rol de líder/vice ya lo
  // valida el backend en cada acción, acá solo decide qué mostrar.
  const canManageGuestRequest = isOriginLeader && match?.type === "internal"
  const guestRequest = useMatchGuestRequest(matchId, canManageGuestRequest)

  const checkGroupMembership = useCallback(
    async (groupId: string) => {
      if (!authUserId) return { isMember: false, isLeader: false }
      const result = await api.getGroupDetail(groupId)
      if (result.kind !== "ok") return { isMember: false, isLeader: false }
      const ownRole = result.group.members.find((m) => m.userId === authUserId)?.role
      if (!ownRole) return { isMember: false, isLeader: false }
      return { isMember: true, isLeader: ownRole === "creator" || ownRole === "admin" }
    },
    [authUserId],
  )

  useEffect(() => {
    if (!match?.originGroupId || !authUserId) {
      setIsOriginLeader(false)
      setIsOpponentLeader(false)
      setIsOriginMember(false)
      setIsOpponentMember(false)
      return
    }
    let cancelled = false

    checkGroupMembership(match.originGroupId).then(({ isMember, isLeader }) => {
      if (cancelled) return
      setIsOriginMember(isMember)
      setIsOriginLeader(isLeader)
    })

    if (match.opponentGroupId) {
      checkGroupMembership(match.opponentGroupId).then(({ isMember, isLeader }) => {
        if (cancelled) return
        setIsOpponentMember(isMember)
        setIsOpponentLeader(isLeader)
      })
    } else {
      setIsOpponentMember(false)
      setIsOpponentLeader(false)
    }

    return () => {
      cancelled = true
    }
  }, [match?.originGroupId, match?.opponentGroupId, authUserId, checkGroupMembership])

  const isParticipant = !!match?.participants.some((p) => p.userId === authUserId)
  const isVs = match?.type === "vs"
  const originHasRoom = isVs && (match?.originSideCount ?? 0) < (match?.sideCapacity ?? 0)
  const opponentHasRoom = isVs && (match?.opponentSideCount ?? 0) < (match?.sideCapacity ?? 0)
  const hasCapacity = isVs
    ? (isOriginMember && originHasRoom) || (isOpponentMember && opponentHasRoom)
    : !!match && match.participants.length < match.maxPlayers
  const canManageStatus = isOriginLeader || isOpponentLeader
  const isPendingOpponent = match?.status === "pending_opponent"
  const canRespondToChallenge = match?.type === "vs" && isPendingOpponent && isOpponentLeader
  const isWaitingForOpponent = isPendingOpponent && !canRespondToChallenge

  const isFull = !!match && match.participants.length === match.maxPlayers
  const canRandomizeTeams =
    isOriginLeader && match?.type === "internal" && match?.status === "scheduled" && isFull
  const hasTeams = !!match?.teamsRandomizedAt
  const isRosterConfirmed = !!match?.rosterConfirmedAt

  // Aviso de cupo incompleto cerca de la hora (Fase 6.5.5, sin push — se
  // calcula al vuelo comparando con la hora del dispositivo). Se activa al
  // entrar en la ventana de 6h antes del kickoff y se mantiene aunque el
  // horario ya haya pasado (sin cota inferior): el punto es justamente
  // avisar mientras el partido sigue sin confirmarse cerca de — o después
  // de — la hora en que debía jugarse.
  const msUntilKickoff =
    isVs && match?.scheduledAt ? new Date(match.scheduledAt).getTime() - Date.now() : null
  const originIncomplete = isVs && (match?.originSideCount ?? 0) < (match?.sideCapacity ?? 0)
  const opponentIncomplete = isVs && (match?.opponentSideCount ?? 0) < (match?.sideCapacity ?? 0)
  const isRosterIncomplete = isVs && !isRosterConfirmed && (originIncomplete || opponentIncomplete)
  const showIncompleteBanner =
    isRosterIncomplete && msUntilKickoff !== null && msUntilKickoff <= 6 * 60 * 60 * 1000
  const showUrgentIncompleteBanner =
    isRosterIncomplete && msUntilKickoff !== null && msUntilKickoff <= 30 * 60 * 1000
  const canCancelIncompleteSide =
    (originIncomplete && isOriginLeader) || (opponentIncomplete && isOpponentLeader)

  const runJoin = useCallback(
    async (joinAsGroupId?: string) => {
      setBusy(true)
      const result = await join(joinAsGroupId)
      setBusy(false)
      if (result.kind !== "ok") {
        Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
      }
    },
    [join],
  )

  const handleJoin = useCallback(() => {
    if (!match) return
    // Miembro de los dos grupos del partido: hay que elegir desde cuál se une.
    if (isVs && isOriginMember && isOpponentMember) {
      Alert.alert(
        translate("matchesScreen:selectJoinSideTitle"),
        translate("matchesScreen:selectJoinSideMessage"),
        [
          { text: translate("feedScreen:composeCancel"), style: "cancel" },
          { text: match.originGroupName, onPress: () => runJoin(match.originGroupId) },
          {
            text: match.opponentGroupName ?? "",
            onPress: () => runJoin(match.opponentGroupId ?? undefined),
          },
        ],
      )
      return
    }
    runJoin()
  }, [match, isVs, isOriginMember, isOpponentMember, runJoin])

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

  const runRandomizeTeams = useCallback(async () => {
    setBusy(true)
    const result = await randomizeTeams()
    setBusy(false)
    if (result.kind !== "ok") {
      Alert.alert(translate("matchesScreen:actionError"), describeRandomizeProblem(result))
      return
    }
    if (result.warnings.length > 0) {
      Alert.alert(
        translate("matchesScreen:randomizeWarningsTitle"),
        result.warnings.map(warningLine).join("\n"),
      )
    }
  }, [randomizeTeams])

  const handleRandomizeTeams = useCallback(() => {
    if (!hasTeams) {
      runRandomizeTeams()
      return
    }
    Alert.alert(
      translate("matchesScreen:reRandomizeConfirmTitle"),
      translate("matchesScreen:reRandomizeConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("matchesScreen:reRandomizeTeams"),
          style: "destructive",
          onPress: runRandomizeTeams,
        },
      ],
    )
  }, [hasTeams, runRandomizeTeams])

  const handleReserveVenue = useCallback(() => {
    if (!match) return
    navigation.navigate("Reservations", { matchId: match.id })
  }, [match, navigation])

  const handleSubmitGuestRequest = useCallback(
    async (payload: { requestedPosition?: PlayerPositionId; radiusKm?: number }) => {
      const result = await guestRequest.open(payload)
      return result.kind === "ok"
    },
    [guestRequest],
  )

  const handleCancelGuestRequest = useCallback(() => {
    Alert.alert(
      translate("matchesScreen:guestCancelConfirmTitle"),
      translate("matchesScreen:guestCancelConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("matchesScreen:guestCancelConfirm"),
          style: "destructive",
          onPress: async () => {
            setBusy(true)
            const result = await guestRequest.cancel()
            setBusy(false)
            if (result.kind !== "ok") {
              Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
            }
          },
        },
      ],
    )
  }, [guestRequest])

  const handleAcceptApplicant = useCallback(
    async (applicationId: string) => {
      const result = await guestRequest.accept(applicationId)
      if (result.kind === "ok") {
        await refresh()
        return true
      }
      Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
      return false
    },
    [guestRequest, refresh],
  )

  const handleRejectApplicant = useCallback(
    async (applicationId: string) => {
      const result = await guestRequest.reject(applicationId)
      if (result.kind !== "ok") {
        Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
        return false
      }
      return true
    },
    [guestRequest],
  )

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
                    // En vs sin confirmar, participants solo trae el lado propio
                    // (el backend oculta el rival) — originSideCount/opponentSideCount
                    // siempre reflejan el total real, se muestren o no los nombres.
                    count: isVs
                      ? match.originSideCount + match.opponentSideCount
                      : match.participants.length,
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

              {match.venueName || match.venueText || match.city ? (
                <XStack alignItems="center" gap={8}>
                  <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.5)" />
                  <Text color="rgba(255,255,255,0.6)" fontSize={13} numberOfLines={1}>
                    {match.venueName ?? match.venueText ?? ""}
                    {match.city
                      ? `${match.venueName || match.venueText ? " · " : ""}${match.city}`
                      : ""}
                  </Text>
                </XStack>
              ) : null}

              <XStack alignItems="center" gap={8}>
                <Ionicons name="shield-outline" size={16} color="rgba(255,255,255,0.5)" />
                <Text color="rgba(255,255,255,0.6)" fontSize={13} numberOfLines={1}>
                  {match.opponentGroupName
                    ? `${match.originGroupName} vs ${match.opponentGroupName}`
                    : match.originGroupName}
                </Text>
              </XStack>
            </YStack>

            {showIncompleteBanner ? (
              <YStack
                backgroundColor={
                  showUrgentIncompleteBanner ? "rgba(231,76,60,0.12)" : "rgba(255,140,0,0.1)"
                }
                borderRadius={12}
                borderWidth={1}
                borderColor={showUrgentIncompleteBanner ? "#E74C3C" : eliteForgeColors.orange}
                padding={14}
                gap={8}
                marginBottom={16}
              >
                <XStack alignItems="center" gap={8}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={showUrgentIncompleteBanner ? "#E74C3C" : eliteForgeColors.orange}
                  />
                  <Text
                    color={showUrgentIncompleteBanner ? "#E74C3C" : eliteForgeColors.orange}
                    fontWeight="800"
                    fontSize={13}
                    flex={1}
                  >
                    {translate(
                      showUrgentIncompleteBanner
                        ? "matchesScreen:incompleteRosterUrgentTitle"
                        : "matchesScreen:incompleteRosterBannerTitle",
                    )}
                  </Text>
                </XStack>
                <Text color="rgba(255,255,255,0.7)" fontSize={13} lineHeight={18}>
                  {[
                    originIncomplete
                      ? translate("matchesScreen:incompleteRosterSide", {
                          group: match.originGroupName,
                          missing: match.sideCapacity - match.originSideCount,
                        })
                      : null,
                    opponentIncomplete
                      ? translate("matchesScreen:incompleteRosterSide", {
                          group: match.opponentGroupName ?? "",
                          missing: match.sideCapacity - match.opponentSideCount,
                        })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </Text>
                {showUrgentIncompleteBanner && canCancelIncompleteSide ? (
                  <Pressable onPress={handleCancelMatch} disabled={busy} accessibilityRole="button">
                    <XStack
                      backgroundColor="rgba(231,76,60,0.18)"
                      borderRadius={10}
                      paddingVertical={10}
                      alignItems="center"
                      justifyContent="center"
                      opacity={busy ? 0.6 : 1}
                    >
                      <Text color="#E74C3C" fontWeight="800" fontSize={13}>
                        {translate("matchesScreen:cancelMatch")}
                      </Text>
                    </XStack>
                  </Pressable>
                ) : null}
              </YStack>
            ) : null}

            {guestRequest.request && guestRequest.request.status === "open" ? (
              <YStack
                backgroundColor="rgba(0,206,200,0.08)"
                borderRadius={12}
                borderWidth={1}
                borderColor={eliteForgeColors.emerald}
                padding={14}
                gap={8}
                marginBottom={16}
              >
                <XStack alignItems="center" gap={8}>
                  <Ionicons name="megaphone-outline" size={18} color={eliteForgeColors.emerald} />
                  <Text color={eliteForgeColors.emerald} fontWeight="800" fontSize={13} flex={1}>
                    {translate("matchesScreen:guestOpenBannerTitle")}
                  </Text>
                </XStack>
                <Text color="rgba(255,255,255,0.7)" fontSize={13}>
                  {translate("matchesScreen:guestOpenBannerBody", {
                    position: guestRequest.request.requestedPosition
                      ? translate(
                          `profileScreen:position_${guestRequest.request.requestedPosition}` as never,
                        )
                      : translate("matchesScreen:guestAnyPosition"),
                    radius: guestRequest.request.radiusKm,
                  })}
                </Text>
                {canManageGuestRequest ? (
                  <XStack gap={8}>
                    <Pressable
                      onPress={() => setApplicantsModalVisible(true)}
                      accessibilityRole="button"
                      style={{ flex: 1 }}
                    >
                      <XStack
                        backgroundColor={eliteForgeColors.emerald}
                        borderRadius={10}
                        paddingVertical={10}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="#1a1a1a" fontWeight="800" fontSize={13}>
                          {translate("matchesScreen:guestViewApplicants", {
                            count: guestRequest.request.applicationsCount,
                          })}
                        </Text>
                      </XStack>
                    </Pressable>
                    <Pressable
                      onPress={handleCancelGuestRequest}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      <XStack
                        width={40}
                        height={40}
                        borderRadius={10}
                        backgroundColor="rgba(231,76,60,0.12)"
                        borderWidth={1}
                        borderColor="#E74C3C"
                        alignItems="center"
                        justifyContent="center"
                        opacity={busy ? 0.6 : 1}
                      >
                        <Ionicons name="close" size={18} color="#E74C3C" />
                      </XStack>
                    </Pressable>
                  </XStack>
                ) : null}
              </YStack>
            ) : null}

            {!isVs ? (
              <Text color="rgba(255,255,255,0.5)" fontSize={13} marginBottom={8}>
                {translate("matchesScreen:participantsTitle")}
              </Text>
            ) : null}

            {isVs ? (
              <YStack gap={16} marginBottom={8}>
                <VsSideSection
                  title={match.originGroupName}
                  count={match.originSideCount}
                  capacity={match.sideCapacity}
                  participants={match.participants.filter((p) => p.side === "origin")}
                  confirmed={isRosterConfirmed}
                  accentColor={eliteForgeColors.emerald}
                />
                <VsSideSection
                  title={match.opponentGroupName ?? ""}
                  count={match.opponentSideCount}
                  capacity={match.sideCapacity}
                  participants={match.participants.filter((p) => p.side === "opponent")}
                  confirmed={isRosterConfirmed}
                  accentColor={eliteForgeColors.orange}
                />
              </YStack>
            ) : match.participants.length === 0 ? (
              <Text color="rgba(255,255,255,0.4)" fontSize={13} marginBottom={16}>
                {translate("matchesScreen:noParticipants")}
              </Text>
            ) : hasTeams ? (
              <YStack gap={16} marginBottom={8}>
                <YStack>
                  <Text
                    color={eliteForgeColors.emerald}
                    fontWeight="800"
                    fontSize={13}
                    marginBottom={4}
                  >
                    {translate("matchesScreen:teamATitle")}
                  </Text>
                  {match.participants
                    .filter((p) => p.team === "A")
                    .map((participant) => (
                      <ParticipantRow key={participant.userId} participant={participant} />
                    ))}
                </YStack>
                <YStack>
                  <Text
                    color={eliteForgeColors.orange}
                    fontWeight="800"
                    fontSize={13}
                    marginBottom={4}
                  >
                    {translate("matchesScreen:teamBTitle")}
                  </Text>
                  {match.participants
                    .filter((p) => p.team === "B")
                    .map((participant) => (
                      <ParticipantRow key={participant.userId} participant={participant} />
                    ))}
                </YStack>
              </YStack>
            ) : (
              match.participants.map((participant: MatchParticipantApiDto) => (
                <ParticipantRow key={participant.userId} participant={participant} />
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

              {canRandomizeTeams ? (
                <Pressable
                  onPress={handleRandomizeTeams}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <XStack
                    backgroundColor={eliteForgeColors.carbonInput}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor={eliteForgeColors.emerald}
                    paddingVertical={14}
                    alignItems="center"
                    justifyContent="center"
                    gap={8}
                    opacity={busy ? 0.6 : 1}
                  >
                    <Ionicons name="shuffle-outline" size={18} color={eliteForgeColors.emerald} />
                    <Text color={eliteForgeColors.emerald} fontWeight="800" fontSize={15}>
                      {hasTeams
                        ? translate("matchesScreen:reRandomizeTeams")
                        : translate("matchesScreen:randomizeTeams")}
                    </Text>
                  </XStack>
                </Pressable>
              ) : null}

              {match.status === "scheduled" && canManageStatus ? (
                <Pressable onPress={handleReserveVenue} disabled={busy} accessibilityRole="button">
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
                      {translate("matchesScreen:reserveVenue")}
                    </Text>
                  </XStack>
                </Pressable>
              ) : null}

              {canManageGuestRequest &&
              match.status === "scheduled" &&
              hasCapacity &&
              !guestRequest.isOpen ? (
                <Pressable
                  onPress={() => setGuestModalVisible(true)}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <XStack
                    backgroundColor={eliteForgeColors.carbonInput}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor={eliteForgeColors.orange}
                    paddingVertical={14}
                    alignItems="center"
                    justifyContent="center"
                    gap={8}
                    opacity={busy ? 0.6 : 1}
                  >
                    <Ionicons name="person-add-outline" size={18} color={eliteForgeColors.orange} />
                    <Text color={eliteForgeColors.orange} fontWeight="800" fontSize={15}>
                      {translate("matchesScreen:guestOpenButton")}
                    </Text>
                  </XStack>
                </Pressable>
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

      <GuestRequestModal
        visible={guestModalVisible}
        onClose={() => setGuestModalVisible(false)}
        onSubmit={handleSubmitGuestRequest}
      />
      <GuestApplicantsModal
        visible={applicantsModalVisible}
        onClose={() => setApplicantsModalVisible(false)}
        applications={guestRequest.applications}
        onAccept={handleAcceptApplicant}
        onReject={handleRejectApplicant}
      />
    </YStack>
  )
}
