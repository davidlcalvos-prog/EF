import { Image, Pressable } from "react-native"
import Animated from "react-native-reanimated"
import { Text, XStack } from "tamagui"

import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"

export interface FeedAvatarProps {
  label: string
  color: string
  /** Foto real de perfil en base64 — si viene con valor, reemplaza el círculo de inicial. */
  photoBase64?: string | null
  size?: number
  onPress?: () => void
  showRing?: boolean
  accessibilityLabel?: string
}

export function FeedAvatar({
  label,
  color,
  photoBase64,
  size = 40,
  onPress,
  showRing = false,
  accessibilityLabel,
}: FeedAvatarProps) {
  const motion = useInteractiveMotion("social")
  const initial = label.trim().charAt(0).toUpperCase() || "?"

  const avatar = photoBase64 ? (
    <Image
      source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: showRing ? 2 : 0,
        borderColor: "#00CEC8",
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
      borderWidth={showRing ? 2 : 0}
      borderColor="#00CEC8"
    >
      <Text color="#FFFFFF" fontWeight="800" fontSize={size * 0.38}>
        {initial}
      </Text>
    </XStack>
  )

  if (!onPress) return avatar

  return (
    <Pressable
      onPress={onPress}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      onHoverIn={motion.onHoverIn}
      onHoverOut={motion.onHoverOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={motion.animatedStyle}>{avatar}</Animated.View>
    </Pressable>
  )
}
