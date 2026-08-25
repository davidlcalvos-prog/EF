import { useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import {
  api,
  type GroupMemberApiDto,
  type GroupSummaryApiDto,
  type TournamentApiDto,
} from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { maxPlayersPerTeam } from "../tournamentHelpers"

export interface EnrollTeamModalProps {
  visible: boolean
  onClose: () => void
  tournament: TournamentApiDto
  /** Grupos donde el usuario es creator/admin y que aún no están inscritos en este torneo. */
  eligibleGroups: GroupSummaryApiDto[]
  onEnrolled: (tournament: TournamentApiDto) => void
}

export function EnrollTeamModal({
  visible,
  onClose,
  tournament,
  eligibleGroups,
  onEnrolled,
}: EnrollTeamModalProps) {
  const { insets } = useResponsiveLayout()
  const [groupId, setGroupId] = useState<string | null>(null)
  const [members, setMembers] = useState<GroupMemberApiDto[] | null>(null)
  const [membersError, setMembersError] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const cap = maxPlayersPerTeam(tournament.courtSize)

  // Con un solo grupo elegible se salta el paso de selección.
  useEffect(() => {
    if (visible && eligibleGroups.length === 1) {
      setGroupId(eligibleGroups[0].id)
    }
  }, [visible, eligibleGroups])

  // Carga los miembros del grupo elegido (roster picker).
  useEffect(() => {
    if (!visible || !groupId) return
    let cancelled = false
    setMembers(null)
    setMembersError(false)
    api.getGroupDetail(groupId).then((result) => {
      if (cancelled) return
      if (result.kind === "ok") {
        setMembers(result.group.members)
      } else {
        setMembersError(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [visible, groupId])

  const reset = useCallback(() => {
    setGroupId(null)
    setMembers(null)
    setMembersError(false)
    setSelected(new Set())
    setErrorText(null)
  }, [])

  const handleClose = useCallback(() => {
    if (submitting) return
    reset()
    onClose()
  }, [submitting, reset, onClose])

  const toggleMember = useCallback(
    (userId: string) => {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(userId)) {
          next.delete(userId)
        } else if (next.size < cap) {
          next.add(userId)
        }
        return next
      })
    },
    [cap],
  )

  const describeEnrollError = useCallback((kind: string): string => {
    switch (kind) {
      case "already-enrolled":
        return translate("tournamentsScreen:errorAlreadyEnrolled")
      case "roster-too-big":
        return translate("tournamentsScreen:errorRosterTooBig")
      case "registration-closed":
        return translate("tournamentsScreen:errorRegistrationClosed")
      case "forbidden":
        return translate("matchesScreen:actionForbidden")
      case "cannot-connect":
      case "timeout":
        return translate("loginScreen:cannotConnect")
      default:
        return translate("tournamentsScreen:enrollError")
    }
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!groupId || selected.size === 0 || submitting) return
    setErrorText(null)
    setSubmitting(true)
    const result = await api.enrollGroupInTournament(tournament.id, groupId, [...selected])
    setSubmitting(false)

    if (result.kind !== "ok") {
      setErrorText(describeEnrollError(result.kind))
      return
    }
    reset()
    onEnrolled(result.tournament)
  }, [groupId, selected, submitting, tournament.id, describeEnrollError, reset, onEnrolled])

  const selectedGroup = useMemo(
    () => eligibleGroups.find((g) => g.id === groupId) ?? null,
    [eligibleGroups, groupId],
  )

  const canConfirm = groupId != null && selected.size > 0 && !submitting

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
          onPress={handleClose}
          accessibilityLabel="Cerrar"
        />

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: "85%",
            backgroundColor: eliteForgeColors.carbonElevated,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderWidth: 1,
            borderColor: eliteForgeColors.carbonBorder,
            overflow: "hidden",
          }}
        >
          <XStack height={2} width="100%">
            <YStack flex={1} backgroundColor={eliteForgeColors.emerald} />
            <YStack flex={1} backgroundColor={eliteForgeColors.orange} />
          </XStack>

          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={12}
            paddingVertical={8}
            borderBottomWidth={1}
            borderBottomColor={eliteForgeColors.carbonBorder}
          >
            <Pressable
              onPress={handleClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={translate("feedScreen:composeCancel")}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>

            <Text color="#FFFFFF" fontWeight="800" fontSize={14}>
              {translate("tournamentsScreen:enrollTitle")}
            </Text>

            <Pressable
              onPress={handleConfirm}
              disabled={!canConfirm}
              accessibilityRole="button"
              style={{ opacity: canConfirm ? 1 : 0.4 }}
            >
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={14}
                paddingHorizontal={11}
                paddingVertical={6}
                alignItems="center"
                gap={5}
              >
                {submitting ? <ActivityIndicator size="small" color="#1a1a1a" /> : null}
                <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                  {submitting
                    ? translate("tournamentsScreen:enrolling")
                    : translate("tournamentsScreen:confirmEnroll")}
                </Text>
              </XStack>
            </Pressable>
          </XStack>

          <ScrollView
            style={{ paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingTop: 14, paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {groupId == null ? (
              <YStack gap={8} marginBottom={16}>
                <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                  {translate("tournamentsScreen:chooseGroup")}
                </Text>
                {eligibleGroups.map((group) => (
                  <Pressable
                    key={group.id}
                    onPress={() => setGroupId(group.id)}
                    accessibilityRole="button"
                  >
                    <XStack
                      padding={12}
                      borderRadius={12}
                      backgroundColor={eliteForgeColors.carbonInput}
                      borderWidth={1}
                      borderColor={eliteForgeColors.carbonBorder}
                      alignItems="center"
                      gap={10}
                    >
                      <Ionicons name="people-outline" size={18} color={eliteForgeColors.emerald} />
                      <Text color="#FFFFFF" fontWeight="700" fontSize={14} flex={1}>
                        {group.name}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                    </XStack>
                  </Pressable>
                ))}
              </YStack>
            ) : (
              <YStack gap={8} marginBottom={16}>
                <XStack alignItems="center" justifyContent="space-between">
                  <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                    {translate("tournamentsScreen:chooseRoster", {
                      group: selectedGroup?.name ?? "",
                    })}
                  </Text>
                  <Text
                    color={selected.size >= cap ? eliteForgeColors.orange : "rgba(255,255,255,0.6)"}
                    fontSize={12}
                    fontWeight="700"
                  >
                    {translate("tournamentsScreen:rosterCount", {
                      count: selected.size,
                      max: cap,
                    })}
                  </Text>
                </XStack>

                {eligibleGroups.length > 1 ? (
                  <Pressable
                    onPress={() => {
                      setGroupId(null)
                      setSelected(new Set())
                    }}
                    accessibilityRole="button"
                  >
                    <Text color={eliteForgeColors.emerald} fontSize={12}>
                      {translate("tournamentsScreen:changeGroup")}
                    </Text>
                  </Pressable>
                ) : null}

                {membersError ? (
                  <Text color="#E74C3C" fontSize={13}>
                    {translate("tournamentsScreen:loadMembersError")}
                  </Text>
                ) : members == null ? (
                  <YStack paddingVertical={24} alignItems="center">
                    <ActivityIndicator color={eliteForgeColors.emerald} />
                  </YStack>
                ) : (
                  members.map((member) => {
                    const isSelected = selected.has(member.userId)
                    const atCap = !isSelected && selected.size >= cap
                    return (
                      <Pressable
                        key={member.userId}
                        onPress={() => toggleMember(member.userId)}
                        disabled={atCap}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected, disabled: atCap }}
                        style={{ opacity: atCap ? 0.4 : 1 }}
                      >
                        <XStack
                          padding={12}
                          borderRadius={12}
                          backgroundColor={
                            isSelected ? "rgba(0,206,200,0.1)" : eliteForgeColors.carbonInput
                          }
                          borderWidth={1}
                          borderColor={
                            isSelected ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder
                          }
                          alignItems="center"
                          gap={10}
                        >
                          <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={20}
                            color={isSelected ? eliteForgeColors.emerald : "rgba(255,255,255,0.4)"}
                          />
                          <Text color="#FFFFFF" fontSize={14} flex={1} numberOfLines={1}>
                            {member.name}
                          </Text>
                        </XStack>
                      </Pressable>
                    )
                  })
                )}

                {selected.size === 0 && members != null && !membersError ? (
                  <Text color="rgba(255,255,255,0.45)" fontSize={12}>
                    {translate("tournamentsScreen:rosterMin")}
                  </Text>
                ) : null}
              </YStack>
            )}

            {errorText ? (
              <Text color="#E74C3C" fontSize={12} marginTop={4}>
                {errorText}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
