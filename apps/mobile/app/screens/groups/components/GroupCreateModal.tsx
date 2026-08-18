import { useState } from "react"
import { ActivityIndicator, Keyboard, Modal, Pressable, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { TextField } from "@/components/TextField"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export interface GroupCreateModalProps {
  visible: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<boolean>
}

const MIN_LENGTH = 2
const MAX_LENGTH = 80

export function GroupCreateModal({ visible, onClose, onCreate }: GroupCreateModalProps) {
  const { insets } = useResponsiveLayout()
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(false)

  const trimmedLength = name.trim().length
  const isValid = trimmedLength >= MIN_LENGTH && trimmedLength <= MAX_LENGTH

  const handleClose = () => {
    if (creating) return
    setName("")
    setError(false)
    Keyboard.dismiss()
    onClose()
  }

  const handleCreate = async () => {
    if (!isValid || creating) return
    setError(false)
    setCreating(true)
    const success = await onCreate(name.trim())
    setCreating(false)

    if (!success) {
      setError(true)
      return
    }
    setName("")
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
              {translate("groupsScreen:createTitle")}
            </Text>

            <Pressable
              onPress={handleCreate}
              disabled={!isValid || creating}
              accessibilityRole="button"
              style={{ opacity: !isValid || creating ? 0.4 : 1 }}
            >
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={14}
                paddingHorizontal={11}
                paddingVertical={6}
                alignItems="center"
                gap={5}
              >
                {creating ? <ActivityIndicator size="small" color="#1a1a1a" /> : null}
                <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                  {creating
                    ? translate("groupsScreen:creating")
                    : translate("groupsScreen:createSubmit")}
                </Text>
              </XStack>
            </Pressable>
          </XStack>

          <YStack paddingHorizontal={16} paddingTop={16} paddingBottom={20} gap={8}>
            <TextField
              value={name}
              onChangeText={(text) => {
                setName(text)
                if (error) setError(false)
              }}
              editable={!creating}
              placeholder={translate("groupsScreen:createPlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoFocus
              maxLength={MAX_LENGTH}
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
            {error ? (
              <Text color="#E74C3C" fontSize={12}>
                {translate("groupsScreen:createError")}
              </Text>
            ) : trimmedLength > 0 && !isValid ? (
              <Text color="#E74C3C" fontSize={12}>
                {translate("groupsScreen:createLengthError")}
              </Text>
            ) : null}
          </YStack>
        </View>
      </View>
    </Modal>
  )
}
