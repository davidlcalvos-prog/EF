import { useEffect, useState } from "react"
import { ActivityIndicator, Modal, Pressable, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { STAT_ORDER } from "@/data/mockPlayerProfile"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { getPositionLabel } from "@/screens/profile/components/ProfileHeader"
import { StatsRadarChart, type RadarAxis } from "@/screens/profile/components/StatsRadarChart"
import { api, type PublicMemberProfileApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { GroupAvatar } from "./GroupAvatar"

export interface MemberProfileModalProps {
  visible: boolean
  onClose: () => void
  userId: string
}

/**
 * Ficha de solo lectura de un compañero de grupo: foto, nombre, posición y
 * su radar de stats. Sin acciones — el backend nunca expone lo psicológico
 * ni los tests crudos de otro usuario.
 */
export function MemberProfileModal({ visible, onClose, userId }: MemberProfileModalProps) {
  const { insets } = useResponsiveLayout()
  const [profile, setProfile] = useState<PublicMemberProfileApiDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    setProfile(null)
    setError(false)
    setLoading(true)

    api.getPublicMemberProfile(userId).then((result) => {
      if (cancelled) return
      setLoading(false)
      if (result.kind === "ok") {
        setProfile(result.profile)
      } else {
        setError(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [visible, userId])

  const radarData: RadarAxis[] = STAT_ORDER.map((key) => ({
    key,
    label: translate(`profileScreen:stat_${key}` as never),
    value: profile?.stats?.[key] ?? 0,
    hasResult: (profile?.stats?.[key] ?? 0) > 0,
  }))

  const positionLabel = profile?.favoritePosition
    ? getPositionLabel(profile.favoritePosition)
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

          {loading ? (
            <YStack paddingVertical={64} alignItems="center">
              <ActivityIndicator color={eliteForgeColors.emerald} />
            </YStack>
          ) : error || !profile ? (
            <YStack paddingVertical={64} alignItems="center" paddingHorizontal={24}>
              <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
                {translate("groupsScreen:memberProfileError")}
              </Text>
            </YStack>
          ) : (
            <YStack paddingHorizontal={16} paddingTop={16} gap={16}>
              {/* Foto pequeña arriba a la izquierda, nombre y posición al lado (layout pedido por David). */}
              <XStack alignItems="center" gap={14}>
                <GroupAvatar
                  seed={profile.userId}
                  name={profile.name}
                  photoBase64={profile.avatarBase64}
                  size={56}
                />
                <YStack flex={1} gap={4}>
                  <Text color="#FFFFFF" fontWeight="800" fontSize={18} numberOfLines={1}>
                    {profile.name}
                  </Text>
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
                </YStack>
              </XStack>

              {!profile.stats ? (
                <Text color="rgba(255,255,255,0.45)" fontSize={12} textAlign="center">
                  {translate("groupsScreen:memberNoStats")}
                </Text>
              ) : null}

              <StatsRadarChart data={radarData} />
            </YStack>
          )}
        </View>
      </View>
    </Modal>
  )
}
