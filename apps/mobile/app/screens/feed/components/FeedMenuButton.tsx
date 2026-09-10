import { Pressable, View } from "react-native"
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated"
import { XStack, YStack } from "tamagui"

import { usePending } from "@/context/PendingContext"
import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { translate } from "@/i18n/translate"

import { FEED_NAV_SCROLL_DISTANCE } from "../feedNavConstants"
import { PendingDot } from "./PendingDot"

export interface FeedMenuButtonProps {
  onPress: () => void
  /** Si se pasa, el botón se compacta al hacer scroll */
  compactScrollY?: SharedValue<number>
}

const LINE_WIDTH = 20
const LINE_HEIGHT = 2.25

function MenuLine({ width = LINE_WIDTH }: { width?: number }) {
  return (
    <View
      style={{
        width,
        height: LINE_HEIGHT,
        backgroundColor: "#FFFFFF",
        borderRadius: 2,
      }}
    />
  )
}

export function FeedMenuButton({ onPress, compactScrollY }: FeedMenuButtonProps) {
  const motion = useInteractiveMotion("button")
  // Del contexto, no por props: FeedNavbar y FeedScreen no se enteran (Fase B).
  const { total: pendingTotal } = usePending()

  const sizeStyle = useAnimatedStyle(() => {
    if (!compactScrollY) {
      return { width: 44, height: 44, borderRadius: 12 }
    }
    const size = interpolate(
      compactScrollY.value,
      [0, FEED_NAV_SCROLL_DISTANCE],
      [44, 38],
      Extrapolation.CLAMP,
    )
    return {
      width: size,
      height: size,
      borderRadius: interpolate(size, [38, 44], [10, 12]),
    }
  })

  return (
    <Pressable
      onPress={onPress}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      onHoverIn={motion.onHoverIn}
      onHoverOut={motion.onHoverOut}
      accessibilityRole="button"
      accessibilityLabel={translate("feedScreen:openMenu")}
      hitSlop={8}
    >
      <Animated.View style={motion.animatedStyle}>
        <Animated.View style={sizeStyle}>
          <XStack
            flex={1}
            borderRadius={12}
            backgroundColor="rgba(46,46,46,0.95)"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.12)"
            alignItems="center"
            justifyContent="center"
          >
            <YStack gap={4.5} alignItems="center">
              <MenuLine />
              <MenuLine width={16} />
              <MenuLine />
            </YStack>
          </XStack>
          <PendingDot visible={pendingTotal > 0} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}
