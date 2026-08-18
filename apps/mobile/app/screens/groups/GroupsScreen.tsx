import { useCallback, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StatusBar } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { GroupSummaryApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { GroupCard } from "./components/GroupCard"
import { GroupCreateModal } from "./components/GroupCreateModal"
import { useGroups } from "./useGroups"

export function GroupsScreen({ navigation }: AppStackScreenProps<"Groups">) {
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { groups, loading, refreshing, error, refresh, createGroup } = useGroups()
  const [createOpen, setCreateOpen] = useState(false)

  // Refresca al volver de GroupDetailScreen (salir/eliminar grupo cambian esta lista).
  useFocusEffect(
    useCallback(() => {
      refresh()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  )

  const handleOpenGroup = useCallback(
    (groupId: string) => {
      navigation.navigate("GroupDetail", { groupId })
    },
    [navigation],
  )

  const handleCreate = useCallback(
    async (name: string) => {
      const created = await createGroup(name)
      return created !== null
    },
    [createGroup],
  )

  const renderItem = useCallback(
    ({ item }: { item: GroupSummaryApiDto }) => (
      <GroupCard group={item} onPress={() => handleOpenGroup(item.id)} />
    ),
    [handleOpenGroup],
  )

  const listEmpty = useCallback(() => {
    if (loading) {
      return (
        <YStack paddingVertical={48} alignItems="center">
          <ActivityIndicator color={eliteForgeColors.emerald} />
        </YStack>
      )
    }
    if (error) {
      return (
        <YStack paddingVertical={48} alignItems="center" gap={12}>
          <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
            {translate("groupsScreen:loadError")}
          </Text>
          <Pressable onPress={refresh} accessibilityRole="button">
            <XStack
              backgroundColor={eliteForgeColors.emerald}
              borderRadius={12}
              paddingHorizontal={18}
              paddingVertical={10}
            >
              <Text color="#1a1a1a" fontWeight="700" fontSize={13}>
                {translate("groupsScreen:retry")}
              </Text>
            </XStack>
          </Pressable>
        </YStack>
      )
    }
    return (
      <YStack paddingVertical={48} alignItems="center" gap={4}>
        <Ionicons name="people-outline" size={40} color="rgba(255,255,255,0.3)" />
        <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
          {translate("groupsScreen:emptyGroups")}
        </Text>
      </YStack>
    )
  }, [loading, error, refresh])

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
      <StatusBar barStyle="light-content" backgroundColor={eliteForgeColors.carbon} />

      <YStack paddingTop={insets.top} paddingHorizontal={horizontalPadding} gap={16} flex={1}>
        <XStack alignItems="center" justifyContent="space-between" paddingTop={8}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button">
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

          <Text color="#FFFFFF" fontWeight="800" fontSize={18}>
            {translate("groupsScreen:title")}
          </Text>

          <Pressable
            onPress={() => setCreateOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={translate("groupsScreen:createTitle")}
          >
            <XStack
              width={40}
              height={40}
              borderRadius={12}
              backgroundColor={eliteForgeColors.emerald}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="add" size={22} color="#1a1a1a" />
            </XStack>
          </Pressable>
        </XStack>

        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={eliteForgeColors.emerald}
            />
          }
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
            maxWidth: contentMaxWidth,
            width: "100%",
            alignSelf: "center",
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        />
      </YStack>

      <GroupCreateModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </YStack>
  )
}
