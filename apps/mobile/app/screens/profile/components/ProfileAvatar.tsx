import { Image, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated from "react-native-reanimated"
import { Text, XStack, YStack } from "tamagui"

import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export interface ProfileAvatarProps {
  label: string
  color: string
  size?: number
  /** Archivo local recién elegido (`file://`, MMKV). Gana sobre `photoBase64`. */
  imageUri?: string | null
  /**
   * Foto que ya tiene el servidor (`authAvatarBase64` de `AuthContext`), mismo
   * contrato que `FeedAvatar.photoBase64`. Es el respaldo cuando MMKV no tiene
   * `avatarUri` — instalación nueva o datos borrados: antes la foto "desaparecía"
   * hasta volver a subirla (testers build 3).
   */
  photoBase64?: string | null
  onPress?: () => void
  showEditBadge?: boolean
}

export function ProfileAvatar({
  label,
  color,
  size = 72,
  imageUri,
  photoBase64,
  onPress,
  showEditBadge = false,
}: ProfileAvatarProps) {
  const motion = useInteractiveMotion("social")
  const initial = label.trim().charAt(0).toUpperCase() || "?"
  const resolvedUri = imageUri || (photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : null)

  const content = (
    <YStack width={size} height={size} position="relative">
      {resolvedUri ? (
        <Image
          source={{ uri: resolvedUri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: eliteForgeColors.emerald,
          }}
        />
      ) : (
        <XStack
          width={size}
          height={size}
          borderRadius={size / 2}
          backgroundColor={color as `#${string}`}
          alignItems="center"
          justifyContent="center"
          borderWidth={2}
          borderColor={eliteForgeColors.emerald}
        >
          <Text color="#FFFFFF" fontWeight="800" fontSize={size * 0.38}>
            {initial}
          </Text>
        </XStack>
      )}

      {showEditBadge && (
        <XStack
          position="absolute"
          bottom={0}
          right={0}
          width={26}
          height={26}
          borderRadius={13}
          backgroundColor={eliteForgeColors.emerald}
          alignItems="center"
          justifyContent="center"
          borderWidth={2}
          borderColor={eliteForgeColors.carbon}
        >
          <Ionicons name="camera" size={13} color={eliteForgeColors.carbon} />
        </XStack>
      )}
    </YStack>
  )

  if (!onPress) return content

  return (
    <Pressable
      onPress={onPress}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      accessibilityRole="button"
    >
      <Animated.View style={motion.animatedStyle}>{content}</Animated.View>
    </Pressable>
  )
}
