import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAuth } from "@/context/AuthContext"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { api, type MatchGuestRequestApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { GuestRequestCard } from "./components/GuestRequestCard"
import { useNearbyGuestRequests } from "./useNearbyGuestRequests"

function describeProblem(problem: GeneralApiProblem): string {
  switch (problem.kind) {
    case "conflict":
      return translate("matchesScreen:guestApplyConflict")
    case "not-found":
      return translate("matchesScreen:notFoundError")
    default:
      return translate("matchesScreen:actionError")
  }
}

export function NearbyGuestRequestsScreen({
  navigation,
}: AppStackScreenProps<"NearbyGuestRequests">) {
  const { authUserId } = useAuth()
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { requests, loading, refreshing, error, refresh, apply } = useNearbyGuestRequests()
  const [hasLocation, setHasLocation] = useState<boolean | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authUserId) return
    let cancelled = false
    api.getMyProfile(authUserId).then((result) => {
      if (cancelled) return
      if (result.kind === "ok") setHasLocation(!!result.profile.municipalityCode)
    })
    return () => {
      cancelled = true
    }
  }, [authUserId])

  const handleApply = useCallback(
    async (requestId: string) => {
      setApplyingId(requestId)
      const result = await apply(requestId)
      setApplyingId(null)
      if (result.kind !== "ok") {
        Alert.alert(translate("matchesScreen:actionError"), describeProblem(result))
      }
    },
    [apply],
  )

  const noLocation = !loading && !error && requests.length === 0 && hasLocation === false

  const renderItem = useCallback(
    ({ item }: { item: MatchGuestRequestApiDto }) => (
      <GuestRequestCard
        request={item}
        applying={applyingId === item.id}
        onApply={() => handleApply(item.id)}
      />
    ),
    [applyingId, handleApply],
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
            {translate("matchesScreen:guestNearbyLoadError")}
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
    if (noLocation) {
      return (
        <YStack paddingVertical={48} alignItems="center" gap={12} paddingHorizontal={24}>
          <Ionicons name="location-outline" size={40} color="rgba(255,255,255,0.3)" />
          <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
            {translate("matchesScreen:guestNearbyNoLocation")}
          </Text>
          <Pressable onPress={() => navigation.navigate("ProfileEdit")} accessibilityRole="button">
            <XStack
              backgroundColor={eliteForgeColors.emerald}
              borderRadius={12}
              paddingHorizontal={18}
              paddingVertical={10}
            >
              <Text color="#1a1a1a" fontWeight="700" fontSize={13}>
                {translate("matchesScreen:guestNearbySetLocation")}
              </Text>
            </XStack>
          </Pressable>
        </YStack>
      )
    }
    return (
      <YStack paddingVertical={48} alignItems="center" gap={4}>
        <Ionicons name="megaphone-outline" size={40} color="rgba(255,255,255,0.3)" />
        <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
          {translate("matchesScreen:guestNearbyEmpty")}
        </Text>
      </YStack>
    )
  }, [loading, error, noLocation, refresh, navigation])

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
            {translate("matchesScreen:guestNearbyTitle")}
          </Text>

          <XStack width={40} height={40} />
        </XStack>

        <FlatList
          data={requests}
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
    </YStack>
  )
}
