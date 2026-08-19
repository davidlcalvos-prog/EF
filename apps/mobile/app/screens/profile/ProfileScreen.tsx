import { useCallback, useRef } from "react"
import { Alert, Pressable, ScrollView, StatusBar } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { Text, YStack } from "tamagui"

import { useAuth } from "@/context/AuthContext"
import {
  getTagIdFromEmail,
  STAT_TO_TEST,
  type PhysicalTestId,
  type StatKey,
} from "@/data/mockPlayerProfile"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { PhysicalTestCard } from "./components/PhysicalTestCard"
import { PositionSuggestionCard } from "./components/PositionSuggestionCard"
import { ProfileHeader, getPositionLabel } from "./components/ProfileHeader"
import { ProfilePersonalCard } from "./components/ProfilePersonalCard"
import { ProfileQuickLinkCard, type ProfileQuickLinkId } from "./components/ProfileQuickLinkCard"
import { PsychTestCard } from "./components/PsychTestCard"
import { StatsRadarChart } from "./components/StatsRadarChart"
import { hasNoLocalProfileStats, hydrateProfileFromBackend } from "./hydrateProfileFromBackend"
import { usePlayerProfile } from "./usePlayerProfile"
import { useProfileStats } from "./useProfileStats"
import { pickProfileImageFromGallery } from "./utils/pickProfileImage"

function getUserDisplayName(email?: string) {
  if (!email) return translate("feedScreen:guestUser")
  const local = email.split("@")[0] ?? email
  return local.charAt(0).toUpperCase() + local.slice(1)
}

function getUserColor(seed: string) {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const palette = ["#00CEC8", "#FF8C00", "#7B68EE", "#2ECC71", "#E74C3C"]
  return palette[hash % palette.length]
}

