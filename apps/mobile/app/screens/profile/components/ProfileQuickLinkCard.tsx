import { Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated from "react-native-reanimated"
import { Text, XStack, YStack } from "tamagui"

import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export type ProfileQuickLinkId = "groups" | "matches" | "reservations"

const LINK_META: Record<
  ProfileQuickLinkId,
  { icon: keyof typeof Ionicons.glyphMap; titleKey: string; subtitleKey: string }
> = {
  groups: {
    icon: "people-outline",
    titleKey: "feedDrawer:groups",
    subtitleKey: "groupsScreen:title",
  },
  matches: {
    icon: "football-outline",
    titleKey: "feedDrawer:matches",
    subtitleKey: "matchesScreen:title",
  },
  reservations: {
    icon: "calendar-outline",
    titleKey: "feedDrawer:reservations",
    subtitleKey: "reservationsScreen:title",
  },
}

export interface ProfileQuickLinkCardProps {
  id: ProfileQuickLinkId
  onPress: () => void
}

export function ProfileQuickLinkCard({ id, onPress }: ProfileQuickLinkCardProps) {
  const motion = useInteractiveMotion("button")
  const meta = LINK_META[id]

  return (
    <Pressable
      onPress={onPress}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      accessibilityRole="button"
    >
      <Animated.View style={motion.animatedStyle}>
        <XStack
          alignItems="center"
          gap={14}
          paddingVertical={14}
          paddingHorizontal={16}
          borderRadius={12}
          backgroundColor={eliteForgeColors.carbonInput}
          borderWidth={1}
          borderColor={eliteForgeColors.carbonBorder}
        >
          <XStack
            width={36}
            height={36}
            borderRadius={10}
            backgroundColor="rgba(255,140,0,0.12)"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name={meta.icon} size={20} color={eliteForgeColors.orange} />
          </XStack>

          <YStack flex={1} gap={2}>
            <Text color={eliteForgeColors.white} fontWeight="700" fontSize={15}>
              {translate(meta.titleKey as never)}
            </Text>
            <Text color="rgba(255,255,255,0.45)" fontSize={12}>
              {translate(meta.subtitleKey as never)}
            </Text>
          </YStack>

          <Ionicons name="chevron-forward" size={18} color={eliteForgeColors.orange} />
        </XStack>
      </Animated.View>
    </Pressable>
  )
}
