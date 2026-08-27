import { useCallback, useState } from "react"
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { formatReservationRange, statusLabel } from "./components/ReservationCard"
import { useReservationDetail } from "./useReservationDetail"

function describeProblem(problem: GeneralApiProblem): string {
  switch (problem.kind) {
    case "forbidden":
      return translate("reservationsScreen:actionForbidden")
    case "conflict":
      return translate("reservationsScreen:cancelConflict")
    case "not-found":
      return translate("reservationsScreen:notFoundError")
    default:
      return translate("reservationsScreen:actionError")
  }
}

export function ReservationDetailScreen({
  route,
  navigation,
}: AppStackScreenProps<"ReservationDetail">) {
  const { reservationId } = route.params
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { reservation, loading, error, refresh, cancel } = useReservationDetail(reservationId)
  const [busy, setBusy] = useState(false)

  const canCancel =
    !!reservation &&
    reservation.status !== "cancelled" &&
    new Date(reservation.startsAt) > new Date()

  const handleCancel = useCallback(() => {
    Alert.alert(
      translate("reservationsScreen:cancelConfirmTitle"),
      translate("reservationsScreen:cancelConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("reservationsScreen:cancelReservation"),
          style: "destructive",
          onPress: async () => {
            setBusy(true)
            const result = await cancel()
            setBusy(false)
            if (result.kind !== "ok") {
              Alert.alert(translate("reservationsScreen:actionError"), describeProblem(result))
            }
          },
        },
      ],
    )
  }, [cancel])

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
            {reservation?.venueName ?? translate("reservationsScreen:title")}
          </Text>

          <XStack width={40} height={40} />
        </XStack>

        {loading ? (
          <YStack paddingVertical={48} alignItems="center">
            <ActivityIndicator color={eliteForgeColors.emerald} />
          </YStack>
        ) : error || !reservation ? (
          <YStack paddingVertical={48} alignItems="center" gap={12}>
            <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
              {translate("reservationsScreen:loadError")}
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
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              maxWidth: contentMaxWidth,
              width: "100%",
              alignSelf: "center",
              paddingBottom: 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            <YStack
              backgroundColor={eliteForgeColors.carbonElevated}
              borderRadius={14}
              borderWidth={1}
              borderColor={eliteForgeColors.carbonBorder}
              padding={16}
              gap={10}
              marginBottom={16}
            >
              <XStack
                alignSelf="flex-start"
                backgroundColor="rgba(255,255,255,0.08)"
                borderRadius={6}
                paddingHorizontal={8}
                paddingVertical={2}
              >
                <Text color={eliteForgeColors.emerald} fontSize={11} fontWeight="700">
                  {statusLabel(reservation.status)}
                </Text>
              </XStack>

              <Text color="#FFFFFF" fontWeight="800" fontSize={20}>
                {reservation.venueName}
              </Text>

              {reservation.courtName ? (
                <XStack alignItems="center" gap={8}>
                  <Ionicons name="grid-outline" size={16} color="rgba(255,255,255,0.5)" />
                  <Text color="rgba(255,255,255,0.6)" fontSize={13}>
                    {reservation.courtName}
                  </Text>
                </XStack>
              ) : null}

              <XStack alignItems="center" gap={8}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.5)" />
                <Text color="rgba(255,255,255,0.6)" fontSize={13}>
                  {formatReservationRange(reservation.startsAt, reservation.endsAt)}
                </Text>
              </XStack>

              {reservation.status === "pending" ? (
                <XStack alignItems="center" gap={8}>
                  <Ionicons name="time-outline" size={16} color={eliteForgeColors.orange} />
                  <Text color={eliteForgeColors.orange} fontSize={13}>
                    {translate("reservationsScreen:pendingNote")}
                  </Text>
                </XStack>
              ) : null}

              {reservation.notes ? (
                <XStack alignItems="flex-start" gap={8}>
                  <Ionicons name="document-text-outline" size={16} color="rgba(255,255,255,0.5)" />
                  <Text color="rgba(255,255,255,0.6)" fontSize={13} flex={1}>
                    {reservation.notes}
                  </Text>
                </XStack>
              ) : null}

              {reservation.matchId ? (
                <XStack alignItems="center" gap={8}>
                  <Ionicons name="football-outline" size={16} color="rgba(255,255,255,0.5)" />
                  <Text color="rgba(255,255,255,0.6)" fontSize={13}>
                    {translate("reservationsScreen:linkedToMatch")}
                  </Text>
                </XStack>
              ) : null}
            </YStack>

            {canCancel ? (
              <YStack gap={10}>
                <Pressable onPress={handleCancel} disabled={busy} accessibilityRole="button">
                  <XStack
                    backgroundColor="rgba(231,76,60,0.12)"
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="#E74C3C"
                    paddingVertical={14}
                    alignItems="center"
                    justifyContent="center"
                    opacity={busy ? 0.6 : 1}
                  >
                    <Text color="#E74C3C" fontWeight="800" fontSize={15}>
                      {translate("reservationsScreen:cancelReservation")}
                    </Text>
                  </XStack>
                </Pressable>
              </YStack>
            ) : null}
          </ScrollView>
        )}
      </YStack>
    </YStack>
  )
}
