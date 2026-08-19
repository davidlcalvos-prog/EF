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
import type { MyReservationApiDto, PublicVenueApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export interface CreateReservationModalProps {
  visible: boolean
  onClose: () => void
  venues: PublicVenueApiDto[]
  matchId?: string
  onCreate: (payload: {
    venueId: string
    startsAt: string
    endsAt: string
    notes?: string
    matchId?: string
  }) => Promise<{ kind: "ok"; reservation: MyReservationApiDto } | GeneralApiProblem>
}

type DateOption = "today" | "tomorrow" | "saturday"

function describeProblem(problem: GeneralApiProblem): string {
  switch (problem.kind) {
    case "conflict":
      return translate("reservationsScreen:createConflict")
    case "forbidden":
      return translate("reservationsScreen:createForbidden")
    case "not-found":
      return translate("reservationsScreen:createNotFound")
    case "rejected":
      return translate("reservationsScreen:createInvalidRange")
    default:
      return translate("reservationsScreen:createError")
  }
}

function getBaseDate(option: DateOption): Date {
  const now = new Date()
  if (option === "tomorrow") return startOfDay(addDays(now, 1))
  if (option === "saturday") return startOfDay(nextSaturday(now))
  return startOfDay(now)
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function isValidTime(hour: string, minute: string): boolean {
  const hourNum = Number(hour)
  const minuteNum = Number(minute)
  return (
    Number.isInteger(hourNum) &&
    hourNum >= 0 &&
    hourNum <= 23 &&
    Number.isInteger(minuteNum) &&
    minuteNum >= 0 &&
    minuteNum <= 59
  )
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

function TimeField({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  return (
    <TextField
      value={value}
      onChangeText={onChange}
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
  )
}

export function CreateReservationModal({
  visible,
  onClose,
  venues,
  matchId,
  onCreate,
}: CreateReservationModalProps) {
  const { insets } = useResponsiveLayout()
  const [venueId, setVenueId] = useState("")
  const [dateOption, setDateOption] = useState<DateOption>("today")
  const [startHour, setStartHour] = useState("19")
  const [startMinute, setStartMinute] = useState("00")
  const [endHour, setEndHour] = useState("20")
  const [endMinute, setEndMinute] = useState("00")
  const [notes, setNotes] = useState("")
  const [creating, setCreating] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const startTimeValid = isValidTime(startHour, startMinute)
  const endTimeValid = isValidTime(endHour, endMinute)

  const { startsAtIso, endsAtIso } = useMemo(() => {
    if (!startTimeValid || !endTimeValid) return { startsAtIso: null, endsAtIso: null }
    const base = getBaseDate(dateOption)
    const starts = setMinutes(setHours(base, Number(startHour)), Number(startMinute))
    const ends = setMinutes(setHours(base, Number(endHour)), Number(endMinute))
    return { startsAtIso: starts.toISOString(), endsAtIso: ends.toISOString() }
  }, [dateOption, startHour, startMinute, endHour, endMinute, startTimeValid, endTimeValid])

  const isRangeValid = !!startsAtIso && !!endsAtIso && endsAtIso > startsAtIso
  const isValid = !!venueId && isRangeValid

  const reset = () => {
    setVenueId("")
    setDateOption("today")
    setStartHour("19")
    setStartMinute("00")
    setEndHour("20")
    setEndMinute("00")
    setNotes("")
    setErrorText(null)
  }

  const handleClose = () => {
    if (creating) return
    reset()
    Keyboard.dismiss()
    onClose()
  }

  const handleCreate = async () => {
    if (!isValid || creating || !startsAtIso || !endsAtIso) return
    setErrorText(null)
    setCreating(true)
    const result = await onCreate({
      venueId,
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      notes: notes.trim() || undefined,
      matchId,
    })
    setCreating(false)

    if (result.kind !== "ok") {
      setErrorText(describeProblem(result))
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
              {translate("reservationsScreen:createTitle")}
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
                    ? translate("reservationsScreen:creating")
                    : translate("reservationsScreen:createSubmit")}
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
                {translate("reservationsScreen:venueLabel")}
              </Text>
              {venues.length === 0 ? (
                <Text color="rgba(255,255,255,0.45)" fontSize={13}>
                  {translate("reservationsScreen:noVenues")}
                </Text>
              ) : (
                <YStack gap={8}>
                  {venues.map((venue) => {
                    const selected = venue.id === venueId
                    return (
                      <Pressable
                        key={venue.id}
                        onPress={() => setVenueId(venue.id)}
                        accessibilityRole="button"
                      >
                        <XStack
                          padding={12}
                          borderRadius={12}
                          backgroundColor={
                            selected ? "rgba(0,206,200,0.1)" : eliteForgeColors.carbonInput
                          }
                          borderWidth={1}
                          borderColor={
                            selected ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder
                          }
                          alignItems="center"
                          gap={10}
                        >
                          <YStack flex={1} gap={2}>
                            <Text color="#FFFFFF" fontWeight="700" fontSize={14}>
                              {venue.name}
                            </Text>
                            {venue.address ? (
                              <Text color="rgba(255,255,255,0.5)" fontSize={12} numberOfLines={1}>
                                {venue.address}
                              </Text>
                            ) : null}
                          </YStack>
                          <Text color={eliteForgeColors.emerald} fontWeight="700" fontSize={13}>
                            {translate("reservationsScreen:pricePerHour", {
                              price: formatPrice(venue.pricePerHourCents),
                            })}
                          </Text>
                        </XStack>
                      </Pressable>
                    )
                  })}
                </YStack>
              )}
            </YStack>

            <YStack gap={8} marginBottom={16}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("reservationsScreen:dateLabel")}
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
              </XStack>
            </YStack>

            <YStack gap={8} marginBottom={16}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("reservationsScreen:startTimeLabel")}
              </Text>
              <XStack alignItems="center" gap={8}>
                <TimeField value={startHour} onChange={setStartHour} />
                <Text color="#FFFFFF" fontSize={18} fontWeight="700">
                  :
                </Text>
                <TimeField value={startMinute} onChange={setStartMinute} />
              </XStack>
            </YStack>

            <YStack gap={8} marginBottom={16}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("reservationsScreen:endTimeLabel")}
              </Text>
              <XStack alignItems="center" gap={8}>
                <TimeField value={endHour} onChange={setEndHour} />
                <Text color="#FFFFFF" fontSize={18} fontWeight="700">
                  :
                </Text>
                <TimeField value={endMinute} onChange={setEndMinute} />
              </XStack>
              {startTimeValid && endTimeValid && !isRangeValid ? (
                <Text color="#E74C3C" fontSize={12}>
                  {translate("reservationsScreen:createInvalidRange")}
                </Text>
              ) : null}
            </YStack>

            <YStack gap={8} marginBottom={8}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("reservationsScreen:notesLabel")}
              </Text>
              <TextField
                value={notes}
                onChangeText={setNotes}
                placeholder={translate("reservationsScreen:notesPlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.35)"
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
            </YStack>

            {errorText ? (
              <Text color="#E74C3C" fontSize={12} marginTop={4}>
                {errorText}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
