import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { Animated, Modal, Pressable, View } from "react-native"
import { Text, XStack, YStack } from "tamagui"

import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export type AppAlertButtonStyle = "default" | "cancel" | "destructive"

export interface AppAlertButton {
  text: string
  style?: AppAlertButtonStyle
  onPress?: () => void
}

/** Misma firma que Alert.alert(title, message, buttons) de react-native. */
export type ShowAppAlert = (title: string, message?: string, buttons?: AppAlertButton[]) => void

interface AlertRequest {
  title: string
  message?: string
  buttons: AppAlertButton[]
}

const AppAlertContext = createContext<ShowAppAlert | null>(null)

function AlertButtonView({ button, onPress }: { button: AppAlertButton; onPress: () => void }) {
  const isCancel = button.style === "cancel"
  const isDestructive = button.style === "destructive"

  const backgroundColor =
    isCancel || isDestructive ? eliteForgeColors.carbonInput : eliteForgeColors.emerald
  const borderColor = isDestructive
    ? "#E74C3C"
    : isCancel
      ? eliteForgeColors.carbonBorder
      : eliteForgeColors.emerald
  const textColor = isDestructive ? "#E74C3C" : isCancel ? "rgba(255,255,255,0.8)" : "#1a1a1a"

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flex: 1 }}>
      <XStack
        backgroundColor={backgroundColor}
        borderWidth={1}
        borderColor={borderColor}
        borderRadius={12}
        paddingVertical={12}
        alignItems="center"
        justifyContent="center"
      >
        <Text color={textColor} fontWeight="800" fontSize={14}>
          {button.text}
        </Text>
      </XStack>
    </Pressable>
  )
}

function AppAlertModal({
  request,
  onDismiss,
}: {
  request: AlertRequest | null
  onDismiss: () => void
}) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    if (!request) return
    opacity.setValue(0)
    scale.setValue(0.9)
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 9, tension: 90, useNativeDriver: true }),
    ]).start()
  }, [request, opacity, scale])

  if (!request) return null

  const handlePress = (button: AppAlertButton) => {
    onDismiss()
    button.onPress?.()
  }

  // Mismo criterio que Alert.alert nativo: solo se puede descartar tocando
  // afuera si hay un botón 'cancel' — si no, hay que elegir una opción.
  const handleBackdropPress = () => {
    const cancelButton = request.buttons.find((b) => b.style === "cancel")
    if (!cancelButton) return
    handlePress(cancelButton)
  }

  const stacked = request.buttons.length >= 3

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
          onPress={handleBackdropPress}
          accessibilityLabel="Cerrar"
        />

        <Animated.View style={{ width: "100%", maxWidth: 360, opacity, transform: [{ scale }] }}>
          <YStack
            backgroundColor={eliteForgeColors.carbonElevated}
            borderWidth={1}
            borderColor={eliteForgeColors.carbonBorder}
            borderRadius={16}
            overflow="hidden"
          >
            <XStack height={2} width="100%">
              <YStack flex={1} backgroundColor={eliteForgeColors.emerald} />
              <YStack flex={1} backgroundColor={eliteForgeColors.orange} />
            </XStack>

            <YStack paddingHorizontal={20} paddingTop={20} paddingBottom={16} gap={6}>
              <Text color="#FFFFFF" fontWeight="800" fontSize={16}>
                {request.title}
              </Text>
              {request.message ? (
                <Text color="rgba(255,255,255,0.6)" fontSize={13} lineHeight={18}>
                  {request.message}
                </Text>
              ) : null}
            </YStack>

            <View
              style={{
                flexDirection: stacked ? "column" : "row",
                gap: 8,
                paddingHorizontal: 16,
                paddingBottom: 16,
              }}
            >
              {request.buttons.map((button, index) => (
                <AlertButtonView
                  key={`${button.text}-${index}`}
                  button={button}
                  onPress={() => handlePress(button)}
                />
              ))}
            </View>
          </YStack>
        </Animated.View>
      </View>
    </Modal>
  )
}

export function AppAlertProvider({ children }: PropsWithChildren) {
  const [request, setRequest] = useState<AlertRequest | null>(null)

  const showAlert = useCallback<ShowAppAlert>((title, message, buttons) => {
    setRequest({
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: translate("common:ok") }],
    })
  }, [])

  const handleDismiss = useCallback(() => setRequest(null), [])

  return (
    <AppAlertContext.Provider value={showAlert}>
      {children}
      <AppAlertModal request={request} onDismiss={handleDismiss} />
    </AppAlertContext.Provider>
  )
}

/** Mismo uso que Alert.alert(title, message, buttons) — ver ShowAppAlert. */
export function useAppAlert(): ShowAppAlert {
  const context = useContext(AppAlertContext)
  if (!context) throw new Error("useAppAlert must be used within an AppAlertProvider")
  return context
}
