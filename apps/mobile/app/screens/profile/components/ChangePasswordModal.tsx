import { useState } from "react"
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { Input } from "@/components/ui"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export type ChangePasswordOutcome = "ok" | "wrong-current" | "error"

export interface ChangePasswordModalProps {
  visible: boolean
  onClose: () => void
  /** Llama a `api.changePassword`; quien lo implementa guarda el token nuevo. */
  onSubmit: (currentPassword: string, newPassword: string) => Promise<ChangePasswordOutcome>
}

/** Mismas reglas que `ChangePasswordDto` del backend (8–72, una letra y un número). */
const PASSWORD_MIN = 8
const PASSWORD_MAX = 72
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/

/**
 * Sección "Seguridad" de editar perfil (build 7): tres campos — actual, nueva
 * y repetir — con validación local antes de pegarle al backend (la ruta tiene
 * un límite de 5 intentos por minuto; no vale la pena gastarlos en un
 * "no coinciden"). Misma hoja inferior que GroupAddMemberModal.
 */
export function ChangePasswordModal({ visible, onClose, onSubmit }: ChangePasswordModalProps) {
  const { insets } = useResponsiveLayout()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const filled = currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0

  const reset = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setErrorKey(null)
  }

  const handleClose = () => {
    if (busy) return
    reset()
    Keyboard.dismiss()
    onClose()
  }

  const localValidationKey = (): string | null => {
    if (newPassword !== confirmPassword) return "profileScreen:changePasswordMismatch"
    if (
      newPassword.length < PASSWORD_MIN ||
      newPassword.length > PASSWORD_MAX ||
      !PASSWORD_COMPLEXITY_REGEX.test(newPassword)
    ) {
      return "profileScreen:changePasswordRules"
    }
    return null
  }

  const handleSubmit = async () => {
    if (!filled || busy) return
    const invalid = localValidationKey()
    if (invalid) {
      setErrorKey(invalid)
      return
    }
    setErrorKey(null)
    setBusy(true)
    const outcome = await onSubmit(currentPassword, newPassword)
    setBusy(false)

    if (outcome === "ok") {
      reset()
      Keyboard.dismiss()
      onClose()
      return
    }
    setErrorKey(
      outcome === "wrong-current"
        ? "profileScreen:changePasswordWrongCurrent"
        : "profileScreen:changePasswordError",
    )
  }

  const clearError = () => {
    if (errorKey) setErrorKey(null)
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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
          accessibilityLabel={translate("feedScreen:composeCancel")}
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
              {translate("profileScreen:changePasswordTitle")}
            </Text>

            <Pressable
              onPress={handleSubmit}
              disabled={!filled || busy}
              accessibilityRole="button"
              style={{ opacity: !filled || busy ? 0.4 : 1 }}
              testID="change-password-submit"
            >
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={14}
                paddingHorizontal={11}
                paddingVertical={6}
                alignItems="center"
                gap={5}
              >
                {busy ? <ActivityIndicator size="small" color="#1a1a1a" /> : null}
                <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                  {busy
                    ? translate("profileScreen:changingPassword")
                    : translate("profileScreen:changePasswordSubmit")}
                </Text>
              </XStack>
            </Pressable>
          </XStack>

          <YStack paddingHorizontal={16} paddingTop={16} paddingBottom={20} gap={12}>
            <Input
              label={translate("profileScreen:changePasswordCurrent")}
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text)
                clearError()
              }}
              disabled={busy}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              autoFocus
            />
            <Input
              label={translate("profileScreen:changePasswordNew")}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text)
                clearError()
              }}
              disabled={busy}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <Input
              label={translate("profileScreen:changePasswordConfirm")}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text)
                clearError()
              }}
              disabled={busy}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              onSubmitEditing={handleSubmit}
            />
            <Text color="rgba(255,255,255,0.45)" fontSize={11} lineHeight={16}>
              {translate("profileScreen:changePasswordRules")}
            </Text>
            {errorKey ? (
              <Text color="#E74C3C" fontSize={12}>
                {translate(errorKey as never)}
              </Text>
            ) : null}
          </YStack>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
