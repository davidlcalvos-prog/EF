import { useCallback, useMemo, useState } from "react"
import { Pressable, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Animated from "react-native-reanimated"
import { Text, XStack, YStack } from "tamagui"

import { useAppAlert } from "@/components/AppAlert"
import { useAuth } from "@/context/AuthContext"
import {
  isPsychTestLockedThisMonth,
  PSYCH_LIKERT_OPTIONS,
  PSYCH_QUESTIONS,
  scorePsychAnswers,
} from "@/data/psychologicalTest"
import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { PsychScoresChart } from "./components/PsychScoresChart"
import { usePlayerProfile } from "./usePlayerProfile"

type Step = "intro" | "questions" | "result"

export function PsychologicalTestScreen({ navigation }: AppStackScreenProps<"PsychologicalTest">) {
  const { authEmail } = useAuth()
  const showAlert = useAppAlert()
  const userKey = authEmail ?? "guest"
  const { psychTest, savePsychTestResult } = usePlayerProfile(userKey, authEmail)
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const motion = useInteractiveMotion("button")

  const isLocked = psychTest ? isPsychTestLockedThisMonth(psychTest.completedAt) : false

  const [step, setStep] = useState<Step>("intro")
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>(() => PSYCH_QUESTIONS.map(() => 0))

  const currentQuestion = PSYCH_QUESTIONS[questionIndex]
  const scores = useMemo(() => scorePsychAnswers(answers), [answers])
  const allAnswered = answers.every((value) => value > 0)

  const handleSelectAnswer = useCallback(
    (value: number) => {
      setAnswers((current) =>
        current.map((item, index) => (index === questionIndex ? value : item)),
      )
    },
    [questionIndex],
  )

  const handleContinue = useCallback(() => {
    if (step === "intro") {
      if (isLocked) {
        showAlert(
          translate("profileScreen:psychLockedTitle"),
          translate("profileScreen:psychLockedMessage"),
        )
        return
      }
      setStep("questions")
      return
    }

    if (step === "questions") {
      if (answers[questionIndex] === 0) {
        showAlert(
          translate("profileScreen:psychValidationTitle"),
          translate("profileScreen:psychSelectAnswer"),
        )
        return
      }
      if (questionIndex < PSYCH_QUESTIONS.length - 1) {
        setQuestionIndex((value) => value + 1)
        return
      }
      setStep("result")
      return
    }

    if (step === "result" && allAnswered) {
      savePsychTestResult({
        completedAt: new Date().toISOString(),
        teamworkScore: scores.teamworkScore,
        onFieldScore: scores.onFieldScore,
        overallScore: scores.overallScore,
        answers,
        traits: scores.traits ?? undefined,
      })
      showAlert(
        translate("profileScreen:psychDoneTitle"),
        translate("profileScreen:psychDoneMessage"),
        [{ text: translate("common:ok"), onPress: () => navigation.goBack() }],
      )
    }
  }, [
    allAnswered,
    answers,
    isLocked,
    navigation,
    questionIndex,
    showAlert,
    savePsychTestResult,
    scores.onFieldScore,
    scores.overallScore,
    scores.teamworkScore,
    scores.traits,
    step,
  ])

  const handleBack = useCallback(() => {
    if (step === "questions" && questionIndex > 0) {
      setQuestionIndex((value) => value - 1)
      return
    }
    if (step === "questions") {
      setStep("intro")
      return
    }
    if (step === "result") {
      setStep("questions")
      setQuestionIndex(PSYCH_QUESTIONS.length - 1)
      return
    }
    navigation.goBack()
  }, [navigation, questionIndex, step])

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
      >
        <YStack gap={20}>
          <XStack alignItems="center" justifyContent="space-between">
            <Pressable onPress={handleBack} hitSlop={12}>
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
              {step === "questions"
                ? translate("profileScreen:psychProgress", {
                    current: questionIndex + 1,
                    total: PSYCH_QUESTIONS.length,
                  })
                : translate("profileScreen:psychTestTitle")}
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
            {step === "intro" && (
              <YStack gap={10}>
                <Text color={eliteForgeColors.white} fontWeight="800" fontSize={20}>
                  {translate("profileScreen:psychTestTitle")}
                </Text>
                <Text color="rgba(255,255,255,0.55)" fontSize={13} lineHeight={20}>
                  {translate("profileScreen:psychTestDesc")}
                </Text>
                {isLocked && psychTest && (
                  <YStack
                    padding={12}
                    borderRadius={12}
                    backgroundColor="rgba(0,206,200,0.08)"
                    borderWidth={1}
                    borderColor="rgba(0,206,200,0.25)"
                    gap={10}
                  >
                    <Text color={eliteForgeColors.emerald} fontWeight="700" fontSize={13}>
                      {translate("profileScreen:psychCurrentResult")}
                    </Text>
                    <PsychScoresChart
                      teamworkScore={psychTest.teamworkScore}
                      mindsetScore={psychTest.onFieldScore}
                      overallScore={psychTest.overallScore}
                      compact
                    />
                  </YStack>
                )}
              </YStack>
            )}

            {step === "questions" && currentQuestion && (
              <YStack gap={14}>
                <Text color={eliteForgeColors.orange} fontSize={11} fontWeight="800">
                  {currentQuestion.category === "teamwork"
                    ? translate("profileScreen:psychCategoryTeamwork")
                    : translate("profileScreen:psychCategoryOnField")}
                </Text>
                <Text color={eliteForgeColors.white} fontWeight="700" fontSize={16} lineHeight={24}>
                  {translate(currentQuestion.textKey as never)}
                </Text>
                <YStack gap={8}>
                  {PSYCH_LIKERT_OPTIONS.map((option) => {
                    const isSelected = answers[questionIndex] === option.value
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => handleSelectAnswer(option.value)}
                      >
                        <XStack
                          paddingVertical={12}
                          paddingHorizontal={14}
                          borderRadius={12}
                          backgroundColor={
                            isSelected ? "rgba(0,206,200,0.16)" : "rgba(255,255,255,0.05)"
                          }
                          borderWidth={1}
                          borderColor={
                            isSelected ? eliteForgeColors.emerald : eliteForgeColors.carbonBorder
                          }
                        >
                          <Text
                            color={isSelected ? eliteForgeColors.emerald : "rgba(255,255,255,0.75)"}
                            fontWeight={isSelected ? "800" : "600"}
                            fontSize={13}
                          >
                            {option.value}. {translate(option.labelKey as never)}
                          </Text>
                        </XStack>
                      </Pressable>
                    )
                  })}
                </YStack>
              </YStack>
            )}

            {step === "result" && (
              <YStack gap={12}>
                <Text color={eliteForgeColors.white} fontWeight="800" fontSize={18}>
                  {translate("profileScreen:psychResultTitle")}
                </Text>
                <PsychScoresChart
                  teamworkScore={scores.teamworkScore}
                  mindsetScore={scores.onFieldScore}
                  overallScore={scores.overallScore}
                />
                <Text color="rgba(255,255,255,0.45)" fontSize={11} lineHeight={16}>
                  {translate("profileScreen:psychResultHint")}
                </Text>
              </YStack>
            )}
          </YStack>

          <Pressable
            onPress={handleContinue}
            disabled={isLocked && step === "intro"}
            onPressIn={motion.onPressIn}
            onPressOut={motion.onPressOut}
          >
            <Animated.View style={motion.animatedStyle}>
              <XStack
                borderRadius={14}
                paddingVertical={14}
                alignItems="center"
                justifyContent="center"
                backgroundColor={
                  isLocked && step === "intro" ? "rgba(255,255,255,0.06)" : "rgba(0,206,200,0.18)"
                }
                borderWidth={1}
                borderColor={
                  isLocked && step === "intro"
                    ? eliteForgeColors.carbonBorder
                    : eliteForgeColors.emerald
                }
                opacity={isLocked && step === "intro" ? 0.65 : 1}
              >
                <Text
                  color={
                    isLocked && step === "intro"
                      ? "rgba(255,255,255,0.55)"
                      : eliteForgeColors.emerald
                  }
                  fontWeight="800"
                  fontSize={14}
                >
                  {isLocked && step === "intro"
                    ? translate("profileScreen:psychLockedButton")
                    : step === "result"
                      ? translate("profileScreen:psychConfirmAction")
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
