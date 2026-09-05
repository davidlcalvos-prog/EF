import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { TextField } from "@/components/TextField"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { api, type MunicipalityApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

const SEARCH_DEBOUNCE_MS = 350
const SEARCH_MIN_LENGTH = 2

/** Valor mostrado como "Pereira, Risaralda". */
export interface MunicipalityValue {
  code: string
  name: string
  department: string
}

export function formatMunicipality(value: MunicipalityValue): string {
  return `${value.name}, ${value.department}`
}

export interface MunicipalityPickerProps {
  /** Valor actual (o null si no hay zona). */
  value: MunicipalityValue | null
  onChange: (value: MunicipalityValue | null) => void
  /** Texto del campo cuando no hay valor. */
  placeholder?: string
  /** Permite limpiar el valor con una X (default true). */
  clearable?: boolean
}

/**
 * Campo + modal con buscador de municipios de Colombia (Fase L.0).
 * Sin GPS ni mapas: el dato es estático y viene de GET /geo/municipalities.
 */
export function MunicipalityPicker({
  value,
  onChange,
  placeholder,
  clearable = true,
}: MunicipalityPickerProps) {
  const { insets } = useResponsiveLayout()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MunicipalityApiDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const seqRef = useRef(0)

  useEffect(() => {
    if (!open) return
    const term = query.trim()
    if (term.length < SEARCH_MIN_LENGTH) {
      setResults([])
      setLoading(false)
      setError(false)
      return
    }
    setLoading(true)
    setError(false)
    const seq = ++seqRef.current
    const timer = setTimeout(() => {
      api.searchMunicipalities(term, 15).then((result) => {
        if (seqRef.current !== seq) return
        setLoading(false)
        if (result.kind === "ok") {
          setResults(result.municipalities)
        } else {
          setError(true)
        }
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, open])

  const close = () => {
    setOpen(false)
    setQuery("")
    setResults([])
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
        <XStack
          alignItems="center"
          gap={10}
          backgroundColor={eliteForgeColors.carbonInput}
          borderWidth={1}
          borderColor={eliteForgeColors.carbonBorder}
          borderRadius={12}
          paddingHorizontal={14}
          paddingVertical={12}
        >
          <Ionicons name="location-outline" size={18} color={eliteForgeColors.emerald} />
          <Text
            flex={1}
            color={value ? "#FFFFFF" : "rgba(255,255,255,0.4)"}
            fontSize={14}
            numberOfLines={1}
          >
            {value
              ? formatMunicipality(value)
              : (placeholder ?? translate("municipalityPicker:placeholder"))}
          </Text>
          {value && clearable ? (
            <Pressable
              onPress={() => onChange(null)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={translate("municipalityPicker:clear")}
            >
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </Pressable>
          ) : (
            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.5)" />
          )}
        </XStack>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        {/* Un Modal es una jerarquía nativa aparte: NO hereda el KeyboardAvoidingView
            de la pantalla que lo abre — necesita el suyo o el teclado tapa la lista. */}
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              top: insets.top + 60,
              backgroundColor: eliteForgeColors.carbonElevated,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderWidth: 1,
              borderColor: eliteForgeColors.carbonBorder,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            <XStack
              alignItems="center"
              justifyContent="space-between"
              paddingHorizontal={16}
              paddingVertical={12}
              borderBottomWidth={1}
              borderBottomColor={eliteForgeColors.carbonBorder}
            >
              <Text color="#FFFFFF" fontWeight="800" fontSize={15}>
                {translate("municipalityPicker:title")}
              </Text>
              <Pressable onPress={close} hitSlop={10} accessibilityRole="button">
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
            </XStack>

            <XStack
              margin={16}
              alignItems="center"
              gap={8}
              backgroundColor={eliteForgeColors.carbonInput}
              borderWidth={1}
              borderColor={eliteForgeColors.carbonBorder}
              borderRadius={12}
              paddingHorizontal={12}
            >
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
              <TextField
                value={query}
                onChangeText={setQuery}
                placeholder={translate("municipalityPicker:searchPlaceholder")}
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={{ flex: 1 }}
                inputWrapperStyle={{
                  backgroundColor: "transparent",
                  borderWidth: 0,
                  paddingHorizontal: 0,
                }}
                style={{ color: "#FFFFFF", fontSize: 14, paddingVertical: 12 }}
              />
            </XStack>

            {loading ? (
              <YStack paddingVertical={32} alignItems="center">
                <ActivityIndicator color={eliteForgeColors.emerald} />
              </YStack>
            ) : error ? (
              <YStack paddingVertical={32} alignItems="center" paddingHorizontal={24}>
                <Text color="rgba(255,255,255,0.6)" fontSize={13} textAlign="center">
                  {translate("municipalityPicker:error")}
                </Text>
              </YStack>
            ) : query.trim().length < SEARCH_MIN_LENGTH ? (
              <YStack paddingVertical={32} alignItems="center" paddingHorizontal={24}>
                <Text color="rgba(255,255,255,0.45)" fontSize={13} textAlign="center">
                  {translate("municipalityPicker:hint")}
                </Text>
              </YStack>
            ) : results.length === 0 ? (
              <YStack paddingVertical={32} alignItems="center" paddingHorizontal={24}>
                <Text color="rgba(255,255,255,0.5)" fontSize={13} textAlign="center">
                  {translate("municipalityPicker:empty")}
                </Text>
              </YStack>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onChange({ code: item.code, name: item.name, department: item.department })
                      close()
                    }}
                    accessibilityRole="button"
                  >
                    <XStack
                      alignItems="center"
                      gap={10}
                      paddingHorizontal={16}
                      paddingVertical={12}
                      borderBottomWidth={1}
                      borderBottomColor={eliteForgeColors.carbonBorder}
                    >
                      <Ionicons name="location-outline" size={16} color={eliteForgeColors.orange} />
                      <Text color="#FFFFFF" fontSize={14} flex={1} numberOfLines={1}>
                        {item.name}
                        <Text color="rgba(255,255,255,0.5)"> — {item.department}</Text>
                      </Text>
                    </XStack>
                  </Pressable>
                )}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}
