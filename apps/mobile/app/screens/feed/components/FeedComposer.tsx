import { Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAuth } from "@/context/AuthContext"
import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { getUserColor } from "@/utils/avatarColor"

import { FeedAvatar } from "./FeedAvatar"

export interface FeedComposerProps {
  onPress?: () => void
}

function getUserInitial(email?: string) {
  if (!email) return "?"
  return email.trim().charAt(0).toUpperCase()
}

function ComposerAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress?: () => void
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }} accessibilityRole="button">
      <XStack flex={1} alignItems="center" justifyContent="center" gap={6} paddingVertical={4}>
        <Ionicons name={icon} size={18} color={eliteForgeColors.emerald} />
        <Text color="#00CEC8" fontSize={13} fontWeight="600">
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}

export function FeedComposer({ onPress }: FeedComposerProps) {
  const { authEmail, authAvatarBase64 } = useAuth()
  const motion = useInteractiveMotion("card")

  return (
    <Pressable
      onPress={onPress}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      onHoverIn={motion.onHoverIn}
      onHoverOut={motion.onHoverOut}
      accessibilityRole="button"
    >
      <YStack
        backgroundColor="#363636"
        borderRadius={14}
        borderWidth={1}
        borderColor="#555555"
        padding={14}
        gap={12}
        marginBottom={18}
      >
        <XStack alignItems="center" gap={12}>
          <FeedAvatar
            label={getUserInitial(authEmail)}
            color={getUserColor(authEmail)}
            photoBase64={authAvatarBase64}
            size={44}
          />
          <YStack
            flex={1}
            backgroundColor="#2e2e2e"
            borderRadius={24}
            paddingHorizontal={16}
            paddingVertical={12}
            borderWidth={1}
            borderColor="#555555"
          >
            <Text color="rgba(255,255,255,0.45)" fontSize={15}>
              {translate("feedScreen:composerPlaceholder")}
            </Text>
          </YStack>
        </XStack>

        {/*
         * Foto y Video se quitaron a propósito (testers build 3: "publicar
         * imágenes y videos no funciona"): no existe subida de media — ni
         * picker en el feed, ni endpoint, ni almacenamiento; el backend solo
         * acepta `mediaUrl` como URL y el gateway limita el JSON a 1 MB.
         * Volver a mostrarlos SOLO cuando exista la fase de media real.
         * Las claves i18n `composerPhoto`/`composerVideo` se conservan para
         * ese momento.
         */}
        <XStack gap={4} justifyContent="space-around">
          <ComposerAction
            icon="football-outline"
            label={translate("feedScreen:composerMatch")}
            onPress={onPress}
          />
        </XStack>
      </YStack>
    </Pressable>
  )
}
