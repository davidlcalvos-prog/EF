import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import {
  buildDateOptions,
  combineDateTime,
  DateTimeRangePicker,
} from "@/components/DateTimeRangePicker"
import { TextField } from "@/components/TextField"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import {
  api,
  type CourtSizeApi,
  type MyReservationApiDto,
  type PublicVenueApiDto,
} from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { courtSizeLabel } from "@/utils/courtSize"

export interface CreateReservationModalProps {
  visible: boolean
  onClose: () => void
  venues: PublicVenueApiDto[]
  matchId?: string
  onCreate: (payload: {
    venueId: string
    size: CourtSizeApi
    startsAt: string
    endsAt: string
    notes?: string
    matchId?: string
  }) => Promise<{ kind: "ok"; reservation: MyReservationApiDto } | GeneralApiProblem>
}

const AVAILABILITY_DEBOUNCE_MS = 350

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

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function amenityLabel(amenity: string): string {
  return translate(`reservationsScreen:amenity_${amenity}` as never)
}

export function CreateReservationModal({
  visible,
  onClose,
  venues,
  matchId,
  onCreate,
}: CreateReservationModalProps) {
  const { insets } = useResponsiveLayout()
  const dateOptions = useMemo(() => buildDateOptions(), [])
  const [venueId, setVenueId] = useState("")
  const [size, setSize] = useState<CourtSizeApi | "">("")
  const [selectedDate, setSelectedDate] = useState<Date>(dateOptions[0])
  const [startHour, setStartHour] = useState("19")
  const [startMinute, setStartMinute] = useState("00")
  const [endHour, setEndHour] = useState("20")
  const [endMinute, setEndMinute] = useState("00")
  const [notes, setNotes] = useState("")
  const [creating, setCreating] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const [availableCourts, setAvailableCourts] = useState<number | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(false)
  const availabilitySeqRef = useRef(0)

  const { startsAtIso, endsAtIso } = useMemo(() => {
    return {
      startsAtIso: combineDateTime(selectedDate, startHour, startMinute),
      endsAtIso: combineDateTime(selectedDate, endHour, endMinute),
    }
  }, [selectedDate, startHour, startMinute, endHour, endMinute])

  const selectedVenue = venues.find((v) => v.id === venueId)
  const venueSizes = selectedVenue?.courtSizes ?? []
  const isRangeValid = !!startsAtIso && !!endsAtIso && endsAtIso > startsAtIso

  // Cambiar de complejo o tamaño invalida la disponibilidad ya consultada.
  useEffect(() => {
    setSize("")
    setAvailableCourts(null)
  }, [venueId])

  // Fase W.1.1: se consulta disponibilidad ANTES de dejar confirmar — nunca
  // se llega al final para chocar con un error de solape.
  useEffect(() => {
    if (!venueId || !size || !isRangeValid || !startsAtIso || !endsAtIso) {
      setAvailableCourts(null)
      setAvailabilityLoading(false)
      setAvailabilityError(false)
      return
    }
    setAvailabilityLoading(true)
    setAvailabilityError(false)
    const seq = ++availabilitySeqRef.current
    const timer = setTimeout(() => {
      api.getAvailability(venueId, size, startsAtIso, endsAtIso).then((result) => {
        if (availabilitySeqRef.current !== seq) return
        setAvailabilityLoading(false)
        if (result.kind === "ok") {
          setAvailableCourts(result.availability.availableCourts)
        } else {
          setAvailabilityError(true)
        }
      })
    }, AVAILABILITY_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [venueId, size, isRangeValid, startsAtIso, endsAtIso])

  const isValid = !!venueId && !!size && isRangeValid && !!availableCourts

  const reset = () => {
    setVenueId("")
    setSize("")
    setSelectedDate(dateOptions[0])
    setStartHour("19")
    setStartMinute("00")
    setEndHour("20")
    setEndMinute("00")
    setNotes("")
    setErrorText(null)
    setAvailableCourts(null)
  }

  const handleClose = () => {
    if (creating) return
    reset()
    Keyboard.dismiss()
    onClose()
  }

  const handleCreate = async () => {
    if (!isValid || creating || !startsAtIso || !endsAtIso || !size) return
    setErrorText(null)
    setCreating(true)
    const result = await onCreate({
      venueId,
      size,
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
                            {venue.amenities.length > 0 ? (
                              <XStack gap={6} flexWrap="wrap" marginTop={2}>
                                {venue.amenities.map((amenity) => (
                                  <XStack
                                    key={amenity}
                                    paddingHorizontal={8}
                                    paddingVertical={2}
                                    borderRadius={999}
                                    backgroundColor="rgba(0,206,200,0.1)"
                                    borderWidth={1}
                                    borderColor="rgba(0,206,200,0.35)"
                                  >
                                    <Text
                                      color={eliteForgeColors.emerald}
                                      fontSize={10}
                                      fontWeight="700"
                                    >
                                      {amenityLabel(amenity)}
                                    </Text>
                                  </XStack>
                                ))}
                              </XStack>
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

            {selectedVenue && venueSizes.length > 0 ? (
              <YStack gap={8} marginBottom={16}>
                <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                  {translate("reservationsScreen:courtLabel")}
                </Text>
                <YStack gap={8}>
                  {venueSizes.map((entry) => {
                    const selected = entry.size === size
                    return (
                      <Pressable
                        key={entry.size}
                        onPress={() => setSize(entry.size)}
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
                              {courtSizeLabel(entry.size)}
                            </Text>
                            <Text color="rgba(255,255,255,0.5)" fontSize={12}>
                              {translate("reservationsScreen:courtCount", { count: entry.count })}
                            </Text>
                          </YStack>
                          <Text color={eliteForgeColors.emerald} fontWeight="700" fontSize={13}>
                            {translate("reservationsScreen:pricePerHour", {
                              price: formatPrice(entry.pricePerHourCents),
                            })}
                          </Text>
                        </XStack>
                      </Pressable>
                    )
                  })}
                </YStack>
              </YStack>
            ) : null}

            {selectedVenue && venueSizes.length === 0 ? (
              <YStack gap={8} marginBottom={16}>
                <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                  {translate("reservationsScreen:courtLabel")}
                </Text>
                <Text color="rgba(255,255,255,0.45)" fontSize={13}>
                  {translate("reservationsScreen:noCourts")}
                </Text>
              </YStack>
            ) : null}

            <DateTimeRangePicker
              mode="range"
              dateOptions={dateOptions}
              selectedDate={selectedDate}
              onSelectDate={(date) => date && setSelectedDate(date)}
              dateLabel={translate("reservationsScreen:dateLabel")}
              startTimeLabel={translate("reservationsScreen:startTimeLabel")}
              startHour={startHour}
              startMinute={startMinute}
              onStartHourChange={setStartHour}
              onStartMinuteChange={setStartMinute}
              endTimeLabel={translate("reservationsScreen:endTimeLabel")}
              endHour={endHour}
              endMinute={endMinute}
              onEndHourChange={setEndHour}
              onEndMinuteChange={setEndMinute}
              invalidRangeError={translate("reservationsScreen:createInvalidRange")}
              isRangeValid={isRangeValid}
            />

            {venueId && size && isRangeValid ? (
              <YStack gap={8} marginBottom={16}>
                {availabilityLoading ? (
                  <XStack alignItems="center" gap={8}>
                    <ActivityIndicator size="small" color={eliteForgeColors.emerald} />
                    <Text color="rgba(255,255,255,0.5)" fontSize={13}>
                      {translate("reservationsScreen:checkingAvailability")}
                    </Text>
                  </XStack>
                ) : availabilityError ? (
                  <Text color="#E74C3C" fontSize={13}>
                    {translate("reservationsScreen:availabilityError")}
                  </Text>
                ) : availableCourts !== null && availableCourts > 0 ? (
                  <XStack alignItems="center" gap={8}>
                    <Ionicons name="checkmark-circle" size={16} color={eliteForgeColors.emerald} />
                    <Text color={eliteForgeColors.emerald} fontSize={13} fontWeight="700">
                      {translate("reservationsScreen:availabilityCount", {
                        count: availableCourts,
                      })}
                    </Text>
                  </XStack>
                ) : availableCourts === 0 ? (
                  <XStack alignItems="center" gap={8}>
                    <Ionicons name="close-circle" size={16} color="#E74C3C" />
                    <Text color="#E74C3C" fontSize={13} fontWeight="700">
                      {translate("reservationsScreen:noAvailability")}
                    </Text>
                  </XStack>
                ) : null}
              </YStack>
            ) : null}

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
      </KeyboardAvoidingView>
    </Modal>
  )
}
