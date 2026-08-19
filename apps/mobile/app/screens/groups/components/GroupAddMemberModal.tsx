import { useState } from "react"
import { ActivityIndicator, Keyboard, Modal, Pressable, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { TextField } from "@/components/TextField"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export type AddMemberOutcome = "ok" | "not-found" | "conflict" | "error"

export interface GroupAddMemberModalProps {
  visible: boolean
  onClose: () => void
  onAdd: (email: string) => Promise<AddMemberOutcome>
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function GroupAddMemberModal({ visible, onClose, onAdd }: GroupAddMemberModalProps) {
  const { insets } = useResponsiveLayout()
  const [email, setEmail] = useState("")
  const [adding, setAdding] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const isValid = EMAIL_REGEX.test(email.trim())

  const handleClose = () => {
    if (adding) return
    setEmail("")
    setErrorKey(null)
    Keyboard.dismiss()
    onClose()
  }

  const handleAdd = async () => {
    if (!isValid || adding) return
    setErrorKey(null)
    setAdding(true)
    const outcome = await onAdd(email.trim())
    setAdding(false)

    if (outcome === "ok") {
      setEmail("")
      Keyboard.dismiss()
      onClose()
      return
    }

    setErrorKey(
      outcome === "not-found"
        ? "groupsScreen:addMemberNotFound"
        : outcome === "conflict"
          ? "groupsScreen:addMemberConflict"
          : "groupsScreen:addMemberError",
    )
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
              {translate("groupsScreen:addMemberTitle")}
            </Text>

            <Pressable
              onPress={handleAdd}
              disabled={!isValid || adding}
              accessibilityRole="button"
              style={{ opacity: !isValid || adding ? 0.4 : 1 }}
            >
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={14}
                paddingHorizontal={11}
                paddingVertical={6}
                alignItems="center"
                gap={5}
              >
                {adding ? <ActivityIndicator size="small" color="#1a1a1a" /> : null}
                <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                  {adding
                    ? translate("groupsScreen:addingMember")
                    : translate("groupsScreen:addMemberSubmit")}
                </Text>
              </XStack>
            </Pressable>
          </XStack>

          <YStack paddingHorizontal={16} paddingTop={16} paddingBottom={20} gap={8}>
            <TextField
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                if (errorKey) setErrorKey(null)
              }}
              editable={!adding}
              placeholder={translate("groupsScreen:addMemberPlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoFocus
              autoCapitalize="none"
              keyboardType="email-address"
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
            {errorKey ? (
              <Text color="#E74C3C" fontSize={12}>
                {translate(errorKey as never)}
              </Text>
            ) : null}
          </YStack>
        </View>
      </View>
    </Modal>
  )
}
