import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { MyReservationApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { CreateReservationModal } from "./components/CreateReservationModal"
import { ReservationCard } from "./components/ReservationCard"
import { useReservations } from "./useReservations"
import { useVenues } from "./useVenues"

export function ReservationsScreen({ route, navigation }: AppStackScreenProps<"Reservations">) {
  const matchId = route.params?.matchId
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { reservations, loading, refreshing, error, reload, create } = useReservations()
  const { venues } = useVenues()
  const [createOpen, setCreateOpen] = useState(false)

  // Si venimos desde "Reservar cancha" en un partido, abrir el modal directo.
  useEffect(() => {
    if (matchId) setCreateOpen(true)
  }, [matchId])

  const handleOpenReservation = useCallback(
    (reservationId: string) => {
      navigation.navigate("ReservationDetail", { reservationId })
    },
    [navigation],
  )

  const renderItem = useCallback(
    ({ item }: { item: MyReservationApiDto }) => (
      <ReservationCard reservation={item} onPress={() => handleOpenReservation(item.id)} />
    ),
    [handleOpenReservation],
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
            {translate("reservationsScreen:loadError")}
          </Text>
          <Pressable onPress={reload} accessibilityRole="button">
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
        <Ionicons name="calendar-outline" size={40} color="rgba(255,255,255,0.3)" />
        <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
          {translate("reservationsScreen:emptyReservations")}
        </Text>
      </YStack>
    )
  }, [loading, error, reload])

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
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
            {translate("reservationsScreen:title")}
          </Text>

          <Pressable
            onPress={() => setCreateOpen(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={translate("reservationsScreen:createTitle")}
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
          data={reservations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={reload}
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

      <CreateReservationModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        venues={venues}
        matchId={matchId}
        onCreate={create}
      />
    </YStack>
  )
}
