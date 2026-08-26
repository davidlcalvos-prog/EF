import { useCallback, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useGroups } from "@/screens/groups/useGroups"
import { api, type MatchSummaryApiDto, type MatchTypeApi } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { CreateMatchModal } from "./components/CreateMatchModal"
import { MatchCard } from "./components/MatchCard"
import { useMatches } from "./useMatches"

export function MatchesScreen({ route, navigation }: AppStackScreenProps<"Matches">) {
  const groupId = route.params?.groupId
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { matches, loading, refreshing, error, refresh } = useMatches(groupId)
  const { groups } = useGroups()
  const [createOpen, setCreateOpen] = useState(false)

  // El MatchSummaryDto no trae nombres de grupo, solo ids — se resuelven client-side
  // con la lista de "mis grupos" ya cargada (no se duplica esta lógica en el backend).
  const groupNameById = useMemo(() => {
    const map = new Map<string, string>()
    groups.forEach((group) => map.set(group.id, group.name))
    return map
  }, [groups])

  const screenTitle = groupId
    ? (groupNameById.get(groupId) ?? translate("matchesScreen:title"))
    : translate("matchesScreen:title")

  const handleOpenMatch = useCallback(
    (matchId: string) => {
      navigation.navigate("MatchDetail", { matchId })
    },
    [navigation],
  )

  const handleCreate = useCallback(
    async (payload: {
      originGroupId: string
      type: MatchTypeApi
      opponentGroupId?: string
      format: string
      maxPlayers: number
      scheduledAt?: string
      venueId?: string
      venueText?: string
    }) => {
      const result = await api.createMatch(payload)
      if (result.kind !== "ok") return false
      refresh()
      return true
    },
    [refresh],
  )

  const renderItem = useCallback(
    ({ item }: { item: MatchSummaryApiDto }) => (
      <MatchCard
        match={item}
        groupName={groupNameById.get(item.originGroupId)}
        opponentGroupName={
          item.opponentGroupId ? groupNameById.get(item.opponentGroupId) : undefined
        }
        onPress={() => handleOpenMatch(item.id)}
      />
    ),
    [groupNameById, handleOpenMatch],
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
            {translate("matchesScreen:loadError")}
          </Text>
          <Pressable onPress={refresh} accessibilityRole="button">
            <XStack
              backgroundColor={eliteForgeColors.emerald}
              borderRadius={12}
              paddingHorizontal={18}
              paddingVertical={10}
            >
              <Text color="#1a1a1a" fontWeight="700" fontSize={13}>
                {translate("matchesScreen:retry")}
              </Text>
            </XStack>
          </Pressable>
        </YStack>
      )
    }
    return (
      <YStack paddingVertical={48} alignItems="center" gap={4}>
        <Ionicons name="football-outline" size={40} color="rgba(255,255,255,0.3)" />
        <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
          {translate("matchesScreen:emptyMatches")}
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

          <Text
            color="#FFFFFF"
            fontWeight="800"
            fontSize={18}
            numberOfLines={1}
            flex={1}
            textAlign="center"
          >
            {screenTitle}
          </Text>

          <Pressable
            onPress={() => setCreateOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={translate("matchesScreen:createTitle")}
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
          data={matches}
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

      <CreateMatchModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        groups={groups}
        initialGroupId={groupId}
        onCreate={handleCreate}
      />
    </YStack>
  )
}
