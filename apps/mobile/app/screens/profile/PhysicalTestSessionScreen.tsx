import { useCallback, useState } from "react"
import { Pressable, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated from "react-native-reanimated"
import { Text, XStack, YStack } from "tamagui"

import { useAppAlert } from "@/components/AppAlert"
import { useAuth } from "@/context/AuthContext"
import {
  getTestAvailability,
  getTestDefinition,
  getNextRetakeDate,
  type TestRawResult,
} from "@/data/mockPlayerProfile"
import { formatRawResultSummary, scoreTestResult } from "@/data/profileTestScoring"
import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { TestMeasurePanel } from "./components/measure/TestMeasurePanel"
import { useProfileStats } from "./useProfileStats"

type Step = "protocol" | "measure" | "confirm"

const TEST_ICONS = {
  sprint30m: "flash-outline",
  illinoisAgility: "shuffle-outline",
  loughboroughPass: "football-outline",
  defenseControl: "shield-outline",
  attackShots16m: "locate-outline",
  beepTest: "heart-outline",
} as const

function formatRetakeDate(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

export function PhysicalTestSessionScreen({
  navigation,
  route,
}: AppStackScreenProps<"PhysicalTestSession">) {
  const { testId } = route.params
  const definition = getTestDefinition(testId)!
  const { authEmail } = useAuth()
  const showAlert = useAppAlert()
  const userKey = authEmail ?? "guest"
  const { completeTest, getTestState } = useProfileStats(userKey)
  const state = getTestState(testId)
  const isLocked = state ? getTestAvailability(state) === "completed" : false

  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const motion = useInteractiveMotion("button")

  const [step, setStep] = useState<Step>("protocol")
  const [measuredResult, setMeasuredResult] = useState<TestRawResult | null>(null)
  const [measurementComplete, setMeasurementComplete] = useState(false)
  const [validationError, setValidationError] = useState("")

  const previewScore = measuredResult ? scoreTestResult(measuredResult) : null

  const handleMeasurementChange = useCallback(
    (result: TestRawResult | null, isComplete: boolean) => {
      setMeasuredResult(result)
      setMeasurementComplete(isComplete)
      setValidationError("")
    },
    [],
  )

  const validateAndAdvance = useCallback(() => {
    setValidationError("")

    if (step === "protocol") {
      if (isLocked) {
        const nextDate = getNextRetakeDate(state?.lastCompletedAt)
        showAlert(
          translate("profileScreen:testLockedTitle"),
          translate("profileScreen:testLockedMessage", {
            date: nextDate ? formatRetakeDate(nextDate) : "—",
          }),
        )
        return
      }
      setStep("measure")
      return
    }

    if (step === "measure") {
      if (!measuredResult || !measurementComplete) {
        setValidationError(translate("profileScreen:measureCompleteFirst"))
        return
      }
      setStep("confirm")
      return
    }

    if (step === "confirm" && measuredResult) {
      const saved = completeTest(testId, measuredResult)
      if (!saved) {
        showAlert(
          translate("profileScreen:testLockedTitle"),
          translate("profileScreen:testLockedThisMonth"),
        )
        return
      }

      showAlert(
        translate("profileScreen:testDoneTitle"),
        translate("profileScreen:testDoneMessage"),
        [{ text: translate("common:ok"), onPress: () => navigation.goBack() }],
      )
    }
  }, [
    completeTest,
    isLocked,
    measuredResult,
    measurementComplete,
    navigation,
    showAlert,
    state?.lastCompletedAt,
    step,
    testId,
  ])

  const handleBack = useCallback(() => {
    if (step === "measure") {
      setStep("protocol")
      setMeasuredResult(null)
      setMeasurementComplete(false)
      return
    }
    if (step === "confirm") {
      setStep("measure")
      return
    }
    navigation.goBack()
  }, [navigation, step])

  const stepLabel =
    step === "protocol"
      ? translate("profileScreen:sessionStepProtocol")
      : step === "measure"
        ? translate("profileScreen:sessionStepMeasure")
        : translate("profileScreen:sessionStepConfirm")

  const continueDisabled =
    (isLocked && step === "protocol") || (step === "measure" && !measurementComplete)

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: horizontalPadding,
          maxWidth: contentMaxWidth,
          width: "100%",
          alignSelf: "center",
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={20}>
          <XStack alignItems="center" justifyContent="space-between">
            <Pressable onPress={handleBack} hitSlop={12} accessibilityRole="button">
              <XStack
                width={40}
                height={40}
                borderRadius={12}
                backgroundColor={eliteForgeColors.carbonInput}
                borderWidth={1}
                borderColor={eliteForgeColors.carbonBorder}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="arrow-back" size={20} color={eliteForgeColors.emerald} />
              </XStack>
            </Pressable>

            <Text color="rgba(255,255,255,0.55)" fontSize={12} fontWeight="700">
              {stepLabel}
            </Text>
          </XStack>

          <YStack
            borderRadius={16}
            borderWidth={1}
            borderColor={eliteForgeColors.carbonBorder}
            backgroundColor={eliteForgeColors.carbonElevated}
            padding={16}
            gap={14}
          >
            <XStack alignItems="center" gap={12}>
              <XStack
                width={48}
                height={48}
                borderRadius={14}
                backgroundColor="rgba(0,206,200,0.12)"
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name={TEST_ICONS[testId]} size={24} color={eliteForgeColors.emerald} />
              </XStack>
              <YStack flex={1} gap={4}>
                <Text color={eliteForgeColors.white} fontWeight="800" fontSize={18}>
                  {translate(definition.titleKey as never)}
                </Text>
                <Text color={eliteForgeColors.emerald} fontSize={12} fontWeight="700">
                  {translate(`profileScreen:stat_${definition.statKey}` as never)}
                </Text>
              </YStack>
            </XStack>

            {step === "protocol" && (
              <YStack gap={10}>
                <Text color="rgba(255,255,255,0.55)" fontSize={13} lineHeight={20}>
                  {translate(definition.descriptionKey as never)}
                </Text>
                <YStack
                  padding={12}
                  borderRadius={12}
                  backgroundColor="rgba(0,0,0,0.22)"
                  borderWidth={1}
                  borderColor={eliteForgeColors.carbonBorder}
                  gap={8}
                >
                  <Text color={eliteForgeColors.orange} fontSize={11} fontWeight="800">
                    {translate("profileScreen:protocolTitle")}
                  </Text>
                  <Text color="rgba(255,255,255,0.75)" fontSize={12} lineHeight={19}>
                    {translate(definition.protocolKey as never)}
                  </Text>
                </YStack>
                <Text color="rgba(255,255,255,0.45)" fontSize={11} lineHeight={16}>
                  {translate("profileScreen:monthlyLockHint")}
                </Text>
                {isLocked && state?.rawResult && (
                  <YStack
                    padding={12}
                    borderRadius={12}
                    backgroundColor="rgba(0,206,200,0.08)"
                    borderWidth={1}
                    borderColor="rgba(0,206,200,0.25)"
                    gap={4}
                  >
                    <Text color={eliteForgeColors.emerald} fontWeight="700" fontSize={13}>
                      {translate("profileScreen:currentMonthResult")}
                    </Text>
                    <Text color="rgba(255,255,255,0.7)" fontSize={12}>
                      {formatRawResultSummary(state.rawResult)} · {state.score}/100
                    </Text>
                  </YStack>
                )}
              </YStack>
            )}

            {step === "measure" && (
              <YStack gap={12}>
                <Text color="rgba(255,255,255,0.55)" fontSize={13}>
                  {translate("profileScreen:measureInAppHint")}
                </Text>

                <TestMeasurePanel testId={testId} onMeasurementChange={handleMeasurementChange} />

                {previewScore != null && measurementComplete && (
                  <YStack
                    padding={12}
                    borderRadius={12}
                    backgroundColor="rgba(0,206,200,0.08)"
                    borderWidth={1}
                    borderColor="rgba(0,206,200,0.25)"
                    gap={4}
                  >
                    <Text color={eliteForgeColors.emerald} fontWeight="700" fontSize={13}>
                      {translate("profileScreen:previewScore", { score: previewScore })}
                    </Text>
                    {measuredResult && (
                      <Text color="rgba(255,255,255,0.65)" fontSize={12}>
                        {formatRawResultSummary(measuredResult)}
                      </Text>
                    )}
                  </YStack>
                )}

                {validationError ? (
                  <Text color="#E74C3C" fontSize={12}>
                    {validationError}
                  </Text>
                ) : null}
              </YStack>
            )}

            {step === "confirm" && measuredResult && previewScore != null && (
              <YStack gap={10}>
                <Text color="rgba(255,255,255,0.55)" fontSize={13} lineHeight={19}>
                  {translate("profileScreen:confirmLockWarning")}
                </Text>
                <YStack
                  padding={14}
                  borderRadius={12}
                  backgroundColor={eliteForgeColors.carbonInput}
                  borderWidth={1}
                  borderColor={eliteForgeColors.carbonBorder}
                  gap={8}
                >
                  <XStack justifyContent="space-between">
                    <Text color="rgba(255,255,255,0.6)" fontSize={12}>
                      {translate("profileScreen:resultRaw")}
                    </Text>
                    <Text color={eliteForgeColors.white} fontWeight="700" fontSize={13}>
                      {formatRawResultSummary(measuredResult)}
                    </Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text color="rgba(255,255,255,0.6)" fontSize={12}>
                      {translate("profileScreen:resultScore")}
                    </Text>
                    <Text color={eliteForgeColors.emerald} fontWeight="800" fontSize={16}>
                      {previewScore}/100
                    </Text>
                  </XStack>
                </YStack>
              </YStack>
            )}
          </YStack>

          <Pressable
            onPress={validateAndAdvance}
            disabled={continueDisabled}
            onPressIn={motion.onPressIn}
            onPressOut={motion.onPressOut}
            accessibilityRole="button"
          >
            <Animated.View style={motion.animatedStyle}>
              <XStack
                borderRadius={14}
                paddingVertical={14}
                alignItems="center"
                justifyContent="center"
                backgroundColor={
                  continueDisabled ? "rgba(255,255,255,0.06)" : "rgba(0,206,200,0.18)"
                }
                borderWidth={1}
                borderColor={
                  continueDisabled ? eliteForgeColors.carbonBorder : eliteForgeColors.emerald
                }
                opacity={continueDisabled ? 0.65 : 1}
              >
                <Text
                  color={continueDisabled ? "rgba(255,255,255,0.55)" : eliteForgeColors.emerald}
                  fontWeight="800"
                  fontSize={14}
                >
                  {isLocked && step === "protocol"
                    ? translate("profileScreen:testRetakeOn", {
                        date: formatRetakeDate(
                          getNextRetakeDate(state?.lastCompletedAt) ?? new Date(),
                        ),
                      })
                    : step === "confirm"
                      ? translate("profileScreen:testConfirmAction")
                      : translate("profileScreen:sessionContinue")}
                </Text>
              </XStack>
            </Animated.View>
          </Pressable>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
