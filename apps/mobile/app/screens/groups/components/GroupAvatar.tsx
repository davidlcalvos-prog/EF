import { Image, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { eliteForgeColors } from "@/theme/eliteForgeColors"

const AVATAR_PALETTE = ["#00CEC8", "#FF8C00", "#7B68EE", "#2ECC71", "#E74C3C"]

function pickAvatarColor(seed: string) {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

export interface GroupAvatarProps {
  /** Id del grupo — asegura que el color no cambie al renombrar el grupo. */
  seed: string
  name: string
  photoBase64: string | null
  size?: number
  onPress?: () => void
  showEditBadge?: boolean
}

export function GroupAvatar({
  seed,
  name,
  photoBase64,
  size = 44,
  onPress,
  showEditBadge = false,
}: GroupAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?"
  const color = pickAvatarColor(seed)

  const content = (
    <YStack width={size} height={size} position="relative">
      {photoBase64 ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <XStack
          width={size}
          height={size}
          borderRadius={size / 2}
          backgroundColor={color as `#${string}`}
          alignItems="center"
          justifyContent="center"
        >
          <Text color="#FFFFFF" fontWeight="800" fontSize={size * 0.4}>
            {initial}
          </Text>
        </XStack>
      )}

      {showEditBadge ? (
        <XStack
          position="absolute"
          bottom={0}
          right={0}
          width={size * 0.4}
          height={size * 0.4}
          borderRadius={999}
          backgroundColor={eliteForgeColors.emerald}
          alignItems="center"
          justifyContent="center"
          borderWidth={2}
          borderColor={eliteForgeColors.carbon}
        >
          <Ionicons name="camera" size={size * 0.2} color={eliteForgeColors.carbon} />
        </XStack>
      ) : null}
    </YStack>
  )

  if (!onPress) return content

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  )
}
