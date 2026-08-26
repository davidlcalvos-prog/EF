import { useState } from "react"
import { ActivityIndicator, Keyboard, Modal, Pressable, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { MunicipalityPicker, type MunicipalityValue } from "@/components/MunicipalityPicker"
import { TextField } from "@/components/TextField"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { GroupDetailApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { GroupAvatar } from "./GroupAvatar"
import { pickGroupPhoto } from "../utils/pickGroupPhoto"

export interface GroupEditModalProps {
  visible: boolean
  onClose: () => void
  group: GroupDetailApiDto
  onSave: (payload: {
    name: string
    photoBase64?: string
    removePhoto?: boolean
    municipalityCode?: string | null
  }) => Promise<{ kind: "ok"; group: GroupDetailApiDto } | GeneralApiProblem>
}

function describeProblem(problem: GeneralApiProblem): string {
  switch (problem.kind) {
    case "forbidden":
      return translate("groupsScreen:actionForbidden")
    case "rejected":
      return translate("groupsScreen:editGroupInvalid")
    case "not-found":
      return translate("groupsScreen:notFoundError")
    default:
      return translate("groupsScreen:actionError")
  }
}

export function GroupEditModal({ visible, onClose, group, onSave }: GroupEditModalProps) {
  const { insets } = useResponsiveLayout()
  const [name, setName] = useState(group.name)
  const [newPhotoBase64, setNewPhotoBase64] = useState<string | undefined>(undefined)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  // Zona del grupo (Fase L.0) — precargada con la actual del grupo.
  const initialMunicipality: MunicipalityValue | null =
    group.municipalityCode && group.city && group.department
      ? { code: group.municipalityCode, name: group.city, department: group.department }
      : null
  const [municipality, setMunicipality] = useState<MunicipalityValue | null>(initialMunicipality)
  const [municipalityDirty, setMunicipalityDirty] = useState(false)

  const previewPhoto = removePhoto ? null : (newPhotoBase64 ?? group.photoBase64)
  const isValid = name.trim().length >= 2 && name.trim().length <= 80

  const reset = () => {
    setName(group.name)
    setNewPhotoBase64(undefined)
    setRemovePhoto(false)
    setErrorText(null)
    setMunicipality(initialMunicipality)
    setMunicipalityDirty(false)
  }

  const handleClose = () => {
    if (saving) return
    reset()
    Keyboard.dismiss()
    onClose()
  }

  const handlePickPhoto = async () => {
    const result = await pickGroupPhoto()
    if (result.kind === "ok") {
      setErrorText(null)
      setNewPhotoBase64(result.base64)
      setRemovePhoto(false)
      return
    }
    if (result.kind === "too-large") {
      setErrorText(translate("groupsScreen:photoTooHeavy"))
    }
  }

  const handleRemovePhoto = () => {
    setErrorText(null)
    setNewPhotoBase64(undefined)
    setRemovePhoto(true)
  }

  const handleSave = async () => {
    if (!isValid || saving) return
    setErrorText(null)
    setSaving(true)
    const result = await onSave({
      name: name.trim(),
      ...(removePhoto ? { removePhoto: true } : {}),
      ...(!removePhoto && newPhotoBase64 !== undefined ? { photoBase64: newPhotoBase64 } : {}),
      ...(municipalityDirty ? { municipalityCode: municipality?.code ?? null } : {}),
    })
    setSaving(false)

    if (result.kind !== "ok") {
      setErrorText(describeProblem(result))
      return
    }
    reset()
    Keyboard.dismiss()
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
          onPress={handleClose}
          accessibilityLabel="Cerrar"
        />

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: eliteForgeColors.carbonElevated,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderWidth: 1,
            borderColor: eliteForgeColors.carbonBorder,
            overflow: "hidden",
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <XStack height={2} width="100%">
            <YStack flex={1} backgroundColor={eliteForgeColors.emerald} />
            <YStack flex={1} backgroundColor={eliteForgeColors.orange} />
          </XStack>

          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={12}
            paddingVertical={8}
            borderBottomWidth={1}
            borderBottomColor={eliteForgeColors.carbonBorder}
          >
            <Pressable
              onPress={handleClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={translate("feedScreen:composeCancel")}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>

            <Text color="#FFFFFF" fontWeight="800" fontSize={14}>
              {translate("groupsScreen:editGroupTitle")}
            </Text>

            <Pressable
              onPress={handleSave}
              disabled={!isValid || saving}
              accessibilityRole="button"
              style={{ opacity: !isValid || saving ? 0.4 : 1 }}
            >
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={14}
                paddingHorizontal={11}
                paddingVertical={6}
                alignItems="center"
                gap={5}
              >
                {saving ? <ActivityIndicator size="small" color="#1a1a1a" /> : null}
                <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                  {saving
                    ? translate("groupsScreen:savingGroup")
                    : translate("groupsScreen:saveGroup")}
                </Text>
              </XStack>
            </Pressable>
          </XStack>

          <YStack paddingHorizontal={16} paddingTop={16} paddingBottom={20} gap={16}>
            <XStack alignItems="center" gap={14}>
              <GroupAvatar
                seed={group.id}
                name={name || group.name}
                photoBase64={previewPhoto}
                size={64}
              />
              <YStack gap={8}>
                <Pressable onPress={handlePickPhoto} accessibilityRole="button">
                  <XStack
                    borderWidth={1}
                    borderColor={eliteForgeColors.carbonBorder}
                    backgroundColor={eliteForgeColors.carbonInput}
                    borderRadius={10}
                    paddingHorizontal={12}
                    paddingVertical={8}
                  >
                    <Text color="#FFFFFF" fontSize={13} fontWeight="700">
                      {translate("groupsScreen:changePhoto")}
                    </Text>
                  </XStack>
                </Pressable>
                {previewPhoto ? (
                  <Pressable onPress={handleRemovePhoto} accessibilityRole="button">
                    <Text color="#E74C3C" fontSize={13} fontWeight="700">
                      {translate("groupsScreen:removePhoto")}
                    </Text>
                  </Pressable>
                ) : null}
              </YStack>
            </XStack>

            <YStack gap={8}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("groupsScreen:editNameLabel")}
              </Text>
              <TextField
                value={name}
                onChangeText={(text) => {
                  setName(text)
                  if (errorText) setErrorText(null)
                }}
                editable={!saving}
                placeholder={translate("groupsScreen:editNamePlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.35)"
                inputWrapperStyle={{
                  borderWidth: 1,
                  borderColor: eliteForgeColors.carbonBorder,
                  borderRadius: 12,
                  backgroundColor: eliteForgeColors.carbonInput,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
                style={{ color: "#FFFFFF", fontSize: 15 }}
              />
            </YStack>

            <YStack gap={6}>
              <Text color="rgba(255,255,255,0.75)" fontSize={12} fontWeight="700">
                {translate("groupsScreen:zoneTitle")}
              </Text>
              <MunicipalityPicker
                value={municipality}
                onChange={(value) => {
                  setMunicipality(value)
                  setMunicipalityDirty(true)
                }}
              />
            </YStack>

            {errorText ? (
              <Text color="#E74C3C" fontSize={12}>
                {errorText}
              </Text>
            ) : null}
          </YStack>
        </View>
      </View>
    </Modal>
  )
}
