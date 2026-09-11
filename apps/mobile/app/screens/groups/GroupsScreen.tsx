import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { Text, XStack, YStack } from "tamagui"

import { useAppAlert } from "@/components/AppAlert"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { GroupInvitationApiDto, GroupSummaryApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { GroupAvatar } from "./components/GroupAvatar"
import { GroupCard } from "./components/GroupCard"
import { GroupCreateModal } from "./components/GroupCreateModal"
import { useGroupInvitations } from "./useGroupInvitations"
import { useGroups } from "./useGroups"

export function GroupsScreen({ navigation, route }: AppStackScreenProps<"Groups">) {
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const showAlert = useAppAlert()
  const { groups, loading, refreshing, error, refresh, createGroup } = useGroups()
  const invitationsState = useGroupInvitations()
  const [createOpen, setCreateOpen] = useState(false)
  const [busyInvitationId, setBusyInvitationId] = useState<string | null>(null)

  // Refresca al volver de GroupDetailScreen (salir/eliminar grupo cambian esta lista)
  // y las invitaciones (el push de invitación llega acá con initialSection).
  useFocusEffect(
    useCallback(() => {
      refresh()
      invitationsState.reload()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  )

  // Deep link del push "invitación a grupo": el bloque de invitaciones ya está
  // arriba de la lista, así que solo se consume el param para no reaccionar
  // dos veces si la pantalla ya estaba montada.
  const initialSection = route.params?.initialSection
  useEffect(() => {
    if (initialSection === "invitations") {
      invitationsState.reload()
      navigation.setParams({ initialSection: undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSection])

  const handleAcceptInvitation = useCallback(
    async (invitation: GroupInvitationApiDto) => {
      setBusyInvitationId(invitation.id)
      const result = await invitationsState.accept(invitation)
      setBusyInvitationId(null)
      if (result.kind === "ok") {
        refresh()
        return
      }
      showAlert(
        translate("groupsScreen:invitationsTitle"),
        result.kind === "not-found" || result.kind === "conflict"
          ? translate("groupsScreen:invitationGone")
          : translate("groupsScreen:invitationActionError"),
      )
    },
    [invitationsState, refresh, showAlert],
  )

  const handleDeclineInvitation = useCallback(
    async (invitation: GroupInvitationApiDto) => {
      setBusyInvitationId(invitation.id)
      const result = await invitationsState.decline(invitation)
      setBusyInvitationId(null)
      if (result.kind !== "ok" && result.kind !== "not-found" && result.kind !== "conflict") {
        showAlert(
          translate("groupsScreen:invitationsTitle"),
          translate("groupsScreen:invitationActionError"),
        )
      }
    },
    [invitationsState, showAlert],
  )

  const handleOpenGroup = useCallback(
    (groupId: string) => {
      navigation.navigate("GroupDetail", { groupId })
    },
    [navigation],
  )

  const handleCreate = useCallback(
    async (name: string, municipalityCode?: string) => {
      const created = await createGroup(name, municipalityCode)
      return created !== null
    },
    [createGroup],
  )

  const renderItem = useCallback(
    ({ item }: { item: GroupSummaryApiDto }) => (
      <GroupCard group={item} onPress={() => handleOpenGroup(item.id)} />
    ),
    [handleOpenGroup],
  )

  // Bloque "Invitaciones" arriba de la lista (2026-09-11). Misma fila y mismos
  // botones que las solicitudes entrantes de GroupFriendsScreen. Solo aparece
  // si hay pendientes: un pendiente NO es un grupo mío, no va en la lista.
  const listHeader = useCallback(() => {
    const { invitations } = invitationsState
    if (invitations.length === 0) return null
    return (
      <YStack gap={8} marginBottom={20}>
        <Text color="rgba(255,255,255,0.45)" fontSize={12} fontWeight="700" letterSpacing={1}>
          {translate("groupsScreen:invitationsTitle").toUpperCase()}
        </Text>
        {invitations.map((invitation) => {
          const busy = busyInvitationId === invitation.id
          const inviterName =
            `${invitation.invitedBy.firstname} ${invitation.invitedBy.lastname}`.trim()
          return (
            <XStack
              key={invitation.id}
              alignItems="center"
              gap={12}
              paddingVertical={10}
              borderBottomWidth={1}
              borderBottomColor={eliteForgeColors.carbonBorder}
            >
              <GroupAvatar
                seed={invitation.group.id}
                name={invitation.group.name}
                photoBase64={invitation.group.photoBase64}
                size={40}
              />
              <YStack flex={1}>
                <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
                  {invitation.group.name}
                </Text>
                <Text color="rgba(255,255,255,0.45)" fontSize={12} numberOfLines={1}>
                  {translate("groupsScreen:invitedBy", { name: inviterName })}
                </Text>
              </YStack>
              <XStack gap={8}>
                <Pressable
                  onPress={() => handleAcceptInvitation(invitation)}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <XStack
                    backgroundColor={eliteForgeColors.emerald}
                    borderRadius={10}
                    paddingHorizontal={12}
                    paddingVertical={8}
                    opacity={busy ? 0.6 : 1}
                  >
                    <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                      {translate("groupsScreen:acceptInvitation")}
                    </Text>
                  </XStack>
                </Pressable>
                <Pressable
                  onPress={() => handleDeclineInvitation(invitation)}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <XStack
                    borderWidth={1}
                    borderColor="#E74C3C"
                    borderRadius={10}
                    paddingHorizontal={12}
                    paddingVertical={8}
                    opacity={busy ? 0.6 : 1}
                  >
                    <Text color="#E74C3C" fontWeight="800" fontSize={12}>
                      {translate("groupsScreen:declineInvitation")}
                    </Text>
                  </XStack>
                </Pressable>
              </XStack>
            </XStack>
          )
        })}
      </YStack>
    )
  }, [invitationsState, busyInvitationId, handleAcceptInvitation, handleDeclineInvitation])

  const listEmpty = useCallback(() => {
    if (loading) {
      return (
        <YStack paddingVertical={48} alignItems="center">
          <ActivityIndicator color={eliteForgeColors.emerald} />
        </YStack>
      )
    }
    if (error) {
      return (
        <YStack paddingVertical={48} alignItems="center" gap={12}>
          <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
            {translate("groupsScreen:loadError")}
          </Text>
          <Pressable onPress={refresh} accessibilityRole="button">
            <XStack
              backgroundColor={eliteForgeColors.emerald}
              borderRadius={12}
              paddingHorizontal={18}
              paddingVertical={10}
            >
              <Text color="#1a1a1a" fontWeight="700" fontSize={13}>
                {translate("groupsScreen:retry")}
              </Text>
            </XStack>
          </Pressable>
        </YStack>
      )
    }
    return (
      <YStack paddingVertical={48} alignItems="center" gap={4}>
        <Ionicons name="people-outline" size={40} color="rgba(255,255,255,0.3)" />
        <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
          {translate("groupsScreen:emptyGroups")}
        </Text>
      </YStack>
    )
  }, [loading, error, refresh])

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
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

          <Text color="#FFFFFF" fontWeight="800" fontSize={18}>
            {translate("groupsScreen:title")}
          </Text>

          <Pressable
            onPress={() => setCreateOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={translate("groupsScreen:createTitle")}
          >
            <XStack
              width={40}
              height={40}
              borderRadius={12}
              backgroundColor={eliteForgeColors.emerald}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="add" size={22} color="#1a1a1a" />
            </XStack>
          </Pressable>
        </XStack>

        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
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
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        />
      </YStack>

      <GroupCreateModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </YStack>
  )
}
