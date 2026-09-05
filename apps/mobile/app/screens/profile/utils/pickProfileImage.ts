import { Directory, File, Paths } from "expo-file-system"
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"

import type { ShowAppAlert } from "@/components/AppAlert"
import { translate } from "@/i18n/translate"

/** Debe coincidir con MAX_AVATAR_BASE64_LENGTH del backend (libs/contracts/src/users). */
export const MAX_AVATAR_BASE64_LENGTH = 500_000

/**
 * El recorte 1:1 del picker sale a la resolución de la cámara (1–4 MB, 1,3–5 M
 * caracteres en base64) y superaba el límite del servidor — la foto nunca
 * salía del teléfono. Un avatar se muestra chico y circular: 512×512 a JPEG
 * 0,7 (~30–80 KB, ~40–110 K chars) entra holgado y se ve igual de bien.
 */
const AVATAR_SIZE_PX = 512
const AVATAR_JPEG_QUALITY = 0.7

async function resizeForAvatar(sourceUri: string): Promise<{ uri: string; base64: string | null }> {
  const image = await ImageManipulator.manipulate(sourceUri)
    .resize({ width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX })
    .renderAsync()
  const saved = await image.saveAsync({
    compress: AVATAR_JPEG_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  })
  return { uri: saved.uri, base64: saved.base64 ?? null }
}

function sanitizeUserKey(userKey: string): string {
  return userKey.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function getExtension(uri: string): "jpg" | "png" | "webp" {
  const normalized = uri.split("?")[0]?.toLowerCase() ?? ""
  if (normalized.endsWith(".png")) return "png"
  if (normalized.endsWith(".webp")) return "webp"
  return "jpg"
}

function getAvatarDirectory(): Directory {
  const directory = new Directory(Paths.document, "profile-avatars")
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true })
  }
  return directory
}

export function isPersistedAvatarUri(uri: string | null | undefined): boolean {
  if (!uri) return false
  const avatarDirectory = new Directory(Paths.document, "profile-avatars")
  return uri.startsWith(avatarDirectory.uri)
}

export async function deleteStoredAvatar(uri: string | null | undefined): Promise<void> {
  if (!isPersistedAvatarUri(uri) || !uri) return

  try {
    const file = new File(uri)
    if (file.exists) file.delete()
  } catch {
    // Ignore cleanup failures for missing or locked files.
  }
}

function persistAvatarImage(sourceUri: string, userKey: string): string {
  const avatarDirectory = getAvatarDirectory()
  const extension = getExtension(sourceUri)
  const destination = new File(avatarDirectory, `${sanitizeUserKey(userKey)}.${extension}`)

  if (destination.exists) {
    destination.delete()
  }

  const source = new File(sourceUri)
  source.copy(destination)

  return destination.uri
}

export interface PickedProfileImage {
  /** Copia local persistida — la UI la usa al instante, sin depender de la red. */
  uri: string
  /** Para sincronizar al backend (best effort); null si el picker no lo devolvió. */
  base64: string | null
}

export async function pickProfileImageFromGallery(
  userKey: string,
  previousUri: string | null | undefined,
  showAlert: ShowAppAlert,
): Promise<PickedProfileImage | null> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      showAlert(
        translate("profileScreen:avatarPermissionTitle"),
        translate("profileScreen:avatarPermissionMessage"),
      )
      return null
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })

    if (result.canceled || !result.assets[0]?.uri) return null

    // Un solo redimensionado sirve para los dos destinos: el archivo local que
    // muestra Perfil y el base64 que se sube al servidor (menos código, y lo
    // que ve el usuario es exactamente lo que ven los demás).
    const resized = await resizeForAvatar(result.assets[0].uri)
    const persistedUri = persistAvatarImage(resized.uri, userKey)

    if (previousUri && previousUri !== persistedUri) {
      await deleteStoredAvatar(previousUri)
    }

    return { uri: persistedUri, base64: resized.base64 }
  } catch {
    showAlert(
      translate("profileScreen:avatarNativeMissingTitle"),
      translate("profileScreen:avatarNativeMissingMessage"),
    )
    return null
  }
}
