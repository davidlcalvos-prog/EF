import { Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { translate } from "@/i18n/translate"
import type { GroupMemberRoleApi, GroupSummaryApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export interface GroupCardProps {
  group: GroupSummaryApiDto
  onPress: () => void
}

const ROLE_COLORS: Record<GroupMemberRoleApi, string> = {
  creator: eliteForgeColors.orange,
  admin: eliteForgeColors.emerald,
  member: "rgba(255,255,255,0.55)",
}

export function roleLabel(role: GroupMemberRoleApi) {
  return translate(`groupsScreen:role_${role}` as never)
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const motion = useInteractiveMotion("card")
  const roleColor = ROLE_COLORS[group.role]

  return (
    <Pressable
      onPress={onPress}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      onHoverIn={motion.onHoverIn}
      onHoverOut={motion.onHoverOut}
      accessibilityRole="button"
    >
      <XStack
        backgroundColor={eliteForgeColors.carbonElevated}
        borderRadius={14}
        borderWidth={1}
        borderColor={eliteForgeColors.carbonBorder}
        padding={14}
        marginBottom={12}
        alignItems="center"
        gap={12}
      >
        <XStack
          width={44}
          height={44}
          borderRadius={22}
          backgroundColor="rgba(0,206,200,0.12)"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="people" size={22} color={eliteForgeColors.emerald} />
        </XStack>

        <YStack flex={1} gap={4}>
          <Text color="#FFFFFF" fontWeight="700" fontSize={16} numberOfLines={1}>
            {group.name}
          </Text>
          <XStack alignItems="center" gap={8}>
            <XStack
              backgroundColor="rgba(255,255,255,0.08)"
              borderRadius={6}
              paddingHorizontal={8}
              paddingVertical={2}
            >
              <Text color={roleColor} fontSize={11} fontWeight="700">
                {roleLabel(group.role)}
              </Text>
            </XStack>
            <Text color="rgba(255,255,255,0.5)" fontSize={13}>
              {translate("groupsScreen:memberCount", { count: group.memberCount })}
            </Text>
          </XStack>
        </YStack>

        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
      </XStack>
    </Pressable>
  )
}
