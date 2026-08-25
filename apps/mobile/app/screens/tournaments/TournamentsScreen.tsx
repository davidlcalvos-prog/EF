import { useCallback } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { TournamentApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { courtSizeLabel } from "./tournamentHelpers"
import { useTournaments } from "./useTournaments"

function TournamentCard({
  tournament,
  onPress,
}: {
  tournament: TournamentApiDto
  onPress: () => void
}) {
  const isRegistration = tournament.status === "registration"
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <YStack
        backgroundColor={eliteForgeColors.carbonElevated}
        borderRadius={16}
        borderWidth={1}
        borderColor={eliteForgeColors.carbonBorder}
        padding={16}
        gap={8}
        marginBottom={12}
      >
        <XStack alignItems="center" justifyContent="space-between" gap={10}>
          <XStack alignItems="center" gap={10} flex={1}>
            <XStack
              width={36}
              height={36}
              borderRadius={10}
              backgroundColor="rgba(0,206,200,0.12)"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="trophy-outline" size={20} color={eliteForgeColors.emerald} />
            </XStack>
            <Text color="#FFFFFF" fontWeight="800" fontSize={16} numberOfLines={1} flex={1}>
              {tournament.name}
            </Text>
          </XStack>
          <XStack
            paddingHorizontal={10}
            paddingVertical={4}
            borderRadius={10}
            backgroundColor={isRegistration ? "rgba(0,206,200,0.15)" : "rgba(255,140,0,0.15)"}
          >
            <Text
              color={isRegistration ? eliteForgeColors.emerald : eliteForgeColors.orange}
              fontSize={11}
              fontWeight="700"
            >
              {isRegistration
                ? translate("tournamentsScreen:statusRegistration")
                : translate("tournamentsScreen:statusActive")}
            </Text>
          </XStack>
        </XStack>

        <Text color="rgba(255,255,255,0.55)" fontSize={13}>
          {courtSizeLabel(tournament.courtSize)} ·{" "}
          {translate(`tournamentsScreen:format_${tournament.format}` as never)} ·{" "}
          {translate("tournamentsScreen:teamsCount", {
            count: tournament.teams.length,
            max: tournament.maxTeams,
          })}
        </Text>
      </YStack>
    </Pressable>
  )
}

export function TournamentsScreen({ navigation }: AppStackScreenProps<"Tournaments">) {
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const { tournaments, loading, refreshing, error, reload } = useTournaments()

  const handleOpen = useCallback(
    (tournamentId: string) => {
      navigation.navigate("TournamentDetail", { tournamentId })
    },
    [navigation],
  )

  const renderItem = useCallback(
    ({ item }: { item: TournamentApiDto }) => (
      <TournamentCard tournament={item} onPress={() => handleOpen(item.id)} />
    ),
    [handleOpen],
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
            {translate("tournamentsScreen:loadError")}
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
        <Ionicons name="trophy-outline" size={40} color="rgba(255,255,255,0.3)" />
        <Text color="rgba(255,255,255,0.5)" fontSize={14} textAlign="center">
          {translate("tournamentsScreen:emptyTournaments")}
        </Text>
      </YStack>
    )
  }, [loading, error, reload])

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
            {translate("tournamentsScreen:title")}
          </Text>

          {/* Espaciador para centrar el título (sin acción de crear — eso es del panel web). */}
          <XStack width={40} height={40} />
        </XStack>

        <FlatList
          data={tournaments}
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
    </YStack>
  )
}
