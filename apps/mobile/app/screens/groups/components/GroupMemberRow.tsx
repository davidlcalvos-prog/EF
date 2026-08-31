import { Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { translate } from "@/i18n/translate"
import { FeedAvatar } from "@/screens/feed/components/FeedAvatar"
import type { GroupMemberApiDto, GroupMemberRoleApi } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { getUserColor } from "@/utils/avatarColor"

import { roleLabel } from "./GroupCard"

export interface GroupMemberRowProps {
  member: GroupMemberApiDto
  isSelf: boolean
  canToggleRole: boolean
  canRemove: boolean
  onToggleRole?: () => void
  onRemove?: () => void
  /** Abre la ficha del miembro al tocar el área de avatar+nombre. */
  onPress?: () => void
}

const ROLE_COLORS = {
  creator: eliteForgeColors.orange,
  admin: eliteForgeColors.emerald,
  member: "rgba(255,255,255,0.55)",
} as const satisfies Record<GroupMemberRoleApi, string>

export function GroupMemberRow({
  member,
  isSelf,
  canToggleRole,
  canRemove,
  onToggleRole,
  onRemove,
  onPress,
}: GroupMemberRowProps) {
  return (
    <XStack
      alignItems="center"
      gap={12}
      paddingVertical={12}
      paddingHorizontal={4}
      borderBottomWidth={1}
      borderBottomColor="rgba(85,85,85,0.5)"
    >
      {/* Solo el área de avatar+nombre abre la ficha — no interfiere con los botones de rol/remover. */}
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
      >
        <FeedAvatar
          label={member.name}
          color={getUserColor(member.userId)}
          photoBase64={member.avatarBase64}
          size={40}
        />

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
      </Pressable>

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
