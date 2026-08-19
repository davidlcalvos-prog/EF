import { useMemo, useState } from "react"
import { ActivityIndicator, Keyboard, Modal, Pressable, ScrollView, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { addDays } from "date-fns/addDays"
import { nextSaturday } from "date-fns/nextSaturday"
import { setHours } from "date-fns/setHours"
import { setMinutes } from "date-fns/setMinutes"
import { startOfDay } from "date-fns/startOfDay"
import { Text, XStack, YStack } from "tamagui"

import { TextField } from "@/components/TextField"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { GroupSummaryApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export interface CreateMatchModalProps {
  visible: boolean
  onClose: () => void
  groups: GroupSummaryApiDto[]
  initialGroupId?: string
  onCreate: (payload: {
    originGroupId: string
    format: string
    maxPlayers: number
    scheduledAt?: string
  }) => Promise<boolean>
}

const FORMAT_CHIPS = ["5v5", "6v6", "7v7", "8v8", "9v9", "11v11"]
const FORMAT_REGEX = /^\d{1,2}v\d{1,2}$/

type DateOption = "none" | "today" | "tomorrow" | "saturday"

function suggestedMaxPlayers(format: string): number | null {
  const match = FORMAT_REGEX.exec(format.trim())
  if (!match) return null
  const [a, b] = format.trim().split("v").map(Number)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  const total = a + b
  return total >= 2 && total <= 30 ? total : null
}

function getBaseDate(option: DateOption): Date {
  const now = new Date()
  if (option === "tomorrow") return startOfDay(addDays(now, 1))
  if (option === "saturday") return startOfDay(nextSaturday(now))
  return startOfDay(now)
}

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

export function CreateMatchModal({
  visible,
  onClose,
  groups,
  initialGroupId,
  onCreate,
}: CreateMatchModalProps) {
  const { insets } = useResponsiveLayout()
  const [originGroupId, setOriginGroupId] = useState(initialGroupId ?? groups[0]?.id ?? "")
  const [format, setFormat] = useState("")
  const [maxPlayers, setMaxPlayers] = useState("")
  const [dateOption, setDateOption] = useState<DateOption>("none")
  const [hour, setHour] = useState("19")
  const [minute, setMinute] = useState("00")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(false)

  const showGroupSelector = !initialGroupId

  const isFormatValid = FORMAT_REGEX.test(format.trim())
  const maxPlayersNum = Number(maxPlayers)
  const isMaxPlayersValid =
    maxPlayers.trim().length > 0 &&
    Number.isInteger(maxPlayersNum) &&
    maxPlayersNum >= 2 &&
    maxPlayersNum <= 30
  const isValid = !!originGroupId && isFormatValid && isMaxPlayersValid

  const scheduledAtIso = useMemo(() => {
    if (dateOption === "none") return undefined
    const hourNum = Number(hour)
    const minuteNum = Number(minute)
    if (!Number.isInteger(hourNum) || hourNum < 0 || hourNum > 23) return undefined
    if (!Number.isInteger(minuteNum) || minuteNum < 0 || minuteNum > 59) return undefined
    const base = getBaseDate(dateOption)
    return setMinutes(setHours(base, hourNum), minuteNum).toISOString()
  }, [dateOption, hour, minute])

  const handleFormatChip = (chip: string) => {
    setFormat(chip)
    const suggested = suggestedMaxPlayers(chip)
    if (suggested) setMaxPlayers(String(suggested))
  }

  const reset = () => {
    setOriginGroupId(initialGroupId ?? groups[0]?.id ?? "")
    setFormat("")
    setMaxPlayers("")
    setDateOption("none")
    setHour("19")
    setMinute("00")
    setError(false)
  }

  const handleClose = () => {
    if (creating) return
    reset()
    Keyboard.dismiss()
    onClose()
  }

  const handleCreate = async () => {
    if (!isValid || creating) return
    setError(false)
    setCreating(true)
    const success = await onCreate({
      originGroupId,
      format: format.trim(),
      maxPlayers: maxPlayersNum,
      scheduledAt: scheduledAtIso,
    })
    setCreating(false)

    if (!success) {
      setError(true)
      return
    }
    reset()
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
              {translate("matchesScreen:createTitle")}
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
                    ? translate("matchesScreen:creating")
                    : translate("matchesScreen:createSubmit")}
                </Text>
              </XStack>
            </Pressable>
          </XStack>

          <ScrollView
            style={{ paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingTop: 14, paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {showGroupSelector ? (
              <YStack gap={8} marginBottom={16}>
                <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                  {translate("matchesScreen:selectGroup")}
                </Text>
                <XStack flexWrap="wrap" gap={8}>
                  {groups.map((group) => (
                    <Chip
                      key={group.id}
                      label={group.name}
                      selected={group.id === originGroupId}
                      onPress={() => setOriginGroupId(group.id)}
                    />
                  ))}
                </XStack>
              </YStack>
            ) : null}

            <YStack gap={8} marginBottom={16}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("matchesScreen:formatLabel")}
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                {FORMAT_CHIPS.map((chip) => (
                  <Chip
                    key={chip}
                    label={chip}
                    selected={format === chip}
                    onPress={() => handleFormatChip(chip)}
                  />
                ))}
              </XStack>
              <TextField
                value={format}
                onChangeText={setFormat}
                placeholder={translate("matchesScreen:formatPlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.35)"
                autoCapitalize="none"
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
              {format.trim().length > 0 && !isFormatValid ? (
                <Text color="#E74C3C" fontSize={12}>
                  {translate("matchesScreen:formatError")}
                </Text>
              ) : null}
            </YStack>

            <YStack gap={8} marginBottom={16}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("matchesScreen:maxPlayersLabel")}
              </Text>
              <TextField
                value={maxPlayers}
                onChangeText={setMaxPlayers}
                placeholder={translate("matchesScreen:maxPlayersPlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="number-pad"
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
              {maxPlayers.trim().length > 0 && !isMaxPlayersValid ? (
                <Text color="#E74C3C" fontSize={12}>
                  {translate("matchesScreen:maxPlayersError")}
                </Text>
              ) : null}
            </YStack>

            <YStack gap={8} marginBottom={8}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("matchesScreen:dateLabel")}
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                <Chip
                  label={translate("matchesScreen:dateToday")}
                  selected={dateOption === "today"}
                  onPress={() => setDateOption("today")}
                />
                <Chip
                  label={translate("matchesScreen:dateTomorrow")}
                  selected={dateOption === "tomorrow"}
                  onPress={() => setDateOption("tomorrow")}
                />
                <Chip
                  label={translate("matchesScreen:dateSaturday")}
                  selected={dateOption === "saturday"}
                  onPress={() => setDateOption("saturday")}
                />
                <Chip
                  label={translate("matchesScreen:dateNone")}
                  selected={dateOption === "none"}
                  onPress={() => setDateOption("none")}
                />
              </XStack>

              {dateOption !== "none" ? (
                <XStack alignItems="center" gap={8} marginTop={4}>
                  <TextField
                    value={hour}
                    onChangeText={setHour}
                    placeholder="HH"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    keyboardType="number-pad"
                    maxLength={2}
                    containerStyle={{ width: 64 }}
                    inputWrapperStyle={{
                      borderWidth: 1,
                      borderColor: eliteForgeColors.carbonBorder,
                      borderRadius: 12,
                      backgroundColor: eliteForgeColors.carbonInput,
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                    }}
                    style={{ color: "#FFFFFF", fontSize: 15, textAlign: "center" }}
                  />
                  <Text color="#FFFFFF" fontSize={18} fontWeight="700">
                    :
                  </Text>
                  <TextField
                    value={minute}
                    onChangeText={setMinute}
                    placeholder="MM"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    keyboardType="number-pad"
                    maxLength={2}
                    containerStyle={{ width: 64 }}
                    inputWrapperStyle={{
                      borderWidth: 1,
                      borderColor: eliteForgeColors.carbonBorder,
                      borderRadius: 12,
                      backgroundColor: eliteForgeColors.carbonInput,
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                    }}
                    style={{ color: "#FFFFFF", fontSize: 15, textAlign: "center" }}
                  />
                </XStack>
              ) : null}
            </YStack>

            {error ? (
              <Text color="#E74C3C" fontSize={12} marginTop={4}>
                {translate("matchesScreen:createError")}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
