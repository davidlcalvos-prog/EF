import { Pressable, ScrollView } from "react-native"
import { addDays } from "date-fns/addDays"
import { setHours } from "date-fns/setHours"
import { setMinutes } from "date-fns/setMinutes"
import { startOfDay } from "date-fns/startOfDay"
import { Text, XStack, YStack } from "tamagui"

import { TextField } from "@/components/TextField"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { formatDate } from "@/utils/formatDate"

const DAYS_AHEAD = 14

export function buildDateOptions(): Date[] {
  const today = startOfDay(new Date())
  return Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i))
}

export function isValidTime(hour: string, minute: string): boolean {
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

export function combineDateTime(date: Date, hour: string, minute: string): string | null {
  if (!isValidTime(hour, minute)) return null
  return setMinutes(setHours(date, Number(hour)), Number(minute)).toISOString()
}

function DayCard({
  date,
  selected,
  onPress,
}: {
  date: Date
  selected: boolean
  onPress: () => void
}) {
  const weekday = formatDate(date.toISOString(), "EEE")
  const dayNumber = formatDate(date.toISOString(), "d")
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <YStack
        width={52}
        paddingVertical={10}
        borderRadius={12}
        backgroundColor={selected ? "rgba(0,206,200,0.15)" : eliteForgeColors.carbonInput}
        borderWidth={1}
        borderColor={selected ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder}
        alignItems="center"
        gap={4}
      >
        <Text
          color={selected ? eliteForgeColors.emerald : "rgba(255,255,255,0.6)"}
          fontSize={11}
          fontWeight="700"
          textTransform="capitalize"
        >
          {weekday}
        </Text>
        <Text
          color={selected ? eliteForgeColors.emerald : "#FFFFFF"}
          fontSize={16}
          fontWeight="800"
        >
          {dayNumber}
        </Text>
      </YStack>
    </Pressable>
  )
}

function UnsetCard({
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
      <YStack
        minWidth={52}
        height={68}
        paddingHorizontal={10}
        borderRadius={12}
        backgroundColor={selected ? "rgba(0,206,200,0.15)" : eliteForgeColors.carbonInput}
        borderWidth={1}
        borderColor={selected ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder}
        alignItems="center"
        justifyContent="center"
      >
        <Text
          color={selected ? eliteForgeColors.emerald : "#FFFFFF"}
          fontSize={11}
          fontWeight="700"
          textAlign="center"
        >
          {label}
        </Text>
      </YStack>
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

export interface DateTimeRangePickerProps {
  mode: "range" | "single"
  dateOptions: Date[]
  selectedDate: Date | null
  onSelectDate: (date: Date | null) => void
  dateLabel: string
  allowUnset?: boolean
  unsetLabel?: string
  startTimeLabel: string
  startHour: string
  startMinute: string
  onStartHourChange: (value: string) => void
  onStartMinuteChange: (value: string) => void
  endTimeLabel?: string
  endHour?: string
  endMinute?: string
  onEndHourChange?: (value: string) => void
  onEndMinuteChange?: (value: string) => void
  invalidRangeError?: string
  isRangeValid?: boolean
}

export function DateTimeRangePicker({
  mode,
  dateOptions,
  selectedDate,
  onSelectDate,
  dateLabel,
  allowUnset,
  unsetLabel,
  startTimeLabel,
  startHour,
  startMinute,
  onStartHourChange,
  onStartMinuteChange,
  endTimeLabel,
  endHour,
  endMinute,
  onEndHourChange,
  onEndMinuteChange,
  invalidRangeError,
  isRangeValid,
}: DateTimeRangePickerProps) {
  const showTimeFields = mode === "range" || !allowUnset || selectedDate !== null
  const startTimeValid = isValidTime(startHour, startMinute)
  const endTimeValid = mode === "range" ? isValidTime(endHour ?? "", endMinute ?? "") : true

  return (
    <>
      <YStack gap={8} marginBottom={16}>
        <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
          {dateLabel}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {allowUnset ? (
            <UnsetCard
              label={unsetLabel ?? ""}
              selected={selectedDate === null}
              onPress={() => onSelectDate(null)}
            />
          ) : null}
          {dateOptions.map((date) => (
            <DayCard
              key={date.toISOString()}
              date={date}
              selected={!!selectedDate && date.getTime() === selectedDate.getTime()}
              onPress={() => onSelectDate(date)}
            />
          ))}
        </ScrollView>
      </YStack>

      {showTimeFields ? (
        <YStack gap={8} marginBottom={16}>
          <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
            {startTimeLabel}
          </Text>
          <XStack alignItems="center" gap={8}>
            <TimeField value={startHour} onChange={onStartHourChange} />
            <Text color="#FFFFFF" fontSize={18} fontWeight="700">
              :
            </Text>
            <TimeField value={startMinute} onChange={onStartMinuteChange} />
          </XStack>
        </YStack>
      ) : null}

      {showTimeFields && mode === "range" ? (
        <YStack gap={8} marginBottom={16}>
          <Text color="rgba(255,255,255,0.6)" fontSize={12} fontWeight="700">
            {endTimeLabel}
          </Text>
          <XStack alignItems="center" gap={8}>
            <TimeField value={endHour ?? ""} onChange={onEndHourChange ?? (() => {})} />
            <Text color="#FFFFFF" fontSize={18} fontWeight="700">
              :
            </Text>
            <TimeField value={endMinute ?? ""} onChange={onEndMinuteChange ?? (() => {})} />
          </XStack>
          {startTimeValid && endTimeValid && !isRangeValid && invalidRangeError ? (
            <Text color="#E74C3C" fontSize={12}>
              {invalidRangeError}
            </Text>
          ) : null}
        </YStack>
      ) : null}
    </>
  )
}
