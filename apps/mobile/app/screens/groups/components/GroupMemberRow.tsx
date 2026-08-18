import { Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { translate } from "@/i18n/translate"
import type { GroupMemberApiDto, GroupMemberRoleApi } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { roleLabel } from "./GroupCard"

export interface GroupMemberRowProps {
  member: GroupMemberApiDto
  isSelf: boolean
  canToggleRole: boolean
  canRemove: boolean
  onToggleRole?: () => void
  onRemove?: () => void
}

const AVATAR_PALETTE = ["#00CEC8", "#FF8C00", "#7B68EE", "#2ECC71", "#E74C3C"]

function pickAvatarColor(seed: string) {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

const ROLE_COLORS: Record<GroupMemberRoleApi, string> = {
  creator: eliteForgeColors.orange,
  admin: eliteForgeColors.emerald,
  member: "rgba(255,255,255,0.55)",
}

export function GroupMemberRow({
  member,
  isSelf,
  canToggleRole,
  canRemove,
  onToggleRole,
  onRemove,
}: GroupMemberRowProps) {
  const initial = member.name.trim().charAt(0).toUpperCase() || "?"

  return (
    <XStack
      alignItems="center"
      gap={12}
      paddingVertical={12}
      paddingHorizontal={4}
      borderBottomWidth={1}
      borderBottomColor="rgba(85,85,85,0.5)"
    >
      <XStack
        width={40}
        height={40}
        borderRadius={20}
        backgroundColor={pickAvatarColor(member.userId) as `#${string}`}
        alignItems="center"
        justifyContent="center"
      >
        <Text color="#FFFFFF" fontWeight="800" fontSize={15}>
          {initial}
        </Text>
      </XStack>

      <YStack flex={1} gap={2}>
        <XStack alignItems="center" gap={6}>
          <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
            {member.name}
          </Text>
          {isSelf ? (
            <Text color="rgba(255,255,255,0.4)" fontSize={12}>
              {translate("groupsScreen:youSuffix")}
            </Text>
          ) : null}
        </XStack>
        <Text color="rgba(255,255,255,0.5)" fontSize={12} numberOfLines={1}>
          {member.email}
        </Text>
      </YStack>

      <XStack
        backgroundColor="rgba(255,255,255,0.08)"
        borderRadius={6}
        paddingHorizontal={8}
        paddingVertical={2}
      >
        <Text color={ROLE_COLORS[member.role]} fontSize={11} fontWeight="700">
          {roleLabel(member.role)}
        </Text>
      </XStack>

      {canToggleRole ? (
        <Pressable
          onPress={onToggleRole}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={translate(
            member.role === "admin" ? "groupsScreen:demoteAdmin" : "groupsScreen:promoteAdmin",
          )}
        >
          <Ionicons
            name={member.role === "admin" ? "shield" : "shield-outline"}
            size={18}
            color={eliteForgeColors.emerald}
          />
        </Pressable>
      ) : null}

      {canRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={translate("groupsScreen:removeMember")}
        >
          <Ionicons name="person-remove-outline" size={18} color="#E74C3C" />
        </Pressable>
      ) : null}
    </XStack>
  )
}
