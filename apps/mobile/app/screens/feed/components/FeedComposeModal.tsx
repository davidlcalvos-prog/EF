import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { getUserColor } from "@/utils/avatarColor"

import { FeedAvatar } from "./FeedAvatar"

export interface FeedComposeModalProps {
  visible: boolean
  onClose: () => void
  onPost: (content: string) => Promise<boolean>
}

/** Altura fija compacta — comentario corto (sin teclado) */
const SHEET_HEIGHT_RESTING = 236
/** Con teclado aún más bajo para dejar ver el feed detrás */
const SHEET_HEIGHT_KEYBOARD = 200
/** Nunca más del 38% de la pantalla */
const SHEET_MAX_RATIO = 0.38
/** Holgura extra sobre el teclado para que no se corten Foto/Video/Partido */
const KEYBOARD_BOTTOM_GAP = 22

function getUserDisplayName(email?: string) {
  if (!email) return translate("feedScreen:guestUser")
  const local = email.split("@")[0] ?? email
  return local.charAt(0).toUpperCase() + local.slice(1)
}

function getUserInitial(email?: string) {
  if (!email) return "?"
  return email.trim().charAt(0).toUpperCase()
}

function AttachChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <XStack
      alignItems="center"
      justifyContent="center"
      gap={5}
      paddingHorizontal={8}
      paddingVertical={7}
      borderRadius={9}
      backgroundColor="#2e2e2e"
      borderWidth={1}
      borderColor="#555555"
      flex={1}
    >
      <Ionicons name={icon} size={15} color={eliteForgeColors.emerald} />
      <Text color="#FFFFFF" fontSize={11} fontWeight="600" numberOfLines={1}>
        {label}
      </Text>
    </XStack>
  )
}

export function FeedComposeModal({ visible, onClose, onPost }: FeedComposeModalProps) {
  const { authEmail, authAvatarBase64 } = useAuth()
  const { insets, isSmallScreen } = useResponsiveLayout()
  const [draft, setDraft] = useState("")
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState(false)

  /** Altura estable de pantalla (no se encoge al abrir el teclado → evita doble offset) */
  const screenHeight = useMemo(() => Dimensions.get("screen").height, [])

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0)
      return
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"

    const onShow = Keyboard.addListener(showEvent, (event) => {
      // En algunos Android el height incluye barra de navegación; usamos el valor reportado tal cual
      setKeyboardHeight(event.endCoordinates.height)
    })
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0)
    })

    return () => {
      onShow.remove()
      onHide.remove()
    }
  }, [visible])

  const keyboardOpen = keyboardHeight > 0

  const sheetHeight = useMemo(() => {
    const preferred = keyboardOpen
      ? isSmallScreen
        ? SHEET_HEIGHT_KEYBOARD - 12
        : SHEET_HEIGHT_KEYBOARD
      : isSmallScreen
        ? SHEET_HEIGHT_RESTING - 16
        : SHEET_HEIGHT_RESTING

    const maxByScreen = screenHeight * SHEET_MAX_RATIO
    // Espacio libre por encima del teclado, dejando ≥25% del total como “fondo” si cabe
    const maxAboveKeyboard = keyboardOpen
      ? Math.max(160, screenHeight - keyboardHeight - screenHeight * 0.25)
      : maxByScreen

    return Math.min(preferred, maxByScreen, maxAboveKeyboard)
  }, [isSmallScreen, keyboardOpen, keyboardHeight, screenHeight])

  const handleClose = () => {
    if (posting) return
    setDraft("")
    setError(false)
    Keyboard.dismiss()
    onClose()
  }

  const handlePost = async () => {
    const content = draft.trim()
    if (!content || posting) return

    setError(false)
    setPosting(true)
    const success = await onPost(content)
    setPosting(false)

    if (!success) {
      setError(true)
      return
    }

    setDraft("")
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
        {/* Fondo atenuado: siempre se ve el feed (~62%+ sin teclado) */}
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

        {/* Sheet anclado al borde superior del teclado — altura fija compacta */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: keyboardOpen ? keyboardHeight + KEYBOARD_BOTTOM_GAP : 0,
            height: sheetHeight,
            backgroundColor: "#363636",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderWidth: 1,
            borderColor: "#555555",
            overflow: "hidden",
          }}
        >
          <XStack height={2} width="100%">
            <YStack flex={1} backgroundColor="#00CEC8" />
            <YStack flex={1} backgroundColor="#FF8C00" />
          </XStack>

          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={12}
            paddingVertical={8}
            borderBottomWidth={1}
            borderBottomColor="#555555"
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
              {translate("feedScreen:composeTitle")}
            </Text>

            <Pressable
              onPress={handlePost}
              disabled={draft.trim().length === 0 || posting}
              accessibilityRole="button"
              style={{ opacity: draft.trim().length === 0 || posting ? 0.4 : 1 }}
            >
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={14}
                paddingHorizontal={11}
                paddingVertical={6}
                alignItems="center"
                gap={5}
              >
                {posting ? <ActivityIndicator size="small" color="#1a1a1a" /> : null}
                <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                  {posting
                    ? translate("feedScreen:composePosting")
                    : translate("feedScreen:composePost")}
                </Text>
              </XStack>
            </Pressable>
          </XStack>

          {error ? (
            <XStack paddingHorizontal={12} paddingTop={6}>
              <Text color="#E74C3C" fontSize={12}>
                {translate("feedScreen:composeError")}
              </Text>
            </XStack>
          ) : null}

          <YStack flex={1} paddingHorizontal={12} paddingTop={10} paddingBottom={6} gap={8}>
            <XStack alignItems="center" gap={8}>
              <FeedAvatar
                label={getUserInitial(authEmail)}
                color={getUserColor(authEmail)}
                photoBase64={authAvatarBase64}
                size={32}
              />
              <Text color="#FFFFFF" fontWeight="700" fontSize={13} flex={1} numberOfLines={1}>
                {getUserDisplayName(authEmail)}
              </Text>
            </XStack>

            <TextField
              value={draft}
              onChangeText={(text) => {
                setDraft(text)
                if (error) setError(false)
              }}
              editable={!posting}
              placeholder={translate("feedScreen:composePlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.35)"
              multiline
              autoFocus
              scrollEnabled
              containerStyle={{ flex: 1 }}
              inputWrapperStyle={{
                flex: 1,
                minHeight: 56,
                maxHeight: 88,
                borderWidth: 0,
                backgroundColor: "transparent",
                paddingHorizontal: 0,
                paddingVertical: 0,
              }}
              style={{
                flex: 1,
                color: "#FFFFFF",
                fontSize: 15,
                lineHeight: 21,
                textAlignVertical: "top",
                padding: 0,
              }}
            />
          </YStack>

          <YStack
            paddingHorizontal={12}
            paddingTop={6}
            paddingBottom={keyboardOpen ? 12 : Math.max(insets.bottom, 8)}
            borderTopWidth={1}
            borderTopColor="rgba(85,85,85,0.7)"
          >
            <XStack gap={6}>
              <AttachChip icon="image-outline" label={translate("feedScreen:composerPhoto")} />
              <AttachChip icon="videocam-outline" label={translate("feedScreen:composerVideo")} />
              <AttachChip icon="football-outline" label={translate("feedScreen:composerMatch")} />
            </XStack>
          </YStack>
        </View>
      </View>
    </Modal>
  )
}
