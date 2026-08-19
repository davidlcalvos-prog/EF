import { useCallback, useState } from "react"
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAuth } from "@/context/AuthContext"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { GroupMemberApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { type AddMemberOutcome, GroupAddMemberModal } from "./components/GroupAddMemberModal"
import { GroupMemberRow } from "./components/GroupMemberRow"
import { useGroupDetail } from "./useGroupDetail"

function describeProblem(problem: GeneralApiProblem): string {
  switch (problem.kind) {
    case "forbidden":
      return translate("groupsScreen:actionForbidden")
    case "conflict":
      return translate("groupsScreen:maxAdminsReached")
    case "not-found":
      return translate("groupsScreen:notFoundError")
    default:
      return translate("groupsScreen:actionError")
  }
}

export function GroupDetailScreen({ route, navigation }: AppStackScreenProps<"GroupDetail">) {
  const { groupId } = route.params
  const { authUserId } = useAuth()
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { group, loading, error, refresh, addMember, updateMemberRole, removeMember, deleteGroup } =
    useGroupDetail(groupId)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const ownRole = group?.members.find((m) => m.userId === authUserId)?.role
  const isCreator = !!group && group.creatorId === authUserId

  const handleAddMember = useCallback(
    async (email: string): Promise<AddMemberOutcome> => {
      const result = await addMember({ email })
      if (result.kind === "ok") return "ok"
      if (result.kind === "not-found") return "not-found"
      if (result.kind === "conflict") return "conflict"
      return "error"
    },
    [addMember],
  )

  const handleToggleRole = useCallback(
    (member: GroupMemberApiDto) => {
      const nextRole = member.role === "admin" ? "member" : "admin"
      Alert.alert(
        nextRole === "admin"
          ? translate("groupsScreen:promoteAdminConfirmTitle")
          : translate("groupsScreen:demoteAdminConfirmTitle"),
        translate("groupsScreen:roleChangeConfirmMessage", { name: member.name }),
        [
          { text: translate("feedScreen:composeCancel"), style: "cancel" },
          {
            text: translate("groupsScreen:confirm"),
            onPress: async () => {
              setBusy(true)
              const result = await updateMemberRole(member.userId, nextRole)
              setBusy(false)
              if (result.kind !== "ok") {
                Alert.alert(translate("groupsScreen:actionError"), describeProblem(result))
              }
            },
          },
        ],
      )
    },
    [updateMemberRole],
  )

  const handleRemoveMember = useCallback(
    (member: GroupMemberApiDto) => {
      Alert.alert(
        translate("groupsScreen:removeMemberConfirmTitle"),
        translate("groupsScreen:removeMemberConfirmMessage", { name: member.name }),
        [
          { text: translate("feedScreen:composeCancel"), style: "cancel" },
          {
            text: translate("groupsScreen:remove"),
            style: "destructive",
            onPress: async () => {
              setBusy(true)
              const result = await removeMember(member.userId)
              setBusy(false)
              if (result.kind !== "ok") {
                Alert.alert(translate("groupsScreen:actionError"), describeProblem(result))
              }
            },
          },
        ],
      )
    },
    [removeMember],
  )

  const handleLeaveGroup = useCallback(() => {
    if (!authUserId) return
    Alert.alert(
      translate("groupsScreen:leaveGroupConfirmTitle"),
      translate("groupsScreen:leaveGroupConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("groupsScreen:leaveGroup"),
          style: "destructive",
          onPress: async () => {
            setBusy(true)
            const result = await removeMember(authUserId)
            setBusy(false)
            if (result.kind === "ok") {
              navigation.goBack()
              return
            }
            Alert.alert(translate("groupsScreen:actionError"), describeProblem(result))
          },
        },
      ],
    )
  }, [authUserId, navigation, removeMember])

  const handleDeleteGroup = useCallback(() => {
    Alert.alert(
      translate("groupsScreen:deleteGroupConfirmTitle"),
      translate("groupsScreen:deleteGroupConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("groupsScreen:deleteGroup"),
          style: "destructive",
          onPress: async () => {
            setBusy(true)
            const result = await deleteGroup()
            setBusy(false)
            if (result.kind === "ok") {
              navigation.goBack()
              return
            }
            Alert.alert(translate("groupsScreen:actionError"), describeProblem(result))
          },
        },
      ],
    )
  }, [deleteGroup, navigation])

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
            {group?.name ?? translate("groupsScreen:title")}
          </Text>

          {ownRole === "creator" || ownRole === "admin" ? (
            <Pressable
              onPress={() => setAddMemberOpen(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={translate("groupsScreen:addMemberTitle")}
            >
              <XStack
                width={40}
                height={40}
                borderRadius={12}
                backgroundColor={eliteForgeColors.emerald}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="person-add" size={18} color="#1a1a1a" />
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
        ) : error || !group ? (
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
        ) : (
          <>
            <Text color="rgba(255,255,255,0.5)" fontSize={13}>
              {translate("groupsScreen:memberCount", { count: group.members.length })}
            </Text>

            <Pressable
              onPress={() => navigation.navigate("Matches", { groupId })}
              accessibilityRole="button"
            >
              <XStack
                backgroundColor={eliteForgeColors.carbonElevated}
                borderRadius={12}
                borderWidth={1}
                borderColor={eliteForgeColors.carbonBorder}
                paddingVertical={12}
                paddingHorizontal={14}
                alignItems="center"
                gap={10}
              >
                <Ionicons name="football-outline" size={18} color={eliteForgeColors.emerald} />
                <Text color="#FFFFFF" fontWeight="700" fontSize={14} flex={1}>
                  {translate("groupsScreen:viewMatches")}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
              </XStack>
            </Pressable>

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
              {group.members.map((member) => {
                const isSelf = member.userId === authUserId
                const canToggleRole = !isSelf && isCreator && member.role !== "creator"
                const canRemove =
                  !isSelf &&
                  member.role !== "creator" &&
                  (isCreator || (ownRole === "admin" && member.role === "member"))

                return (
                  <GroupMemberRow
                    key={member.userId}
                    member={member}
                    isSelf={isSelf}
                    canToggleRole={canToggleRole}
                    canRemove={canRemove}
                    onToggleRole={() => handleToggleRole(member)}
                    onRemove={() => handleRemoveMember(member)}
                  />
                )
              })}
            </ScrollView>

            <YStack paddingBottom={insets.bottom + 16} paddingTop={8}>
              <Pressable
                onPress={isCreator ? handleDeleteGroup : handleLeaveGroup}
                disabled={busy}
                accessibilityRole="button"
              >
                <XStack
                  backgroundColor="rgba(231,76,60,0.12)"
                  borderRadius={12}
                  borderWidth={1}
                  borderColor="#E74C3C"
                  paddingVertical={14}
                  alignItems="center"
                  justifyContent="center"
                  gap={8}
                  opacity={busy ? 0.6 : 1}
                >
                  <Ionicons
                    name={isCreator ? "trash-outline" : "exit-outline"}
                    size={18}
                    color="#E74C3C"
                  />
                  <Text color="#E74C3C" fontWeight="800" fontSize={15}>
                    {isCreator
                      ? translate("groupsScreen:deleteGroup")
                      : translate("groupsScreen:leaveGroup")}
                  </Text>
                </XStack>
              </Pressable>
            </YStack>
          </>
        )}
      </YStack>

      <GroupAddMemberModal
        visible={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onAdd={handleAddMember}
      />
    </YStack>
  )
}
