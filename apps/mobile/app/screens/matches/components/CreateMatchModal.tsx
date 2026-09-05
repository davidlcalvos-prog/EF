import { useEffect, useMemo, useState } from "react"
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
import { getOtherGroup } from "@/screens/groups/useGroupFriendships"
import {
  api,
  type GroupSummaryApiDto,
  type MatchTypeApi,
  type PublicVenueApiDto,
} from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { courtSizeLabel, courtSizeToFormat, mostCommonCourtSize } from "@/utils/courtSize"

export interface CreateMatchModalProps {
  visible: boolean
  onClose: () => void
  groups: GroupSummaryApiDto[]
  initialGroupId?: string
  onCreate: (payload: {
    originGroupId: string
    type: MatchTypeApi
    opponentGroupId?: string
    format: string
    maxPlayers: number
    scheduledAt?: string
    venueId?: string
    venueText?: string
  }) => Promise<boolean>
}

type VenueOption = "none" | "app" | "text"

const FORMAT_CHIPS = ["5v5", "6v6", "7v7", "8v8", "9v9", "11v11"]
const FORMAT_REGEX = /^\d{1,2}v\d{1,2}$/

function suggestedMaxPlayers(format: string): number | null {
  const match = FORMAT_REGEX.exec(format.trim())
  if (!match) return null
  const [a, b] = format.trim().split("v").map(Number)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  const total = a + b
  return total >= 2 && total <= 30 ? total : null
}

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} accessibilityRole="button">
      <XStack
        paddingHorizontal={12}
        paddingVertical={8}
        borderRadius={10}
        backgroundColor={selected ? "rgba(0,206,200,0.15)" : eliteForgeColors.carbonInput}
        borderWidth={1}
        borderColor={selected ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder}
        opacity={disabled ? 0.4 : 1}
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
  const [type, setType] = useState<MatchTypeApi>("internal")
  const [opponentGroupId, setOpponentGroupId] = useState("")
  const [format, setFormat] = useState("")
  const [formatAutoFilled, setFormatAutoFilled] = useState(false)
  const [maxPlayers, setMaxPlayers] = useState("")
  const dateOptions = useMemo(() => buildDateOptions(), [])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [hour, setHour] = useState("19")
  const [minute, setMinute] = useState("00")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(false)

  // Sede (Fase L.0): cancha de la app o texto libre.
  const [venueOption, setVenueOption] = useState<VenueOption>("none")
  const [venueId, setVenueId] = useState("")
  const [venueText, setVenueText] = useState("")
  const [venues, setVenues] = useState<PublicVenueApiDto[]>([])
  const [loadingVenues, setLoadingVenues] = useState(false)
  useEffect(() => {
    if (venueOption !== "app" || venues.length > 0) return
    let cancelled = false
    setLoadingVenues(true)
    api.listVenues().then((result) => {
      if (cancelled) return
      setLoadingVenues(false)
      if (result.kind === "ok") setVenues(result.venues)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueOption])
  const [opponentOptions, setOpponentOptions] = useState<
    { id: string; name: string; photoBase64: string | null }[]
  >([])
  const [loadingOpponents, setLoadingOpponents] = useState(false)

  const showGroupSelector = !initialGroupId

  const originGroup = groups.find((g) => g.id === originGroupId)
  const canCreateVs = originGroup?.role === "creator" || originGroup?.role === "admin"
  const hasOpponentOptions = opponentOptions.length > 0
  const vsDisabled = !canCreateVs || (!loadingOpponents && !hasOpponentOptions)

  // El rival de un VS solo puede ser un grupo amigo del origen (Fase 6.5.3) —
  // ya no se usa la lista de "mis grupos" como en la 6.3.1.
  useEffect(() => {
    if (!originGroupId) {
      setOpponentOptions([])
      return
    }
    let cancelled = false
    setLoadingOpponents(true)
    api.listGroupFriendships(originGroupId).then((result) => {
      if (cancelled) return
      setLoadingOpponents(false)
      if (result.kind !== "ok") {
        setOpponentOptions([])
        return
      }
      setOpponentOptions(
        result.friendships
          .filter((f) => f.status === "accepted")
          .map((f) => getOtherGroup(f, originGroupId)),
      )
    })
    return () => {
      cancelled = true
    }
  }, [originGroupId])

  // Si el origen deja de calificar para VS (cambia de grupo, o ya no hay rivales), vuelve a interno.
  useEffect(() => {
    if (vsDisabled && type === "vs") {
      setType("internal")
      setOpponentGroupId("")
    }
  }, [vsDisabled, type])

  // Si el rival elegido deja de estar disponible (ej. cambiaste el origen), lo limpia.
  useEffect(() => {
    if (opponentGroupId && !opponentOptions.some((g) => g.id === opponentGroupId)) {
      setOpponentGroupId("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originGroupId])

  const selectedVenue = venues.find((v) => v.id === venueId)
  const venueSizes = selectedVenue?.courtSizes ?? []
  const suggestedSize = venueOption === "app" ? mostCommonCourtSize(venueSizes) : null

  // Al elegir una cancha de la app, sugiere el formato más común de ese
  // complejo (editable) — no se sugiere nada si no se eligió cancha de la app.
  useEffect(() => {
    if (!suggestedSize) return
    const suggested = courtSizeToFormat(suggestedSize)
    if (format === "" || formatAutoFilled) {
      setFormat(suggested)
      setFormatAutoFilled(true)
      const suggestedPlayers = suggestedMaxPlayers(suggested)
      if (suggestedPlayers) setMaxPlayers(String(suggestedPlayers))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedSize])

  const isFormatValid = FORMAT_REGEX.test(format.trim())
  const maxPlayersNum = Number(maxPlayers)
  const isMaxPlayersValid =
    maxPlayers.trim().length > 0 &&
    Number.isInteger(maxPlayersNum) &&
    maxPlayersNum >= 2 &&
    maxPlayersNum <= 30
  // En vs la capacidad se reparte en dos lados iguales (maxPlayers/2) — un
  // impar dejaría un lado con medio cupo, el backend lo rechaza igual.
  const isMaxPlayersEvenForVs = type !== "vs" || maxPlayersNum % 2 === 0
  const isVsSelectionValid = type === "internal" || (type === "vs" && !!opponentGroupId)
  const isValid =
    !!originGroupId &&
    isFormatValid &&
    isMaxPlayersValid &&
    isMaxPlayersEvenForVs &&
    isVsSelectionValid

  const scheduledAtIso = useMemo(() => {
    if (!selectedDate) return undefined
    return combineDateTime(selectedDate, hour, minute) ?? undefined
  }, [selectedDate, hour, minute])

  const handleFormatChip = (chip: string) => {
    setFormat(chip)
    setFormatAutoFilled(false)
    const suggested = suggestedMaxPlayers(chip)
    if (suggested) setMaxPlayers(String(suggested))
  }

  const handleFormatChange = (text: string) => {
    setFormat(text)
    setFormatAutoFilled(false)
  }

  const reset = () => {
    setOriginGroupId(initialGroupId ?? groups[0]?.id ?? "")
    setType("internal")
    setOpponentGroupId("")
    setFormat("")
    setFormatAutoFilled(false)
    setMaxPlayers("")
    setSelectedDate(null)
    setHour("19")
    setMinute("00")
    setVenueOption("none")
    setVenueId("")
    setVenueText("")
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
      type,
      opponentGroupId: type === "vs" ? opponentGroupId : undefined,
      format: format.trim(),
      maxPlayers: maxPlayersNum,
      scheduledAt: scheduledAtIso,
      venueId: venueOption === "app" && venueId ? venueId : undefined,
      venueText: venueOption === "text" && venueText.trim() ? venueText.trim() : undefined,
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
                {translate("matchesScreen:typeLabel")}
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                <Chip
                  label={translate("matchesScreen:type_internal")}
                  selected={type === "internal"}
                  onPress={() => setType("internal")}
                />
                <Chip
                  label={translate("matchesScreen:type_vs")}
                  selected={type === "vs"}
                  disabled={vsDisabled}
                  onPress={() => setType("vs")}
                />
              </XStack>
              {vsDisabled ? (
                <Text color="rgba(255,255,255,0.45)" fontSize={12}>
                  {!canCreateVs
                    ? translate("matchesScreen:vsNeedsLeaderRole")
                    : translate("matchesScreen:vsNeedsMoreGroups")}
                </Text>
              ) : null}
            </YStack>

            {type === "vs" ? (
              <YStack gap={8} marginBottom={16}>
                <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                  {translate("matchesScreen:selectOpponent")}
                </Text>
                <XStack flexWrap="wrap" gap={8}>
                  {opponentOptions.map((group) => (
                    <Chip
                      key={group.id}
                      label={group.name}
                      selected={group.id === opponentGroupId}
                      onPress={() => setOpponentGroupId(group.id)}
                    />
                  ))}
                </XStack>
              </YStack>
            ) : null}

            <YStack gap={8} marginBottom={16}>
              <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
                {translate("matchesScreen:venueLabel")}
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                <Chip
                  label={translate("matchesScreen:venueNone")}
                  selected={venueOption === "none"}
                  onPress={() => setVenueOption("none")}
                />
                <Chip
                  label={translate("matchesScreen:venueFromApp")}
                  selected={venueOption === "app"}
                  onPress={() => setVenueOption("app")}
                />
                <Chip
                  label={translate("matchesScreen:venueFreeText")}
                  selected={venueOption === "text"}
                  onPress={() => setVenueOption("text")}
                />
              </XStack>

              {venueOption === "app" ? (
                loadingVenues ? (
                  <XStack paddingVertical={10} justifyContent="center">
                    <ActivityIndicator color={eliteForgeColors.emerald} />
                  </XStack>
                ) : venues.length === 0 ? (
                  <Text color="rgba(255,255,255,0.45)" fontSize={12}>
                    {translate("matchesScreen:venueEmpty")}
                  </Text>
                ) : (
                  <XStack flexWrap="wrap" gap={8} marginTop={4}>
                    {venues.map((venue) => (
                      <Chip
                        key={venue.id}
                        label={venue.city ? `${venue.name} · ${venue.city}` : venue.name}
                        selected={venueId === venue.id}
                        onPress={() => setVenueId(venue.id)}
                      />
                    ))}
                  </XStack>
                )
              ) : null}

              {venueOption === "app" && selectedVenue ? (
                <YStack
                  gap={6}
                  marginTop={8}
                  padding={10}
                  borderRadius={10}
                  backgroundColor={eliteForgeColors.carbonInput}
                  borderWidth={1}
                  borderColor={eliteForgeColors.carbonBorder}
                >
                  <Text color="rgba(255,255,255,0.6)" fontSize={11} fontWeight="700">
                    {translate("matchesScreen:venueSizesTitle")}
                  </Text>
                  {venueSizes.length === 0 ? (
                    <Text color="rgba(255,255,255,0.45)" fontSize={12}>
                      {translate("matchesScreen:venueSizesEmpty")}
                    </Text>
                  ) : (
                    venueSizes.map((entry) => (
                      <XStack key={entry.size} justifyContent="space-between">
                        <Text color="#FFFFFF" fontSize={13}>
                          {courtSizeLabel(entry.size)}
                        </Text>
                        <Text color="rgba(255,255,255,0.6)" fontSize={13}>
                          {translate("matchesScreen:venueSizesCount", { count: entry.count })}
                        </Text>
                      </XStack>
                    ))
                  )}
                </YStack>
              ) : null}

              {venueOption === "text" ? (
                <TextField
                  value={venueText}
                  onChangeText={setVenueText}
                  placeholder={translate("matchesScreen:venueTextPlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  maxLength={120}
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
              ) : null}
            </YStack>

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
                onChangeText={handleFormatChange}
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
              ) : maxPlayers.trim().length > 0 && !isMaxPlayersEvenForVs ? (
                <Text color="#E74C3C" fontSize={12}>
                  {translate("matchesScreen:maxPlayersOddError")}
                </Text>
              ) : null}
            </YStack>

            <DateTimeRangePicker
              mode="single"
              allowUnset
              unsetLabel={translate("matchesScreen:dateNone")}
              dateOptions={dateOptions}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              dateLabel={translate("matchesScreen:dateLabel")}
              startTimeLabel={translate("matchesScreen:startTimeLabel")}
              startHour={hour}
              startMinute={minute}
              onStartHourChange={setHour}
              onStartMinuteChange={setMinute}
            />

            {error ? (
              <Text color="#E74C3C" fontSize={12} marginTop={4}>
                {translate("matchesScreen:createError")}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
