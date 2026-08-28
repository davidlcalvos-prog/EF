import { Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated from "react-native-reanimated"
import { Text, XStack, YStack } from "tamagui"

import { EliteForgeLogo } from "@/components/ui"
import { useAuth } from "@/context/AuthContext"
import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { getUserColor } from "@/utils/avatarColor"

import { FeedAvatar } from "./FeedAvatar"

export type FeedDrawerItemId =
  | "profile"
  | "groups"
  | "friends"
  | "matches"
  | "nearbyGuestRequests"
  | "tournaments"
  | "reservations"

export interface FeedDrawerProps {
  onClose: () => void
  onItemPress: (id: FeedDrawerItemId) => void
  onLogout: () => void
}

const MENU_ITEMS: {
  id: FeedDrawerItemId
  icon: keyof typeof Ionicons.glyphMap
  labelKey: string
}[] = [
  { id: "profile", icon: "person-outline", labelKey: "feedDrawer:profile" },
  { id: "groups", icon: "people-outline", labelKey: "feedDrawer:groups" },
  { id: "friends", icon: "people-outline", labelKey: "feedDrawer:friends" },
  { id: "matches", icon: "football-outline", labelKey: "feedDrawer:matches" },
  {
    id: "nearbyGuestRequests",
    icon: "megaphone-outline",
    labelKey: "feedDrawer:nearbyGuestRequests",
  },
  { id: "tournaments", icon: "trophy-outline", labelKey: "feedDrawer:tournaments" },
  { id: "reservations", icon: "calendar-outline", labelKey: "feedDrawer:reservations" },
]

function getUserDisplayName(email?: string) {
  if (!email) return translate("feedScreen:guestUser")
  const local = email.split("@")[0] ?? email
  return local.charAt(0).toUpperCase() + local.slice(1)
}

function DrawerMenuItem({
  icon,
  label,
  onPress,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  subtitle?: string
}) {
  const motion = useInteractiveMotion("button")

  return (
    <Pressable
      onPress={onPress}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      onHoverIn={motion.onHoverIn}
      onHoverOut={motion.onHoverOut}
      accessibilityRole="button"
    >
      <Animated.View style={motion.animatedStyle}>
        <XStack
          alignItems="center"
          gap={14}
          paddingVertical={14}
          paddingHorizontal={16}
          borderRadius={12}
          backgroundColor="#2e2e2e"
          borderWidth={1}
          borderColor="#555555"
          marginBottom={10}
        >
          <XStack
            width={36}
            height={36}
            borderRadius={10}
            backgroundColor="rgba(0,206,200,0.12)"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name={icon} size={20} color={eliteForgeColors.emerald} />
          </XStack>
          <YStack flex={1} gap={2}>
            <Text color="#FFFFFF" fontWeight="700" fontSize={15}>
              {label}
            </Text>
            <Text color="rgba(255,255,255,0.45)" fontSize={12}>
              {subtitle ?? translate("feedDrawer:comingSoon")}
            </Text>
          </YStack>
          <Ionicons name="chevron-forward" size={18} color={eliteForgeColors.emerald} />
        </XStack>
      </Animated.View>
    </Pressable>
  )
}

export function FeedDrawer({ onClose, onItemPress, onLogout }: FeedDrawerProps) {
  const { authEmail, authAvatarBase64 } = useAuth()
  const logoutMotion = useInteractiveMotion("button")

  return (
    <YStack flex={1} backgroundColor="#424242" paddingTop={48}>
      <XStack height={3}>
        <YStack flex={1} backgroundColor="#00CEC8" />
        <YStack flex={1} backgroundColor="#FF8C00" />
      </XStack>

      <YStack padding={20} gap={20} flex={1}>
        <XStack alignItems="center" justifyContent="space-between">
          <EliteForgeLogo width={48} />
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Ionicons name="close" size={26} color={eliteForgeColors.emerald} />
          </Pressable>
        </XStack>

        <XStack alignItems="center" gap={14} paddingVertical={8}>
          <FeedAvatar
            label={getUserDisplayName(authEmail)}
            color={getUserColor(authEmail)}
            photoBase64={authAvatarBase64}
            size={56}
            showRing
          />
          <YStack flex={1} gap={4}>
            <Text color="#FFFFFF" fontWeight="800" fontSize={18}>
              {getUserDisplayName(authEmail)}
            </Text>
            <Text color="rgba(255,255,255,0.55)" fontSize={13} numberOfLines={1}>
              {authEmail ?? translate("feedScreen:guestUser")}
            </Text>
          </YStack>
        </XStack>

        <Text color="rgba(255,255,255,0.45)" fontSize={12} fontWeight="700" letterSpacing={1}>
          {translate("feedDrawer:sectionMenu").toUpperCase()}
        </Text>

        <YStack flex={1}>
          {MENU_ITEMS.map((item) => (
            <DrawerMenuItem
              key={item.id}
              icon={item.icon}
              label={translate(item.labelKey as never)}
              subtitle={
                item.id === "profile"
                  ? translate("profileScreen:title")
                  : item.id === "groups"
                    ? translate("groupsScreen:title")
                    : item.id === "matches"
                      ? translate("matchesScreen:title")
                      : item.id === "nearbyGuestRequests"
                        ? translate("matchesScreen:guestNearbyTitle")
                        : item.id === "tournaments"
                          ? translate("tournamentsScreen:title")
                          : translate("reservationsScreen:title")
              }
              onPress={() => onItemPress(item.id)}
            />
          ))}
        </YStack>

        <Pressable
          onPress={onLogout}
          onPressIn={logoutMotion.onPressIn}
          onPressOut={logoutMotion.onPressOut}
          accessibilityRole="button"
        >
          <Animated.View style={logoutMotion.animatedStyle}>
            <XStack
              backgroundColor="rgba(255, 140, 0, 0.15)"
              borderRadius={12}
              borderWidth={1}
              borderColor="#FF8C00"
              paddingVertical={14}
              alignItems="center"
              justifyContent="center"
              gap={8}
            >
              <Ionicons name="log-out-outline" size={18} color="#FF8C00" />
              <Text color="#FF8C00" fontWeight="800" fontSize={15}>
                {translate("common:logOut")}
              </Text>
            </XStack>
          </Animated.View>
        </Pressable>
      </YStack>
    </YStack>
  )
}