export function ProfileScreen({ navigation }: AppStackScreenProps<"Profile">) {
  const { authEmail, authToken } = useAuth()
  const userKey = authEmail ?? "guest"
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const {
    profile,
    psychTest,
    reload: reloadProfile,
    resetPsychTest,
    updateProfile,
  } = usePlayerProfile(userKey, authEmail)
  const { tests, radarData, definitions, reload, resetAllTests, positionSuggestion } =
    useProfileStats(userKey, psychTest?.answers)

  // Evita relanzar la hidratación en cada focus dentro de la misma sesión de pantalla.
  const hydrationAttempted = useRef<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      reload()
      reloadProfile()

      if (authToken && hydrationAttempted.current !== userKey && hasNoLocalProfileStats(userKey)) {
        hydrationAttempted.current = userKey
        hydrateProfileFromBackend(userKey, authEmail).then((hydrated) => {
          if (hydrated) {
            reload()
            reloadProfile()
          }
        })
      }
    }, [authEmail, authToken, reload, reloadProfile, userKey]),
  )

  const displayName = profile.displayName.trim() || getUserDisplayName(authEmail)
  const displayEmail = profile.email.trim() || authEmail
  const avatarSeed = displayName || displayEmail || "player"

  const positionLabel = profile.favoritePositionId
    ? getPositionLabel(profile.favoritePositionId)
    : positionSuggestion
      ? translate(positionSuggestion.labelKey)
      : translate("profileScreen:defaultPosition")

  const positionBadge = profile.favoritePositionId
    ? "favorite"
    : positionSuggestion
      ? "suggested"
      : "default"

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleEditProfile = useCallback(() => {
    navigation.navigate("ProfileEdit")
  }, [navigation])

  const handlePickAvatar = useCallback(async () => {
    const uri = await pickProfileImageFromGallery(userKey, profile.avatarUri)
    if (uri) updateProfile({ avatarUri: uri })
  }, [profile.avatarUri, updateProfile, userKey])

  const handleQuickLink = useCallback(
    (id: ProfileQuickLinkId) => {
      if (id === "groups") {
        navigation.navigate("Groups")
        return
      }
      if (id === "matches") {
        navigation.navigate("Matches")
        return
      }
      navigation.navigate("Reservations")
    },
    [navigation],
  )

  const openTest = useCallback(
    (testId: PhysicalTestId) => {
      navigation.navigate("PhysicalTestSession", { testId })
    },
    [navigation],
  )

  const handleStatPress = useCallback(
    (statKey: StatKey) => {
      openTest(STAT_TO_TEST[statKey])
    },
    [openTest],
  )

  const handleDevResetTests = useCallback(() => {
    Alert.alert(
      translate("profileScreen:devResetTestsTitle"),
      translate("profileScreen:devResetTestsMessage"),
      [
        { text: translate("common:cancel"), style: "cancel" },
        {
          text: translate("profileScreen:devResetTestsAction"),
          style: "destructive",
          onPress: () => {
            resetAllTests()
            resetPsychTest()
            Alert.alert(
              translate("profileScreen:devResetTestsDone"),
              translate("profileScreen:devResetTestsDoneMessage"),
            )
          },
        },
      ],
    )
  }, [resetAllTests, resetPsychTest])

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
      <StatusBar barStyle="light-content" backgroundColor={eliteForgeColors.carbon} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: horizontalPadding,
          maxWidth: contentMaxWidth,
          width: "100%",
          alignSelf: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={20}>
          <ProfileHeader
            displayName={displayName}
            nickname={profile.nickname.trim() || undefined}
            email={displayEmail}
            avatarColor={getUserColor(avatarSeed)}
            avatarUri={profile.avatarUri}
            tagId={getTagIdFromEmail(authEmail)}
            positionLabel={positionLabel}
            positionBadge={positionBadge}
            onBack={handleBack}
            onEditProfile={handleEditProfile}
            onEditAvatar={handlePickAvatar}
          />

          <ProfilePersonalCard age={profile.age} bio={profile.bio} />

          {positionSuggestion && !profile.favoritePositionId && (
            <PositionSuggestionCard suggestion={positionSuggestion} />
          )}

          {positionSuggestion && profile.favoritePositionId && (
            <PositionSuggestionCard
              suggestion={positionSuggestion}
              favoritePositionLabel={getPositionLabel(profile.favoritePositionId)}
            />
          )}

          {__DEV__ && (
            <Pressable onPress={handleDevResetTests} accessibilityRole="button">
              <YStack
                borderRadius={12}
                borderWidth={1}
                borderColor="rgba(255,140,0,0.45)"
                backgroundColor="rgba(255,140,0,0.1)"
                paddingVertical={12}
                paddingHorizontal={14}
                gap={4}
              >
                <Text color={eliteForgeColors.orange} fontWeight="800" fontSize={13}>
                  {translate("profileScreen:devResetTestsButton")}
                </Text>
                <Text color="rgba(255,255,255,0.5)" fontSize={11} lineHeight={16}>
                  {translate("profileScreen:devResetTestsHint")}
                </Text>
              </YStack>
            </Pressable>
          )}

          <YStack
            borderRadius={16}
            borderWidth={1}
            borderColor={eliteForgeColors.carbonBorder}
            backgroundColor={eliteForgeColors.carbonElevated}
            padding={16}
            gap={12}
          >
            <YStack gap={4}>
              <Text color={eliteForgeColors.white} fontWeight="800" fontSize={17}>
                {translate("profileScreen:statsTitle")}
              </Text>
              <Text color="rgba(255,255,255,0.55)" fontSize={13} lineHeight={18}>
                {translate("profileScreen:statsSubtitle")}
              </Text>
            </YStack>

            <StatsRadarChart data={radarData} onStatPress={handleStatPress} />

            <Text color="rgba(255,255,255,0.45)" fontSize={11} lineHeight={16}>
              {translate("profileScreen:radarHint")}
            </Text>
          </YStack>

          <YStack gap={12}>
            <YStack gap={4}>
              <Text color={eliteForgeColors.white} fontWeight="800" fontSize={17}>
                {translate("profileScreen:testsTitle")}
              </Text>
              <Text color="rgba(255,255,255,0.55)" fontSize={13} lineHeight={18}>
                {translate("profileScreen:testsSubtitle")}
              </Text>
            </YStack>

            {definitions.map((definition) => {
              const state = tests.find((item) => item.id === definition.id)
              if (!state) return null

              return (
                <PhysicalTestCard
                  key={definition.id}
                  definition={definition}
                  state={state}
                  onStart={() => openTest(definition.id)}
                />
              )
            })}
          </YStack>

          <YStack gap={12}>
            <YStack gap={4}>
              <Text color={eliteForgeColors.white} fontWeight="800" fontSize={17}>
                {translate("profileScreen:psychSectionTitle")}
              </Text>
              <Text color="rgba(255,255,255,0.55)" fontSize={13} lineHeight={18}>
                {translate("profileScreen:psychSectionSubtitle")}
              </Text>
            </YStack>

            <PsychTestCard
              result={psychTest}
              onStart={() => navigation.navigate("PsychologicalTest")}
            />
          </YStack>

          <YStack gap={12}>
            <YStack gap={4}>
              <Text color={eliteForgeColors.white} fontWeight="800" fontSize={17}>
                {translate("profileScreen:quickAccessTitle")}
              </Text>
              <Text color="rgba(255,255,255,0.55)" fontSize={13} lineHeight={18}>
                {translate("profileScreen:quickAccessSubtitle")}
              </Text>
            </YStack>

            <ProfileQuickLinkCard id="groups" onPress={() => handleQuickLink("groups")} />
            <ProfileQuickLinkCard id="matches" onPress={() => handleQuickLink("matches")} />
            <ProfileQuickLinkCard
              id="reservations"
              onPress={() => handleQuickLink("reservations")}
            />
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
