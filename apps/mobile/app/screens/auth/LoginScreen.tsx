import { FC, useCallback, useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, Pressable, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { ScrollView, Text, XStack, YStack } from "tamagui"

import {
  AuthFormCard,
  Button,
  EliteForgeLogo,
  Input,
  LinkText,
  SocialButton,
} from "@/components/ui"
import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { api } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { openLinkInBrowser } from "@/utils/openLinkInBrowser"

type LoginScreenProps = AppStackScreenProps<"Login">

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UI_PREVIEW_TOKEN = "dev-ui-preview-token"
const UI_PREVIEW_EMAIL = "ui-preview@eliteforge.local"
/** No hay OAuth real implementado — oculta los botones hasta que lo haya. */
const SOCIAL_LOGIN_ENABLED = false

/** Altura unificada input / botón login (fila responsive) */
const FIELD_HEIGHT = 44

export const LoginScreen: FC<LoginScreenProps> = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { setAuthToken, setAuthEmail, setAuthUserId } = useAuth()

  const {
    insets,
    horizontalPadding,
    contentMaxWidth,
    sectionGap,
    isSmallScreen,
    isTablet,
    keyboardVerticalOffset,
    screenWidth,
  } = useResponsiveLayout()

  const loginBtnMinWidth = isSmallScreen
    ? Math.min(118, Math.round(screenWidth * 0.32))
    : isTablet
      ? 148
      : 132
  const cardPadding = isSmallScreen ? 14 : isTablet ? 20 : 16
  const cardGap = isSmallScreen ? 12 : 16

  const handleLogin = useCallback(async () => {
    if (isLoading) return

    const email = username.trim().toLowerCase()

    if (!email || !password) {
      setErrorMessage(translate("loginScreen:emptyFields"))
      return
    }

    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      setErrorMessage(translate("loginScreen:invalidEmail"))
      return
    }

    if (password.length < 8 || password.length > 72) {
      setErrorMessage(translate("loginScreen:passwordLength"))
      return
    }

    setErrorMessage("")
    setIsLoading(true)

    try {
      const response = await api.login(email, password)

      if (response.kind === "ok") {
        setAuthToken(response.accessToken)
        setAuthEmail(response.user.email)
        setAuthUserId(response.user.id)
        return
      }

      switch (response.kind) {
        case "unauthorized":
          setErrorMessage(translate("loginScreen:invalidCredentials"))
          break
        case "cannot-connect":
        case "timeout":
          setErrorMessage(translate("loginScreen:cannotConnect"))
          break
        case "server":
          setErrorMessage(translate("loginScreen:serverError"))
          break
        default:
          setErrorMessage(translate("loginScreen:loginFailed"))
      }
    } catch {
      setErrorMessage(translate("loginScreen:loginFailed"))
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, password, setAuthEmail, setAuthToken, setAuthUserId, username])

  const handleCreateAccount = useCallback(() => {
    openLinkInBrowser(Config.SIGN_UP_URL)
  }, [])

  const handleUiPreview = useCallback(() => {
    setErrorMessage("")
    setAuthEmail(UI_PREVIEW_EMAIL)
    setAuthToken(UI_PREVIEW_TOKEN)
  }, [setAuthEmail, setAuthToken])

  const handleSettings = useCallback(() => {
    Alert.alert(translate("feedDrawer:comingSoonTitle"), translate("loginScreen:settingsSoon"))
  }, [])

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
      <StatusBar barStyle="light-content" backgroundColor={eliteForgeColors.carbon} />

      <Pressable
        onPress={handleSettings}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={translate("loginScreen:settingsSoon")}
        style={{
          position: "absolute",
          top: insets.top + 8,
          right: Math.max(horizontalPadding, 16),
          zIndex: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2e2e2e",
          borderWidth: 1,
          borderColor: "#555555",
        }}
      >
        <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.8)" />
      </Pressable>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          flex={1}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            paddingTop: insets.top + (isSmallScreen ? 8 : 16),
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: horizontalPadding,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <YStack
            width="100%"
            maxWidth={contentMaxWidth}
            gap={sectionGap}
            alignItems="center"
            flex={1}
            justifyContent={isSmallScreen ? "flex-start" : "center"}
            paddingTop={isSmallScreen ? 8 : 4}
          >
            <EliteForgeLogo />

            <Text
              color="#FFFFFF"
              opacity={0.65}
              fontSize={isSmallScreen ? 13 : 14}
              textAlign="center"
              paddingHorizontal={8}
            >
              {translate("loginScreen:subtitle")}
            </Text>

            <AuthFormCard>
              <YStack gap={cardGap} padding={cardPadding}>
                <Input
                  label={translate("loginScreen:usernameFieldLabel")}
                  placeholder={translate("loginScreen:usernameFieldPlaceholder")}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text)
                    if (errorMessage) setErrorMessage("")
                  }}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />

                {/* Fila del video: contraseña (flex) + Iniciar sesión */}
                <YStack gap="$2" width="100%">
                  <Text color="$efWhite" fontSize="$3" fontWeight="600" opacity={0.9}>
                    {translate("loginScreen:passwordFieldLabel")}
                  </Text>
                  <XStack width="100%" alignItems="center" gap={isSmallScreen ? 8 : 10}>
                    <YStack flex={1} minWidth={0}>
                      <Input
                        label=""
                        hideLabel
                        placeholder={translate("loginScreen:passwordFieldPlaceholder")}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text)
                          if (errorMessage) setErrorMessage("")
                        }}
                        secureTextEntry
                        autoComplete="password"
                      />
                    </YStack>

                    <Button
                      onPress={handleLogin}
                      disabled={isLoading}
                      opacity={isLoading ? 0.7 : 1}
                      height={FIELD_HEIGHT}
                      minWidth={loginBtnMinWidth}
                      px={isSmallScreen ? "$2.5" : "$3"}
                      fontSize={isSmallScreen ? 13 : 14}
                    >
                      {isLoading
                        ? translate("loginScreen:signingInShort")
                        : translate("loginScreen:signInButton")}
                    </Button>
                  </XStack>
                </YStack>

                {errorMessage ? (
                  <Text
                    color="$efOrange"
                    fontSize={isSmallScreen ? 13 : 14}
                    textAlign="center"
                    accessibilityRole="alert"
                  >
                    {errorMessage}
                  </Text>
                ) : null}

                {/* Crear cuenta a la izquierda · Facebook/Gmail a la derecha (como web) */}
                <XStack
                  width="100%"
                  alignItems="center"
                  gap={isSmallScreen ? 8 : 10}
                  flexWrap="nowrap"
                >
                  <YStack flex={1} minWidth={0} alignItems="flex-start" justifyContent="center">
                    <LinkText
                      align="flex-start"
                      prompt={translate("loginScreen:createAccountPrompt")}
                      linkLabel={translate("loginScreen:createAccountLink")}
                      onPress={handleCreateAccount}
                    />
                  </YStack>

                  {SOCIAL_LOGIN_ENABLED ? (
                    <XStack alignItems="center" gap={isSmallScreen ? 8 : 10} flexShrink={0}>
                      <SocialButton
                        iconOnly
                        provider="facebook"
                        label={translate("loginScreen:facebookButton")}
                        onPress={() => undefined}
                      />
                      <SocialButton
                        iconOnly
                        provider="google"
                        label={translate("loginScreen:googleButton")}
                        onPress={() => undefined}
                      />
                    </XStack>
                  ) : null}
                </XStack>

                {__DEV__ ? (
                  <Button variant="outline" width="100%" onPress={handleUiPreview}>
                    {translate("loginScreen:uiPreviewButton")}
                  </Button>
                ) : null}
              </YStack>
            </AuthFormCard>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </YStack>
  )
}
