import { useCallback, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAppAlert } from "@/components/AppAlert"
import { GroupSearchModal } from "@/components/GroupSearchModal"
import { useAuth } from "@/context/AuthContext"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { GroupFriendshipApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { GroupAvatar } from "./components/GroupAvatar"
import { useGroupDetail } from "./useGroupDetail"
import { getOtherGroup, useGroupFriendships } from "./useGroupFriendships"

function describeProblem(problem: GeneralApiProblem): string {
  switch (problem.kind) {
    case "forbidden":
      return translate("groupFriendsScreen:actionForbidden")
    case "conflict":
      return translate("groupFriendsScreen:requestConflict")
    case "not-found":
      return translate("groupFriendsScreen:notFoundError")
    default:
      return translate("groupFriendsScreen:actionError")
  }
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700" marginBottom={8}>
      {title}
    </Text>
  )
}

function EmptySection({ text }: { text: string }) {
  return (
    <Text color="rgba(255,255,255,0.4)" fontSize={13} marginBottom={4}>
      {text}
    </Text>
  )
}

export function GroupFriendsScreen({ route, navigation }: AppStackScreenProps<"GroupFriends">) {
  const { groupId } = route.params
  const { authUserId } = useAuth()
  const showAlert = useAppAlert()
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { group } = useGroupDetail(groupId)
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    reload,
    request,
    accept,
    remove,
  } = useGroupFriendships(groupId)
  const [searchOpen, setSearchOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const ownRole = group?.members.find((m) => m.userId === authUserId)?.role
  const isLeader = ownRole === "creator" || ownRole === "admin"

  const handleRequest = useCallback((targetGroupId: string) => request(targetGroupId), [request])

  const handleAccept = useCallback(
    (friendship: GroupFriendshipApiDto) => {
      setBusyId(friendship.id)
      accept(friendship.id).then((result) => {
        setBusyId(null)
        if (result.kind !== "ok") {
          showAlert(translate("groupFriendsScreen:actionError"), describeProblem(result))
        }
      })
    },
    [accept, showAlert],
  )

  const handleRemove = useCallback(
    (friendship: GroupFriendshipApiDto, titleKey: string, messageKey: string) => {
      const other = getOtherGroup(friendship, groupId)
      showAlert(
        translate(titleKey as never),
        translate(messageKey as never, { name: other.name }),
        [
          { text: translate("feedScreen:composeCancel"), style: "cancel" },
          {
            text: translate("groupFriendsScreen:confirm"),
            style: "destructive",
            onPress: () => {
              setBusyId(friendship.id)
              remove(friendship.id).then((result) => {
                setBusyId(null)
                if (result.kind !== "ok") {
                  showAlert(translate("groupFriendsScreen:actionError"), describeProblem(result))
                }
              })
            },
          },
        ],
      )
    },
    [groupId, remove, showAlert],
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
            {translate("groupFriendsScreen:title")}
          </Text>

          {isLeader ? (
            <Pressable
              onPress={() => setSearchOpen(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={translate("groupFriendsScreen:searchTitle")}
            >
              <XStack
                width={40}
                height={40}
                borderRadius={12}
                backgroundColor={eliteForgeColors.emerald}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="search" size={18} color="#1a1a1a" />
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
        ) : error ? (
          <YStack paddingVertical={48} alignItems="center" gap={12}>
            <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
              {translate("groupFriendsScreen:loadError")}
            </Text>
            <Pressable onPress={reload} accessibilityRole="button">
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={12}
                paddingHorizontal={18}
                paddingVertical={10}
              >
                <Text color="#1a1a1a" fontWeight="700" fontSize={13}>
                  {translate("groupFriendsScreen:retry")}
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
              paddingBottom: insets.bottom + 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {incomingRequests.length > 0 ? (
              <YStack gap={8} marginBottom={20}>
                <SectionHeader title={translate("groupFriendsScreen:incomingTitle")} />
                {incomingRequests.map((friendship) => {
                  const other = getOtherGroup(friendship, groupId)
                  return (
                    <XStack
                      key={friendship.id}
                      alignItems="center"
                      gap={12}
                      paddingVertical={10}
                      borderBottomWidth={1}
                      borderBottomColor={eliteForgeColors.carbonBorder}
                    >
                      <GroupAvatar
                        seed={other.id}
                        name={other.name}
                        photoBase64={other.photoBase64}
                        size={40}
                      />
                      <Text
                        color="#FFFFFF"
                        fontWeight="700"
                        fontSize={14}
                        flex={1}
                        numberOfLines={1}
                      >
                        {other.name}
                      </Text>
                      {isLeader ? (
                        <XStack gap={8}>
                          <Pressable
                            onPress={() => handleAccept(friendship)}
                            disabled={busyId === friendship.id}
                            accessibilityRole="button"
                          >
                            <XStack
                              backgroundColor={eliteForgeColors.emerald}
                              borderRadius={10}
                              paddingHorizontal={12}
                              paddingVertical={8}
                              opacity={busyId === friendship.id ? 0.6 : 1}
                            >
                              <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                                {translate("groupFriendsScreen:accept")}
                              </Text>
                            </XStack>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              handleRemove(
                                friendship,
                                "groupFriendsScreen:rejectConfirmTitle",
                                "groupFriendsScreen:rejectConfirmMessage",
                              )
                            }
                            disabled={busyId === friendship.id}
                            accessibilityRole="button"
                          >
                            <XStack
                              borderWidth={1}
                              borderColor="#E74C3C"
                              borderRadius={10}
                              paddingHorizontal={12}
                              paddingVertical={8}
                              opacity={busyId === friendship.id ? 0.6 : 1}
                            >
                              <Text color="#E74C3C" fontWeight="800" fontSize={12}>
                                {translate("groupFriendsScreen:reject")}
                              </Text>
                            </XStack>
                          </Pressable>
                        </XStack>
                      ) : (
                        <Text color="rgba(255,255,255,0.45)" fontSize={12}>
                          {translate("groupFriendsScreen:pendingLabel")}
                        </Text>
                      )}
                    </XStack>
                  )
                })}
              </YStack>
            ) : null}

            {outgoingRequests.length > 0 ? (
              <YStack gap={8} marginBottom={20}>
                <SectionHeader title={translate("groupFriendsScreen:outgoingTitle")} />
                {outgoingRequests.map((friendship) => {
                  const other = getOtherGroup(friendship, groupId)
                  return (
                    <XStack
                      key={friendship.id}
                      alignItems="center"
                      gap={12}
                      paddingVertical={10}
                      borderBottomWidth={1}
                      borderBottomColor={eliteForgeColors.carbonBorder}
                    >
                      <GroupAvatar
                        seed={other.id}
                        name={other.name}
                        photoBase64={other.photoBase64}
                        size={40}
                      />
                      <YStack flex={1}>
                        <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
                          {other.name}
                        </Text>
                        <Text color="rgba(255,255,255,0.45)" fontSize={12}>
                          {translate("groupFriendsScreen:pendingLabel")}
                        </Text>
                      </YStack>
                      {isLeader ? (
                        <Pressable
                          onPress={() =>
                            handleRemove(
                              friendship,
                              "groupFriendsScreen:cancelRequestConfirmTitle",
                              "groupFriendsScreen:cancelRequestConfirmMessage",
                            )
                          }
                          disabled={busyId === friendship.id}
                          accessibilityRole="button"
                        >
                          <XStack
                            borderWidth={1}
                            borderColor="#E74C3C"
                            borderRadius={10}
                            paddingHorizontal={12}
                            paddingVertical={8}
                            opacity={busyId === friendship.id ? 0.6 : 1}
                          >
                            <Text color="#E74C3C" fontWeight="800" fontSize={12}>
                              {translate("groupFriendsScreen:cancelRequest")}
                            </Text>
                          </XStack>
                        </Pressable>
                      ) : null}
                    </XStack>
                  )
                })}
              </YStack>
            ) : null}

            <YStack gap={8} marginBottom={20}>
              <SectionHeader title={translate("groupFriendsScreen:friendsTitle")} />
              {friends.length === 0 ? (
                <EmptySection text={translate("groupFriendsScreen:emptyFriends")} />
              ) : (
                friends.map((friendship) => {
                  const other = getOtherGroup(friendship, groupId)
                  return (
                    <XStack
                      key={friendship.id}
                      alignItems="center"
                      gap={12}
                      paddingVertical={10}
                      borderBottomWidth={1}
                      borderBottomColor={eliteForgeColors.carbonBorder}
                    >
                      <GroupAvatar
                        seed={other.id}
                        name={other.name}
                        photoBase64={other.photoBase64}
                        size={40}
                      />
                      <Text
                        color="#FFFFFF"
                        fontWeight="700"
                        fontSize={14}
                        flex={1}
                        numberOfLines={1}
                      >
                        {other.name}
                      </Text>
                      {isLeader ? (
                        <Pressable
                          onPress={() =>
                            handleRemove(
                              friendship,
                              "groupFriendsScreen:endFriendshipConfirmTitle",
                              "groupFriendsScreen:endFriendshipConfirmMessage",
                            )
                          }
                          disabled={busyId === friendship.id}
                          accessibilityRole="button"
                        >
                          <XStack
                            borderWidth={1}
                            borderColor="#E74C3C"
                            borderRadius={10}
                            paddingHorizontal={12}
                            paddingVertical={8}
                            opacity={busyId === friendship.id ? 0.6 : 1}
                          >
                            <Text color="#E74C3C" fontWeight="800" fontSize={12}>
                              {translate("groupFriendsScreen:endFriendship")}
                            </Text>
                          </XStack>
                        </Pressable>
                      ) : null}
                    </XStack>
                  )
                })
              )}
            </YStack>
          </ScrollView>
        )}
      </YStack>

      <GroupSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onRequest={handleRequest}
      />
    </YStack>
  )
}
