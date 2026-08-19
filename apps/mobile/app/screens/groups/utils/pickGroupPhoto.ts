import { Alert } from "react-native"
import * as ImagePicker from "expo-image-picker"

import { translate } from "@/i18n/translate"

/** Debe coincidir con MAX_GROUP_PHOTO_BASE64_LENGTH del backend (libs/contracts/src/groups). */
export const MAX_GROUP_PHOTO_BASE64_LENGTH = 500_000

export type PickGroupPhotoResult =
  { kind: "ok"; base64: string } | { kind: "cancelled" } | { kind: "too-large" } | { kind: "error" }

/**
 * Mismo picker que ya usa el avatar de perfil (recorte cuadrado, comprimido),
 * pero pidiendo el base64 directo — no hay storage real, se guarda en Postgres.
 */
export async function pickGroupPhoto(): Promise<PickGroupPhotoResult> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        translate("profileScreen:avatarPermissionTitle"),
        translate("profileScreen:avatarPermissionMessage"),
      )
      return { kind: "cancelled" }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    })

    if (result.canceled) return { kind: "cancelled" }

    const base64 = result.assets[0]?.base64
    if (!base64) return { kind: "cancelled" }

    if (base64.length > MAX_GROUP_PHOTO_BASE64_LENGTH) {
      return { kind: "too-large" }
    }

    return { kind: "ok", base64 }
  } catch {
    Alert.alert(
      translate("profileScreen:avatarNativeMissingTitle"),
      translate("profileScreen:avatarNativeMissingMessage"),
    )
    return { kind: "error" }
  }
}
