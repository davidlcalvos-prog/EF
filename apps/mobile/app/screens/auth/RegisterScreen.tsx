import { useEffect } from "react"
import { ActivityIndicator } from "react-native"
import { Text, YStack } from "tamagui"

import { EliteForgeLogo } from "@/components/ui"
import Config from "@/config"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { openLinkInBrowser } from "@/utils/openLinkInBrowser"

type RegisterScreenProps = AppStackScreenProps<"Register">

/**
 * Pantalla puente: el registro real vive en apps/web (/auth/sign-up).
 * Si se navega aquí, abre el formulario web y vuelve al login.
 */
export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { insets, horizontalPadding, contentMaxWidth, isSmallScreen } = useResponsiveLayout()

  useEffect(() => {
    openLinkInBrowser(Config.SIGN_UP_URL)
    const timer = setTimeout(() => {
      if (navigation.canGoBack()) {
        navigation.goBack()
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [navigation])

  return (
    <YStack
      flex={1}
      backgroundColor={eliteForgeColors.carbon}
      paddingTop={insets.top + 16}
      paddingBottom={insets.bottom + 16}
      paddingHorizontal={horizontalPadding}
      alignItems="center"
      justifyContent="center"
    >
      <YStack
        width="100%"
        maxWidth={contentMaxWidth}
        alignItems="center"
        gap={isSmallScreen ? 16 : 20}
      >
        <EliteForgeLogo />
        <ActivityIndicator color="#00CEC8" />
        <Text color="#FFFFFF" opacity={0.65} fontSize={isSmallScreen ? 14 : 16} textAlign="center">
          {translate("registerScreen:subtitle")}
        </Text>
      </YStack>
    </YStack>
  )
}
