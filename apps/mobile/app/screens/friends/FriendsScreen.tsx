import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { GroupAvatar } from "@/screens/groups/components/GroupAvatar"
import { MemberProfileModal } from "@/screens/groups/components/MemberProfileModal"
import type { UserFriendshipApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { useFriends } from "./useFriends"

type FriendsTab = "friends" | "requests"

function describeProblem(problem: GeneralApiProblem): string {
  switch (problem.kind) {
    case "forbidden":
      return translate("friendsScreen:actionForbidden")
    case "conflict":
      return translate("friendsScreen:actionConflict")
    case "not-found":
      return translate("friendsScreen:notFoundError")
    default:
      return translate("friendsScreen:actionError")
  }
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700" marginBottom={8}>
      {title}
    </Text>
  )
}

function FriendRow({
  friendship,
  onPress,
  children,
}: {
  friendship: UserFriendshipApiDto
  onPress?: () => void
  children?: React.ReactNode
}) {
  const subtitle = friendship.user.alias
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? "button" : undefined}>
      <XStack
        alignItems="center"
        gap={12}
        paddingVertical={10}
        borderBottomWidth={1}
        borderBottomColor={eliteForgeColors.carbonBorder}
      >
        <GroupAvatar
          seed={friendship.user.id}
          name={friendship.user.displayName}
          photoBase64={friendship.user.avatarBase64}
          size={40}
        />
        <YStack flex={1}>
          <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
            {friendship.user.displayName}
          </Text>
          {subtitle ? (
            <Text color="rgba(255,255,255,0.45)" fontSize={12} numberOfLines={1}>
              @{subtitle}
            </Text>
          ) : null}
        </YStack>
        {children}
      </XStack>
    </Pressable>
  )
}

