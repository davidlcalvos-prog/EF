import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAppAlert } from "@/components/AppAlert"
import { TextField } from "@/components/TextField"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { GroupAvatar } from "@/screens/groups/components/GroupAvatar"
import {
  MemberProfileModal,
  type MemberProfilePreview,
  type MemberProfileSource,
} from "@/screens/groups/components/MemberProfileModal"
import {
  api,
  type FriendSuggestionApiDto,
  type PlayerSearchResultApiDto,
  type UserFriendshipApiDto,
} from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { useFriends } from "./useFriends"

type FriendsTab = "friends" | "requests" | "suggestions"

const SEARCH_DEBOUNCE_MS = 400
const SEARCH_MIN_LENGTH = 3

function suggestionReasonLabel(s: FriendSuggestionApiDto): string {
  if (s.reason === "same_group") {
    return translate("friendsScreen:reasonSameGroup", { group: s.groupName ?? "" })
  }
  if (s.reason === "friend_group") {
    return translate("friendsScreen:reasonFriendGroup", { group: s.groupName ?? "" })
  }
  return translate("friendsScreen:reasonMutual", { count: s.mutualFriends })
}

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
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
    >
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
        <Text color={variant === "primary" ? "#1a1a1a" : "#E74C3C"} fontWeight="800" fontSize={12}>
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}

