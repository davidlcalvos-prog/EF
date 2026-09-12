import { ErrorInfo } from "react"
// Text crudo de react-native a propósito (ver el comentario del componente):
// la pantalla de emergencia no debe depender del wrapper de Text ni de Tamagui.
// eslint-disable-next-line no-restricted-imports
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { translate } from "@/i18n/translate"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export interface ErrorDetailsProps {
  error: Error
  errorInfo: ErrorInfo | null
  onReset(): void
}

/**
 * Pantalla de emergencia que monta el ErrorBoundary cuando un render lanza.
 *
 * A propósito usa solo primitivas de react-native + eliteForgeColors (nada de
 * Tamagui ni de los componentes de la plantilla de Ignite): si lo que rompió
 * fue una dependencia de UI, esta pantalla tiene que poder dibujarse igual.
 *
 * Producción: título, mensaje breve con el correo de soporte y el botón.
 * Desarrollo (`__DEV__`): además el mensaje del error y el stack de
 * componentes, seleccionables para copiarlos. Cómo se captura y se loguea el
 * error no cambia (ver ErrorBoundary.tsx).
 *
 * El botón NO reinicia la app: `onReset` limpia el estado del boundary y
 * vuelve a renderizar la misma pantalla en la que estaba el usuario. Por eso
 * el texto dice "Intentar de nuevo".
 */
export function ErrorDetails(props: ErrorDetailsProps) {
  const insets = useSafeAreaInsets()
  const componentStack = `${props.errorInfo?.componentStack ?? ""}`.trim()

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 32, paddingBottom: Math.max(insets.bottom, 16) + 12 },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.iconCircle}>
          <Ionicons name="alert-circle-outline" size={44} color={eliteForgeColors.orange} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {translate("errorScreen:title")}
        </Text>
        <Text style={styles.subtitle}>{translate("errorScreen:friendlySubtitle")}</Text>
      </View>

      {__DEV__ ? (
        <ScrollView style={styles.devBox} contentContainerStyle={styles.devBoxContent}>
          <Text style={styles.devTitle}>{translate("errorScreen:devDetailsTitle")}</Text>
          <Text selectable style={styles.devError} testID="error-details-message">
            {`${props.error}`.trim()}
          </Text>
          {componentStack ? (
            <Text selectable style={styles.devStack} testID="error-details-stack">
              {componentStack}
            </Text>
          ) : null}
        </ScrollView>
      ) : (
        <View style={styles.spacer} />
      )}

      <Pressable
        onPress={props.onReset}
        accessibilityRole="button"
        testID="error-details-reset"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonLabel}>{translate("errorScreen:reset")}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: eliteForgeColors.emerald,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
  },
  buttonLabel: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "800",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  container: {
    alignItems: "center",
    backgroundColor: eliteForgeColors.carbon,
    flex: 1,
    paddingHorizontal: 24,
  },
  devBox: {
    alignSelf: "stretch",
    backgroundColor: eliteForgeColors.carbonInput,
    borderColor: eliteForgeColors.carbonBorder,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginBottom: 16,
    marginTop: 24,
  },
  devBoxContent: {
    gap: 10,
    padding: 14,
  },
  devError: {
    color: "#E74C3C",
    fontSize: 13,
    fontWeight: "700",
  },
  devStack: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 16,
  },
  devTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: eliteForgeColors.carbonElevated,
    borderColor: eliteForgeColors.carbonBorder,
    borderRadius: 42,
    borderWidth: 1,
    height: 84,
    justifyContent: "center",
    marginBottom: 8,
    width: 84,
  },
  spacer: {
    flex: 1,
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 360,
    textAlign: "center",
  },
  title: {
    color: eliteForgeColors.white,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  top: {
    alignItems: "center",
    gap: 12,
  },
})