function ActionButton({
  label,
  variant,
  disabled,
  onPress,
}: {
  label: string
  variant: "primary" | "danger"
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      <XStack
        backgroundColor={variant === "primary" ? eliteForgeColors.emerald : "transparent"}
        borderWidth={variant === "danger" ? 1 : 0}
        borderColor="#E74C3C"
        borderRadius={10}
        paddingHorizontal={12}
        paddingVertical={8}
        opacity={disabled ? 0.6 : 1}
      >
        <Text
          color={variant === "primary" ? "#1a1a1a" : "#E74C3C"}
          fontWeight="800"
          fontSize={12}
        >
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}

/** Amistades del jugador (Fase 10): pestañas Amigos y Solicitudes. */
export function FriendsScreen({ navigation }: AppStackScreenProps<"Friends">) {
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { friends, incoming, outgoing, loading, error, reload, accept, remove } = useFriends()
  const [tab, setTab] = useState<FriendsTab>("friends")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    reload().finally(() => setRefreshing(false))
  }, [reload])

  const handleAccept = useCallback(
    (friendship: UserFriendshipApiDto) => {
      setBusyId(friendship.id)
      accept(friendship).then((result) => {
        setBusyId(null)
        if (result.kind !== "ok") {
          Alert.alert(translate("friendsScreen:actionError"), describeProblem(result))
        }
      })
    },
    [accept],
  )

  /** Rechazar o cancelar — acción directa, sin confirmación (la eliminación
   * de un amigo aceptado vive en MemberProfileModal, con confirmación). */
  const handleRemove = useCallback(
    (friendship: UserFriendshipApiDto) => {
      setBusyId(friendship.id)
      remove(friendship).then((result) => {
        setBusyId(null)
        if (result.kind !== "ok") {
          Alert.alert(translate("friendsScreen:actionError"), describeProblem(result))
        }
      })
    },
    [remove],
  )

  const requestsCount = incoming.length

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
            {translate("friendsScreen:title")}
          </Text>

          <XStack width={40} height={40} />
        </XStack>

        {/* Pestañas */}
        <XStack gap={8}>
          {(
            [
              { id: "friends", label: translate("friendsScreen:tabFriends"), badge: 0 },
              {
                id: "requests",
                label: translate("friendsScreen:tabRequests"),
                badge: requestsCount,
              },
            ] as { id: FriendsTab; label: string; badge: number }[]
          ).map((item) => {
            const active = tab === item.id
            return (
              <Pressable key={item.id} onPress={() => setTab(item.id)} accessibilityRole="button">
                <XStack
                  alignItems="center"
                  gap={6}
                  paddingHorizontal={14}
                  paddingVertical={8}
                  borderRadius={999}
                  backgroundColor={active ? "rgba(0,206,200,0.15)" : eliteForgeColors.carbonInput}
                  borderWidth={1}
                  borderColor={active ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder}
                >
                  <Text
                    color={active ? eliteForgeColors.emerald : "rgba(255,255,255,0.7)"}
                    fontWeight="700"
                    fontSize={13}
                  >
                    {item.label}
                  </Text>
                  {item.badge > 0 ? (
                    <XStack
                      minWidth={18}
                      height={18}
                      borderRadius={9}
                      backgroundColor={eliteForgeColors.orange}
                      alignItems="center"
                      justifyContent="center"
                      paddingHorizontal={4}
                    >
                      <Text color="#1a1a1a" fontWeight="800" fontSize={10}>
                        {item.badge}
                      </Text>
                    </XStack>
                  ) : null}
                </XStack>
              </Pressable>
            )
          })}
        </XStack>

        {loading ? (
          <YStack paddingVertical={48} alignItems="center">
            <ActivityIndicator color={eliteForgeColors.emerald} />
          </YStack>
        ) : error ? (
          <YStack paddingVertical={48} alignItems="center" gap={12}>
            <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
              {translate("friendsScreen:loadError")}
            </Text>
            <Pressable onPress={reload} accessibilityRole="button">
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={12}
                paddingHorizontal={18}
                paddingVertical={10}
              >
                <Text color="#1a1a1a" fontWeight="700" fontSize={13}>
                  {translate("friendsScreen:retry")}
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={eliteForgeColors.emerald}
              />
            }
          >
            {tab === "friends" ? (
              friends.length === 0 ? (
                <YStack paddingVertical={40} alignItems="center">
                  <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
                    {translate("friendsScreen:emptyFriends")}
                  </Text>
                </YStack>
              ) : (
                friends.map((friendship) => (
                  <FriendRow
                    key={friendship.id}
                    friendship={friendship}
                    onPress={() => setProfileUserId(friendship.user.id)}
                  />
                ))
              )
            ) : incoming.length === 0 && outgoing.length === 0 ? (
              <YStack paddingVertical={40} alignItems="center">
                <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
                  {translate("friendsScreen:emptyRequests")}
                </Text>
              </YStack>
            ) : (
              <>
                {incoming.length > 0 ? (
                  <YStack gap={4} marginBottom={20}>
                    <SectionHeader title={translate("friendsScreen:incomingTitle")} />
                    {incoming.map((friendship) => (
                      <FriendRow
                        key={friendship.id}
                        friendship={friendship}
                        onPress={() => setProfileUserId(friendship.user.id)}
                      >
                        <XStack gap={8}>
                          <ActionButton
                            label={translate("friendsScreen:accept")}
                            variant="primary"
                            disabled={busyId === friendship.id}
                            onPress={() => handleAccept(friendship)}
                          />
                          <ActionButton
                            label={translate("friendsScreen:reject")}
                            variant="danger"
                            disabled={busyId === friendship.id}
                            onPress={() => handleRemove(friendship)}
                          />
                        </XStack>
                      </FriendRow>
                    ))}
                  </YStack>
                ) : null}

                {outgoing.length > 0 ? (
                  <YStack gap={4}>
                    <SectionHeader title={translate("friendsScreen:outgoingTitle")} />
                    {outgoing.map((friendship) => (
                      <FriendRow
                        key={friendship.id}
                        friendship={friendship}
                        onPress={() => setProfileUserId(friendship.user.id)}
                      >
                        <ActionButton
                          label={translate("friendsScreen:cancelRequest")}
                          variant="danger"
                          disabled={busyId === friendship.id}
                          onPress={() => handleRemove(friendship)}
                        />
                      </FriendRow>
                    ))}
                  </YStack>
                ) : null}
              </>
            )}
          </ScrollView>
        )}
      </YStack>

      {profileUserId ? (
        <MemberProfileModal
          visible
          userId={profileUserId}
          onClose={() => {
            setProfileUserId(null)
            // La ficha permite eliminar la amistad — refrescamos al volver.
            reload()
          }}
        />
      ) : null}
    </YStack>
  )
}