/** Amistades del jugador (Fase 10): pestañas Amigos y Solicitudes. */
export function FriendsScreen({ navigation }: AppStackScreenProps<"Friends">) {
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const showAlert = useAppAlert()
  const { friends, incoming, outgoing, loading, error, reload, accept, remove } = useFriends()
  const [tab, setTab] = useState<FriendsTab>("friends")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [profileTarget, setProfileTarget] = useState<{
    userId: string
    source: MemberProfileSource
    preview: MemberProfilePreview
  } | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Búsqueda de jugadores (Fase 10.1) — con debounce; mientras hay texto,
  // la lista muestra resultados en lugar de las pestañas.
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PlayerSearchResultApiDto[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const searchSeqRef = useRef(0)
  const searchActive = query.trim().length > 0

  useEffect(() => {
    const term = query.trim()
    if (term.length < SEARCH_MIN_LENGTH) {
      setResults([])
      setSearching(false)
      setSearchError(false)
      return
    }
    setSearching(true)
    setSearchError(false)
    const seq = ++searchSeqRef.current
    const timer = setTimeout(() => {
      api.searchPlayers(term).then((result) => {
        if (searchSeqRef.current !== seq) return
        setSearching(false)
        if (result.kind === "ok") {
          setResults(result.results)
        } else {
          setSearchError(true)
        }
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  // Sugerencias — se cargan al entrar por primera vez a la pestaña.
  const [suggestions, setSuggestions] = useState<FriendSuggestionApiDto[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState(false)
  const suggestionsLoadedRef = useRef(false)

  const loadSuggestions = useCallback(async () => {
    setSuggestionsError(false)
    setSuggestionsLoading(true)
    const result = await api.listFriendSuggestions()
    setSuggestionsLoading(false)
    if (result.kind === "ok") {
      setSuggestions(result.suggestions)
      suggestionsLoadedRef.current = true
    } else {
      setSuggestionsError(true)
    }
  }, [])

  useEffect(() => {
    if (tab === "suggestions" && !suggestionsLoadedRef.current) {
      loadSuggestions()
    }
  }, [tab, loadSuggestions])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    const job = tab === "suggestions" ? Promise.all([reload(), loadSuggestions()]) : reload()
    Promise.resolve(job).finally(() => setRefreshing(false))
  }, [reload, tab, loadSuggestions])

  /** Agregar desde un resultado de búsqueda — actualiza esa fila en memoria. */
  const handleSearchRequest = useCallback(
    (row: PlayerSearchResultApiDto) => {
      setBusyId(row.user.id)
      api.requestFriendship(row.user.id).then((result) => {
        setBusyId(null)
        if (result.kind === "ok") {
          setResults((prev) =>
            prev.map((r) =>
              r.user.id === row.user.id
                ? {
                    ...r,
                    friendship: {
                      status: result.friendship.status === "accepted" ? "accepted" : "pending_sent",
                      friendshipId: result.friendship.id,
                    },
                  }
                : r,
            ),
          )
        } else {
          showAlert(translate("friendsScreen:actionError"), describeProblem(result))
        }
      })
    },
    [showAlert],
  )

  /** Aceptar desde un resultado de búsqueda (pending_received). */
  const handleSearchAccept = useCallback(
    (row: PlayerSearchResultApiDto) => {
      if (!row.friendship.friendshipId) return
      const friendshipId = row.friendship.friendshipId
      setBusyId(row.user.id)
      api.acceptFriendship(friendshipId).then((result) => {
        setBusyId(null)
        if (result.kind === "ok") {
          setResults((prev) =>
            prev.map((r) =>
              r.user.id === row.user.id
                ? { ...r, friendship: { status: "accepted", friendshipId } }
                : r,
            ),
          )
          reload()
        } else {
          showAlert(translate("friendsScreen:actionError"), describeProblem(result))
        }
      })
    },
    [reload, showAlert],
  )

  /** Agregar desde una sugerencia — quita la fila al éxito. */
  const handleSuggestionRequest = useCallback(
    (suggestion: FriendSuggestionApiDto) => {
      setBusyId(suggestion.user.id)
      api.requestFriendship(suggestion.user.id).then((result) => {
        setBusyId(null)
        if (result.kind === "ok") {
          setSuggestions((prev) => prev.filter((s) => s.user.id !== suggestion.user.id))
          reload()
        } else {
          showAlert(translate("friendsScreen:actionError"), describeProblem(result))
        }
      })
    },
    [reload, showAlert],
  )

  const handleAccept = useCallback(
    (friendship: UserFriendshipApiDto) => {
      setBusyId(friendship.id)
      accept(friendship).then((result) => {
        setBusyId(null)
        if (result.kind !== "ok") {
          showAlert(translate("friendsScreen:actionError"), describeProblem(result))
        }
      })
    },
    [accept, showAlert],
  )

  /** Rechazar o cancelar — acción directa, sin confirmación (la eliminación
   * de un amigo aceptado vive en MemberProfileModal, con confirmación). */
  const handleRemove = useCallback(
    (friendship: UserFriendshipApiDto) => {
      setBusyId(friendship.id)
      remove(friendship).then((result) => {
        setBusyId(null)
        if (result.kind !== "ok") {
          showAlert(translate("friendsScreen:actionError"), describeProblem(result))
        }
      })
    },
    [remove, showAlert],
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

        {/* Búsqueda por @alias o correo */}
        <XStack
          alignItems="center"
          gap={8}
          backgroundColor={eliteForgeColors.carbonInput}
          borderWidth={1}
          borderColor={eliteForgeColors.carbonBorder}
          borderRadius={12}
          paddingHorizontal={12}
        >
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder={translate("friendsScreen:searchPlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={{ flex: 1 }}
            inputWrapperStyle={{
              backgroundColor: "transparent",
              borderWidth: 0,
              paddingHorizontal: 0,
            }}
            style={{ color: "#FFFFFF", fontSize: 14, paddingVertical: 12 }}
          />
          {searchActive ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityRole="button">
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </Pressable>
          ) : null}
        </XStack>

        {/* Pestañas (ocultas mientras se busca) */}
        {searchActive ? null : (
          <XStack gap={8}>
            {(
              [
                { id: "friends", label: translate("friendsScreen:tabFriends"), badge: 0 },
                {
                  id: "requests",
                  label: translate("friendsScreen:tabRequests"),
                  badge: requestsCount,
                },
                {
                  id: "suggestions",
                  label: translate("friendsScreen:tabSuggestions"),
                  badge: 0,
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
        )}

        {searchActive ? (
          // ── Modo búsqueda ──
          searching ? (
            <YStack paddingVertical={48} alignItems="center">
              <ActivityIndicator color={eliteForgeColors.emerald} />
            </YStack>
          ) : searchError ? (
            <YStack paddingVertical={48} alignItems="center" gap={12}>
              <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
                {translate("friendsScreen:searchError")}
              </Text>
            </YStack>
          ) : query.trim().length < SEARCH_MIN_LENGTH ? (
            <YStack paddingVertical={40} alignItems="center">
              <Text color="rgba(255,255,255,0.45)" fontSize={13} textAlign="center">
                {translate("friendsScreen:searchMinChars")}
              </Text>
            </YStack>
          ) : results.length === 0 ? (
            <YStack paddingVertical={40} alignItems="center" paddingHorizontal={24}>
              <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
                {translate("friendsScreen:searchEmpty")}
              </Text>
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
              keyboardShouldPersistTaps="handled"
            >
              {results.map((row) => (
                <Pressable
                  key={row.user.id}
                  onPress={() =>
                    setProfileTarget({ userId: row.user.id, source: "search", preview: row.user })
                  }
                  accessibilityRole="button"
                >
                  <XStack
                    alignItems="center"
                    gap={12}
                    paddingVertical={10}
                    borderBottomWidth={1}
                    borderBottomColor={eliteForgeColors.carbonBorder}
                  >
                    <GroupAvatar
                      seed={row.user.id}
                      name={row.user.displayName}
                      photoBase64={row.user.avatarBase64}
                      size={40}
                    />
                    <YStack flex={1}>
                      <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
                        {row.user.displayName}
                      </Text>
                      {row.user.alias ? (
                        <Text color="rgba(255,255,255,0.45)" fontSize={12} numberOfLines={1}>
                          @{row.user.alias}
                        </Text>
                      ) : null}
                    </YStack>
                    {row.friendship.status === "none" ? (
                      <ActionButton
                        label={translate("friendsScreen:add")}
                        variant="primary"
                        disabled={busyId === row.user.id}
                        onPress={() => handleSearchRequest(row)}
                      />
                    ) : row.friendship.status === "pending_received" ? (
                      <ActionButton
                        label={translate("friendsScreen:accept")}
                        variant="primary"
                        disabled={busyId === row.user.id}
                        onPress={() => handleSearchAccept(row)}
                      />
                    ) : (
                      <Text color="rgba(255,255,255,0.45)" fontSize={12} fontWeight="700">
                        {row.friendship.status === "accepted"
                          ? translate("friendsScreen:alreadyFriends")
                          : translate("friendsScreen:pendingShort")}
                      </Text>
                    )}
                  </XStack>
                </Pressable>
              ))}
            </ScrollView>
          )
        ) : tab === "suggestions" ? (
          // ── Pestaña Sugerencias ──
          suggestionsLoading ? (
            <YStack paddingVertical={48} alignItems="center">
              <ActivityIndicator color={eliteForgeColors.emerald} />
            </YStack>
          ) : suggestionsError ? (
            <YStack paddingVertical={48} alignItems="center" gap={12}>
              <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
                {translate("friendsScreen:loadError")}
              </Text>
              <Pressable onPress={loadSuggestions} accessibilityRole="button">
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
              {suggestions.length === 0 ? (
                <YStack paddingVertical={40} alignItems="center" paddingHorizontal={24}>
                  <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
                    {translate("friendsScreen:emptySuggestions")}
                  </Text>
                </YStack>
              ) : (
                suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion.user.id}
                    onPress={() =>
                      setProfileTarget({
                        userId: suggestion.user.id,
                        source: "suggestions",
                        preview: suggestion.user,
                      })
                    }
                    accessibilityRole="button"
                  >
                    <XStack
                      alignItems="center"
                      gap={12}
                      paddingVertical={10}
                      borderBottomWidth={1}
                      borderBottomColor={eliteForgeColors.carbonBorder}
                    >
                      <GroupAvatar
                        seed={suggestion.user.id}
                        name={suggestion.user.displayName}
                        photoBase64={suggestion.user.avatarBase64}
                        size={40}
                      />
                      <YStack flex={1}>
                        <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
                          {suggestion.user.displayName}
                        </Text>
                        <Text color="rgba(255,255,255,0.45)" fontSize={12} numberOfLines={1}>
                          {suggestionReasonLabel(suggestion)}
                        </Text>
                      </YStack>
                      <ActionButton
                        label={translate("friendsScreen:add")}
                        variant="primary"
                        disabled={busyId === suggestion.user.id}
                        onPress={() => handleSuggestionRequest(suggestion)}
                      />
                    </XStack>
                  </Pressable>
                ))
              )}
            </ScrollView>
          )
        ) : loading ? (
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
                    onPress={() =>
                      setProfileTarget({
                        userId: friendship.user.id,
                        source: "friends",
                        preview: friendship.user,
                      })
                    }
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
                        onPress={() =>
                          setProfileTarget({
                            userId: friendship.user.id,
                            source: "friends",
                            preview: friendship.user,
                          })
                        }
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
                        onPress={() =>
                          setProfileTarget({
                            userId: friendship.user.id,
                            source: "friends",
                            preview: friendship.user,
                          })
                        }
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

      {profileTarget ? (
        <MemberProfileModal
          visible
          userId={profileTarget.userId}
          source={profileTarget.source}
          preview={profileTarget.preview}
          onClose={() => {
            setProfileTarget(null)
            // La ficha permite gestionar la amistad — refrescamos al volver.
            reload()
          }}
        />
      ) : null}
    </YStack>
  )
}
