import { Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import type { PlayerPositionId } from "@/data/suggestPlayerPosition"
import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { ProfileAvatar } from "./ProfileAvatar"

export interface ProfileHeaderProps {
  displayName: string
  nickname?: string
  email?: string
  avatarColor: string
  avatarUri?: string | null
  /** Foto del servidor como respaldo cuando no hay `avatarUri` local (ver `ProfileAvatar`). */
  avatarBase64?: string | null
  tagId: string
  positionLabel: string
  positionBadge?: "favorite" | "suggested" | "default"
  onBack: () => void
  onEditProfile?: () => void
  onEditAvatar?: () => void
}

export function ProfileHeader({
  displayName,
  nickname,
  email,
  avatarColor,
  avatarUri,
  avatarBase64,
  tagId,
  positionLabel,
  positionBadge = "default",
  onBack,
  onEditProfile,
  onEditAvatar,
}: ProfileHeaderProps) {
  const positionPrefix =
    positionBadge === "favorite"
      ? translate("profileScreen:favoritePositionBadge")
      : positionBadge === "suggested"
        ? translate("profileScreen:positionSuggestedBadge")
        : null

  return (
    <YStack gap={16}>
      <XStack alignItems="center" justifyContent="space-between">
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button">
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

        <XStack height={3} flex={1} marginHorizontal={12} borderRadius={999} overflow="hidden">
          <YStack flex={1} backgroundColor={eliteForgeColors.emerald} />
          <YStack flex={1} backgroundColor={eliteForgeColors.orange} />
        </XStack>

        {onEditProfile ? (
          <Pressable onPress={onEditProfile} hitSlop={12} accessibilityRole="button">
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
              <Ionicons name="create-outline" size={20} color={eliteForgeColors.emerald} />
            </XStack>
          </Pressable>
        ) : (
          <XStack width={40} />
        )}
      </XStack>

      <XStack alignItems="center" gap={16}>
        <ProfileAvatar
          label={displayName}
          color={avatarColor}
          size={72}
          imageUri={avatarUri}
          photoBase64={avatarBase64}
          onPress={onEditAvatar}
          showEditBadge={Boolean(onEditAvatar)}
        />
        <YStack flex={1} gap={6}>
          <Text color={eliteForgeColors.white} fontWeight="800" fontSize={22}>
            {displayName}
          </Text>
          {nickname ? (
            <Text color={eliteForgeColors.emerald} fontSize={13} fontWeight="700">
              @{nickname}
            </Text>
          ) : null}
          <Text color="rgba(255,255,255,0.55)" fontSize={13} numberOfLines={1}>
            {email ?? "—"}
          </Text>
          <XStack gap={8} flexWrap="wrap">
            <XStack
              paddingHorizontal={10}
              paddingVertical={4}
              borderRadius={999}
              backgroundColor="rgba(0,206,200,0.14)"
              borderWidth={1}
              borderColor="rgba(0,206,200,0.35)"
            >
              <Text color={eliteForgeColors.emerald} fontSize={11} fontWeight="700">
                {tagId}
              </Text>
            </XStack>
            <XStack
              paddingHorizontal={10}
              paddingVertical={4}
              borderRadius={999}
              backgroundColor="rgba(255,140,0,0.12)"
              borderWidth={1}
              borderColor="rgba(255,140,0,0.35)"
            >
              <Text color={eliteForgeColors.orange} fontSize={11} fontWeight="700">
                {positionPrefix ? `${positionPrefix}: ${positionLabel}` : positionLabel}
              </Text>
            </XStack>
          </XStack>
        </YStack>
      </XStack>
    </YStack>
  )
}

export function getPositionLabel(positionId: PlayerPositionId): string {
  return translate(`profileScreen:position_${positionId}` as never)
}
