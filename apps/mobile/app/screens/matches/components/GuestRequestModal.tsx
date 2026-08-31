import { useState } from "react"
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { ALL_PLAYER_POSITIONS, type PlayerPositionId } from "@/data/suggestPlayerPosition"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { DEFAULT_GUEST_REQUEST_RADIUS_KM, MAX_GUEST_REQUEST_SLOTS } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

const RADIUS_OPTIONS = [5, 10, 15, 20, 25]

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <XStack
        paddingHorizontal={12}
        paddingVertical={8}
        borderRadius={10}
        backgroundColor={selected ? "rgba(0,206,200,0.15)" : eliteForgeColors.carbonInput}
        borderWidth={1}
        borderColor={selected ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder}
      >
        <Text
          color={selected ? eliteForgeColors.emerald : "#FFFFFF"}
          fontSize={13}
          fontWeight="700"
        >
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}

export interface GuestRequestModalProps {
  visible: boolean
  onClose: () => void
  /** Cupos realmente libres del partido — acota el selector (tope duro 5, Fase 11.1). */
  freeSpots: number
  onSubmit: (payload: {
    requestedPositions?: PlayerPositionId[]
    slotsTotal?: number
    radiusKm?: number
  }) => Promise<boolean>
}

/** Formulario para abrir la búsqueda de comodín (Fase 11 / 11.1) — posiciones multi, cupos y radio. */
export function GuestRequestModal({
  visible,
  onClose,
  freeSpots,
  onSubmit,
}: GuestRequestModalProps) {
  const { insets } = useResponsiveLayout()
  const [positions, setPositions] = useState<PlayerPositionId[]>([])
  const [slots, setSlots] = useState(1)
  const [radiusKm, setRadiusKm] = useState(DEFAULT_GUEST_REQUEST_RADIUS_KM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  const maxSlots = Math.max(1, Math.min(MAX_GUEST_REQUEST_SLOTS, freeSpots))
  const slotOptions = Array.from({ length: maxSlots }, (_, i) => i + 1)

  const togglePosition = (id: PlayerPositionId) => {
    setPositions((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const reset = () => {
    setPositions([])
    setSlots(1)
    setRadiusKm(DEFAULT_GUEST_REQUEST_RADIUS_KM)
    setError(false)
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(false)
    const success = await onSubmit({
      requestedPositions: positions,
      slotsTotal: Math.min(slots, maxSlots),
      radiusKm,
    })
    setSubmitting(false)
    if (!success) {
      setError(true)
      return
    }
    reset()
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
            maxHeight: "85%",
            backgroundColor: eliteForgeColors.carbonElevated,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderWidth: 1,
            borderColor: eliteForgeColors.carbonBorder,
            overflow: "hidden",
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
              {translate("matchesScreen:guestOpenTitle")}
            </Text>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
              style={{ opacity: submitting ? 0.4 : 1 }}
            >
              <XStack
                backgroundColor={eliteForgeColors.emerald}
                borderRadius={14}
                paddingHorizontal={11}
                paddingVertical={6}
                alignItems="center"
                gap={5}
              >
                {submitting ? <ActivityIndicator size="small" color="#1a1a1a" /> : null}
                <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                  {submitting
                    ? translate("matchesScreen:guestOpening")
                    : translate("matchesScreen:guestOpenSubmit")}
                </Text>
              </XStack>
            </Pressable>
          </XStack>

          <ScrollView
            style={{ paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingTop: 14, paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <YStack gap={8} marginBottom={16}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("matchesScreen:guestPositionLabel")}
              </Text>
              <Text color="rgba(255,255,255,0.4)" fontSize={11} lineHeight={16}>
                {translate("matchesScreen:guestPositionHint")}
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                {ALL_PLAYER_POSITIONS.map((id) => {
                  const isSelected = positions.includes(id)
                  return (
                    <Pressable
                      key={id}
                      onPress={() => togglePosition(id)}
                      accessibilityRole="button"
                    >
                      <XStack
                        paddingHorizontal={12}
                        paddingVertical={8}
                        borderRadius={999}
                        backgroundColor={
                          isSelected ? "rgba(0,206,200,0.18)" : "rgba(255,255,255,0.06)"
                        }
                        borderWidth={1}
                        borderColor={
                          isSelected ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder
                        }
                      >
                        <Text
                          color={isSelected ? eliteForgeColors.emerald : "rgba(255,255,255,0.75)"}
                          fontSize={12}
                          fontWeight="700"
                        >
                          {translate(`profileScreen:position_${id}` as never)}
                        </Text>
                      </XStack>
                    </Pressable>
                  )
                })}
              </XStack>
            </YStack>

            <YStack gap={8} marginBottom={16}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("matchesScreen:guestSlotsLabel")}
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                {slotOptions.map((option) => (
                  <Chip
                    key={option}
                    label={String(option)}
                    selected={slots === option}
                    onPress={() => setSlots(option)}
                  />
                ))}
              </XStack>
            </YStack>

            <YStack gap={8} marginBottom={16}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("matchesScreen:guestRadiusLabel")}
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                {RADIUS_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    label={translate("matchesScreen:guestRadiusChip", { km: option })}
                    selected={radiusKm === option}
                    onPress={() => setRadiusKm(option)}
                  />
                ))}
              </XStack>
            </YStack>

            {error ? (
              <Text color="#E74C3C" fontSize={12} marginBottom={8}>
                {translate("matchesScreen:guestOpenError")}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
