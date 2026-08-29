import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Modal, Pressable, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAppAlert } from "@/components/AppAlert"
import { useAuth } from "@/context/AuthContext"
import { STAT_ORDER } from "@/data/mockPlayerProfile"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { getPositionLabel } from "@/screens/profile/components/ProfileHeader"
import { StatsRadarChart, type RadarAxis } from "@/screens/profile/components/StatsRadarChart"
import { api, type FriendshipStatusApiDto, type PublicMemberProfileApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { GroupAvatar } from "./GroupAvatar"

/** Desde dónde se abrió la ficha — decide si se muestran las estadísticas. */
export type MemberProfileSource =
  | "group"
  | "friends"
  | "search"
  | "suggestions"
  | "rankings"
  /** Fase 11: postulante a comodín — mismo candado que search/suggestions salvo amistad aceptada. */
  | "guest_application"

/** Datos que ya trae la fila que abre la ficha, para el modo limitado. */
export interface MemberProfilePreview {
  displayName: string
  alias: string | null
  favoritePosition: string | null
  avatarBase64: string | null
}

export interface MemberProfileModalProps {
  visible: boolean
  onClose: () => void
  userId: string
  source: MemberProfileSource
  preview?: MemberProfilePreview
}

function FriendshipButton({
  label,
  icon,
  variant,
  disabled,
  onPress,
}: {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  variant: "primary" | "neutral" | "danger"
  disabled?: boolean
  onPress: () => void
}) {
  const background = variant === "primary" ? eliteForgeColors.emerald : eliteForgeColors.carbonInput
  const border = variant === "danger" ? "#E74C3C" : eliteForgeColors.carbonBorder
  const color =
    variant === "primary" ? "#1a1a1a" : variant === "danger" ? "#E74C3C" : "rgba(255,255,255,0.8)"

  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      <XStack
        alignItems="center"
        justifyContent="center"
        gap={6}
        backgroundColor={variant === "primary" ? background : eliteForgeColors.carbonInput}
        borderWidth={1}
        borderColor={variant === "primary" ? eliteForgeColors.emerald : border}
        borderRadius={12}
        paddingHorizontal={14}
        paddingVertical={10}
        opacity={disabled && variant !== "neutral" ? 0.6 : 1}
      >
        <Ionicons name={icon} size={16} color={color} />
        <Text color={color} fontWeight="800" fontSize={13}>
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}

/**
 * Ficha de solo lectura de un jugador. Regla de producto (David): las
 * estadísticas se ven solo desde el contexto de un grupo compartido
 * (source group/rankings) o cuando la amistad está aceptada; desde
 * Búsqueda/Sugerencias/Amigos-pendientes la ficha es limitada (candado) y
 * no se llama a getPublicMemberProfile hasta que la amistad sea accepted.
 */
export function MemberProfileModal({
  visible,
  onClose,
  userId,
  source,
  preview,
}: MemberProfileModalProps) {
  const { insets } = useResponsiveLayout()
  const { authUserId } = useAuth()
  const showAlert = useAppAlert()
  const [profile, setProfile] = useState<PublicMemberProfileApiDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [friendship, setFriendship] = useState<FriendshipStatusApiDto | null>(null)
  const [friendshipError, setFriendshipError] = useState(false)
  const [friendshipBusy, setFriendshipBusy] = useState(false)

  const isOwnProfile = userId === authUserId

  const canShowStats =
    source === "group" || source === "rankings" || friendship?.status === "accepted"

  // Reset + estado de amistad al abrir o cambiar de usuario.
  useEffect(() => {
    if (!visible) return
    let cancelled = false
    setProfile(null)
    setError(false)
    setForbidden(false)
    setLoading(false)
    setFriendship(null)
    setFriendshipError(false)

    if (!isOwnProfile) {
      api.getFriendshipStatus(userId).then((result) => {
        if (cancelled) return
        if (result.kind === "ok") {
          setFriendship(result.status)
        } else {
          setFriendshipError(true)
        }
      })
    }

    return () => {
      cancelled = true
    }
  }, [visible, userId, isOwnProfile])

  // Stats solo cuando corresponde — incluye pasar a accepted con el modal
  // abierto (aceptación desde acá): recién ahí se carga el radar.
  useEffect(() => {
    if (!visible || !canShowStats || profile) return
    let cancelled = false
    setLoading(true)
    setError(false)
    setForbidden(false)
    api.getPublicMemberProfile(userId).then((result) => {
      if (cancelled) return
      setLoading(false)
      if (result.kind === "ok") {
        setProfile(result.profile)
      } else if (result.kind === "forbidden") {
        // Caso raro (dejó de compartir grupo): candado en vez de error.
        setForbidden(true)
      } else {
        setError(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [visible, canShowStats, userId, profile])

  const runFriendshipAction = useCallback(
    async (action: () => Promise<{ kind: string }>, next: () => void) => {
      setFriendshipBusy(true)
      setFriendshipError(false)
      const result = await action()
      setFriendshipBusy(false)
      if (result.kind === "ok") {
        next()
      } else {
        setFriendshipError(true)
      }
    },
    [],
  )

  const handleAddFriend = useCallback(() => {
    runFriendshipAction(
      () => api.requestFriendship(userId),
      () => {
        // Si el otro ya me había solicitado, el backend acepta directamente.
        api.getFriendshipStatus(userId).then((result) => {
          if (result.kind === "ok") setFriendship(result.status)
        })
      },
    )
  }, [runFriendshipAction, userId])

  const handleAccept = useCallback(() => {
    if (!friendship?.friendshipId) return
    const friendshipId = friendship.friendshipId
    runFriendshipAction(
      () => api.acceptFriendship(friendshipId),
      () => setFriendship({ status: "accepted", friendshipId }),
    )
  }, [friendship, runFriendshipAction])

  const handleRemove = useCallback(() => {
    if (!friendship?.friendshipId) return
    const friendshipId = friendship.friendshipId
    runFriendshipAction(
      () => api.removeFriendship(friendshipId),
      () => setFriendship({ status: "none", friendshipId: null }),
    )
  }, [friendship, runFriendshipAction])

  // Datos de cabecera: del perfil completo si está, si no del preview de la fila.
  const headerName = profile?.name ?? preview?.displayName ?? null
  const headerAvatar = profile?.avatarBase64 ?? preview?.avatarBase64 ?? null
  const headerPosition = profile?.favoritePosition ?? preview?.favoritePosition ?? null
  const headerAlias = preview?.alias ?? null
  const showMain = headerName != null

  const handleRemoveWithConfirm = useCallback(() => {
    showAlert(
      translate("groupsScreen:friendRemoveConfirmTitle"),
      translate("groupsScreen:friendRemoveConfirmMessage", {
        name: headerName ?? "",
      }),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("groupsScreen:friendRemoveConfirm"),
          style: "destructive",
          onPress: handleRemove,
        },
      ],
    )
  }, [handleRemove, headerName, showAlert])

  const radarData: RadarAxis[] = STAT_ORDER.map((key) => ({
    key,
    label: translate(`profileScreen:stat_${key}` as never),
    value: profile?.stats?.[key] ?? 0,
    hasResult: (profile?.stats?.[key] ?? 0) > 0,
  }))

  const positionLabel = headerPosition
    ? getPositionLabel(headerPosition as Parameters<typeof getPositionLabel>[0])
    : translate("profileScreen:defaultPosition")

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
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
          onPress={onClose}
          accessibilityLabel="Cerrar"
        />

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: eliteForgeColors.carbonElevated,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderWidth: 1,
            borderColor: eliteForgeColors.carbonBorder,
            overflow: "hidden",
            paddingBottom: Math.max(insets.bottom, 16),
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
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={translate("feedScreen:composeCancel")}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>

            <Text color="#FFFFFF" fontWeight="800" fontSize={14}>
              {translate("groupsScreen:memberProfileTitle")}
            </Text>

            <XStack width={20} />
          </XStack>

          {!showMain && loading ? (
            <YStack paddingVertical={64} alignItems="center">
              <ActivityIndicator color={eliteForgeColors.emerald} />
            </YStack>
          ) : !showMain && (error || forbidden) ? (
            <YStack paddingVertical={64} alignItems="center" paddingHorizontal={24}>
              <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
                {translate("groupsScreen:memberProfileError")}
              </Text>
            </YStack>
          ) : !showMain ? (
            <YStack paddingVertical={64} alignItems="center">
              <ActivityIndicator color={eliteForgeColors.emerald} />
            </YStack>
          ) : (
            <YStack paddingHorizontal={16} paddingTop={16} gap={16}>
              {/* Foto pequeña arriba a la izquierda, nombre y posición al lado (layout pedido por David). */}
              <XStack alignItems="center" gap={14}>
                <GroupAvatar
                  seed={userId}
                  name={headerName ?? ""}
                  photoBase64={headerAvatar}
                  size={56}
                />
                <YStack flex={1} gap={4}>
                  <Text color="#FFFFFF" fontWeight="800" fontSize={18} numberOfLines={1}>
                    {headerName}
                  </Text>
                  {headerAlias ? (
                    <Text color="rgba(255,255,255,0.5)" fontSize={12} numberOfLines={1}>
                      @{headerAlias}
                    </Text>
                  ) : null}
                  <XStack
                    alignSelf="flex-start"
                    paddingHorizontal={10}
                    paddingVertical={4}
                    borderRadius={999}
                    backgroundColor="rgba(255,140,0,0.12)"
                    borderWidth={1}
                    borderColor="rgba(255,140,0,0.35)"
                  >
                    <Text color={eliteForgeColors.orange} fontSize={11} fontWeight="700">
                      {positionLabel}
                    </Text>
                  </XStack>
                  {profile?.city && profile?.department ? (
                    <XStack alignItems="center" gap={4}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={eliteForgeColors.emerald}
                      />
                      <Text color="rgba(255,255,255,0.55)" fontSize={11} numberOfLines={1}>
                        {profile.city}, {profile.department}
                      </Text>
                    </XStack>
                  ) : null}
                </YStack>
              </XStack>

              {/* Amistad (Fase 10) — oculto para el propio perfil. */}
              {!isOwnProfile && friendship ? (
                <YStack gap={8}>
                  {friendship.status === "none" ? (
                    <FriendshipButton
                      label={translate("groupsScreen:friendAdd")}
                      icon="person-add-outline"
                      variant="primary"
                      disabled={friendshipBusy}
                      onPress={handleAddFriend}
                    />
                  ) : friendship.status === "pending_sent" ? (
                    <XStack gap={8}>
                      <YStack flex={1}>
                        <FriendshipButton
                          label={translate("groupsScreen:friendRequestSent")}
                          icon="time-outline"
                          variant="neutral"
                          disabled
                          onPress={() => {}}
                        />
                      </YStack>
                      <FriendshipButton
                        label={translate("groupsScreen:friendCancelRequest")}
                        icon="close-outline"
                        variant="danger"
                        disabled={friendshipBusy}
                        onPress={handleRemove}
                      />
                    </XStack>
                  ) : friendship.status === "pending_received" ? (
                    <XStack gap={8}>
                      <YStack flex={1}>
                        <FriendshipButton
                          label={translate("groupsScreen:friendAcceptRequest")}
                          icon="checkmark-outline"
                          variant="primary"
                          disabled={friendshipBusy}
                          onPress={handleAccept}
                        />
                      </YStack>
                      <FriendshipButton
                        label={translate("groupsScreen:friendRejectRequest")}
                        icon="close-outline"
                        variant="danger"
                        disabled={friendshipBusy}
                        onPress={handleRemove}
                      />
                    </XStack>
                  ) : (
                    <XStack gap={8}>
                      <YStack flex={1}>
                        <FriendshipButton
                          label={translate("groupsScreen:friendAlready")}
                          icon="checkmark-circle"
                          variant="neutral"
                          disabled
                          onPress={() => {}}
                        />
                      </YStack>
                      <FriendshipButton
                        label={translate("groupsScreen:friendRemove")}
                        icon="person-remove-outline"
                        variant="danger"
                        disabled={friendshipBusy}
                        onPress={handleRemoveWithConfirm}
                      />
                    </XStack>
                  )}
                  {friendshipError ? (
                    <Text color="#E74C3C" fontSize={12} textAlign="center">
                      {translate("groupsScreen:friendActionError")}
                    </Text>
                  ) : null}
                </YStack>
              ) : null}

              {/* Zona de estadísticas: radar solo con contexto de grupo o
                  amistad aceptada; si no, candado. */}
              {canShowStats && profile ? (
                <>
                  {!profile.stats ? (
                    <Text color="rgba(255,255,255,0.45)" fontSize={12} textAlign="center">
                      {translate("groupsScreen:memberNoStats")}
                    </Text>
                  ) : null}
                  <StatsRadarChart data={radarData} />
                </>
              ) : canShowStats && loading ? (
                <YStack paddingVertical={32} alignItems="center">
                  <ActivityIndicator color={eliteForgeColors.emerald} />
                </YStack>
              ) : canShowStats && error ? (
                <Text color="rgba(255,255,255,0.5)" fontSize={13} textAlign="center">
                  {translate("groupsScreen:memberProfileError")}
                </Text>
              ) : (
                <YStack
                  alignItems="center"
                  gap={10}
                  paddingVertical={28}
                  paddingHorizontal={20}
                  borderRadius={14}
                  backgroundColor={eliteForgeColors.carbonInput}
                  borderWidth={1}
                  borderColor={eliteForgeColors.carbonBorder}
                >
                  <Ionicons name="lock-closed-outline" size={26} color="rgba(255,255,255,0.45)" />
                  <Text
                    color="rgba(255,255,255,0.55)"
                    fontSize={13}
                    textAlign="center"
                    lineHeight={18}
                  >
                    {translate("groupsScreen:statsLocked", { name: headerName ?? "" })}
                  </Text>
                </YStack>
              )}
            </YStack>
          )}
        </View>
      </View>
    </Modal>
  )
}
