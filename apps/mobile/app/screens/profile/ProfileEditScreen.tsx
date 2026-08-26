import { useCallback, useEffect, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { Text, XStack, YStack } from "tamagui"

import { MunicipalityPicker, type MunicipalityValue } from "@/components/MunicipalityPicker"
import { Button, Input, Toggle } from "@/components/ui"
import { useAuth } from "@/context/AuthContext"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { api } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import type { PlayerProfileData } from "@/utils/playerProfileStorage"

import { PositionPicker } from "./components/PositionPicker"
import { ProfileAvatar } from "./components/ProfileAvatar"
import { usePlayerProfile } from "./usePlayerProfile"
import { pickProfileImageFromGallery } from "./utils/pickProfileImage"

function getUserColor(seed: string) {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const palette = ["#00CEC8", "#FF8C00", "#7B68EE", "#2ECC71", "#E74C3C"]
  return palette[hash % palette.length]
}

export function ProfileEditScreen({ navigation }: AppStackScreenProps<"ProfileEdit">) {
  const { authEmail, authUserId } = useAuth()
  const userKey = authEmail ?? "guest"
  const { profile, saveFullProfile } = usePlayerProfile(userKey, authEmail)
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()

  const [form, setForm] = useState<PlayerProfileData>(profile)

  // Mi zona (Fase L.0) — vive en el backend, no en el perfil local MMKV.
  const [municipality, setMunicipality] = useState<MunicipalityValue | null>(null)
  const [municipalityDirty, setMunicipalityDirty] = useState(false)
  // Opt-in de push de comodín cerca (Fase 11) — igual que la zona, vive en el
  // backend; a diferencia de ella, se guarda al toque (no espera a "Guardar perfil").
  const [notifyNearbyGuestRequests, setNotifyNearbyGuestRequests] = useState(false)
  const [notifyBusy, setNotifyBusy] = useState(false)
  useEffect(() => {
    if (!authUserId) return
    let cancelled = false
    api.getMyProfile(authUserId).then((result) => {
      if (cancelled || result.kind !== "ok") return
      const { municipalityCode, city, department } = result.profile
      if (municipalityCode && city && department) {
        setMunicipality({ code: municipalityCode, name: city, department })
      }
      setNotifyNearbyGuestRequests(result.profile.notifyNearbyGuestRequests)
    })
    return () => {
      cancelled = true
    }
  }, [authUserId])

  const handleToggleNotifyNearby = useCallback(async (value: boolean) => {
    setNotifyNearbyGuestRequests(value)
    setNotifyBusy(true)
    const result = await api.updateNotifyNearbyGuestRequests(value)
    setNotifyBusy(false)
    if (result.kind !== "ok") {
      setNotifyNearbyGuestRequests(!value)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setForm(profile)
    }, [profile]),
  )

  const patchForm = useCallback((patch: Partial<PlayerProfileData>) => {
    setForm((current) => ({ ...current, ...patch }))
  }, [])

  const handlePickImage = useCallback(async () => {
    const picked = await pickProfileImageFromGallery(userKey, form.avatarUri)
    if (picked) patchForm({ avatarUri: picked.uri })
  }, [form.avatarUri, patchForm, userKey])

  const handleSave = useCallback(() => {
    if (!form.displayName.trim()) {
      Alert.alert(
        translate("profileScreen:editValidationTitle"),
        translate("profileScreen:editNameRequired"),
      )
      return
    }
    saveFullProfile(form)
    if (municipalityDirty) {
      // Best-effort: la zona se guarda en el backend con el resto del perfil.
      api.updateProfileMunicipality(municipality?.code ?? null)
    }
    navigation.goBack()
    // handleSave solo se invoca onPress — agregar estas deps no re-renderiza nada.
  }, [form, navigation, saveFullProfile, municipality?.code, municipalityDirty])

  const displaySeed = form.displayName || form.email || authEmail || "player"

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
      <StatusBar barStyle="light-content" backgroundColor={eliteForgeColors.carbon} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 28,
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
            width: "100%",
            alignSelf: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <YStack gap={20}>
            <XStack alignItems="center" justifyContent="space-between">
              <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
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
              <Text color={eliteForgeColors.white} fontWeight="800" fontSize={17}>
                {translate("profileScreen:editProfileTitle")}
              </Text>
              <XStack width={40} />
            </XStack>

            <YStack alignItems="center" gap={8}>
              <ProfileAvatar
                label={displaySeed}
                color={getUserColor(displaySeed)}
                size={96}
                imageUri={form.avatarUri}
                onPress={handlePickImage}
                showEditBadge
              />
              <Text color="rgba(255,255,255,0.5)" fontSize={12}>
                {translate("profileScreen:avatarTapHint")}
              </Text>
            </YStack>

            <YStack gap={14}>
              <Input
                label={translate("profileScreen:editDisplayName")}
                value={form.displayName}
                onChangeText={(text) => patchForm({ displayName: text })}
                placeholder={translate("profileScreen:editDisplayNameHint")}
              />
              <Input
                label={translate("profileScreen:editNickname")}
                value={form.nickname}
                onChangeText={(text) => patchForm({ nickname: text })}
                placeholder={translate("profileScreen:editNicknameHint")}
              />
              <Input
                label={translate("profileScreen:editEmail")}
                value={form.email}
                onChangeText={(text) => patchForm({ email: text })}
                keyboardType="email-address"
                placeholder="player@email.com"
              />
              <Input
                label={translate("profileScreen:editAge")}
                value={form.age}
                onChangeText={(text) => patchForm({ age: text.replace(/[^0-9]/g, "") })}
                keyboardType="number-pad"
                placeholder="18"
              />
              <Input
                label={translate("profileScreen:editBio")}
                value={form.bio}
                onChangeText={(text) => patchForm({ bio: text })}
                placeholder={translate("profileScreen:editBioHint")}
              />

              <YStack gap={8}>
                <Text color="rgba(255,255,255,0.75)" fontSize={12} fontWeight="700">
                  {translate("profileScreen:myZoneTitle")}
                </Text>
                <Text color="rgba(255,255,255,0.45)" fontSize={11} lineHeight={16}>
                  {translate("profileScreen:myZoneHint")}
                </Text>
                <MunicipalityPicker
                  value={municipality}
                  onChange={(value) => {
                    setMunicipality(value)
                    setMunicipalityDirty(true)
                  }}
                />
                <Toggle
                  label={translate("profileScreen:notifyNearbyGuestRequestsTitle")}
                  description={translate("profileScreen:notifyNearbyGuestRequestsHint")}
                  checked={notifyNearbyGuestRequests}
                  disabled={notifyBusy}
                  onCheckedChange={handleToggleNotifyNearby}
                />
              </YStack>

              <YStack gap={8}>
                <Text color="rgba(255,255,255,0.75)" fontSize={12} fontWeight="700">
                  {translate("profileScreen:favoritePositionTitle")}
                </Text>
                <Text color="rgba(255,255,255,0.45)" fontSize={11} lineHeight={16}>
                  {translate("profileScreen:favoritePositionHint")}
                </Text>
                <PositionPicker
                  selectedId={form.favoritePositionId}
                  onSelect={(id) => patchForm({ favoritePositionId: id })}
                />
              </YStack>
            </YStack>

            <Button onPress={handleSave}>{translate("profileScreen:editSave")}</Button>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </YStack>
  )
}
