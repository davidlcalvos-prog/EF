import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
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
import { GroupAvatar } from "@/screens/groups/components/GroupAvatar"
import { api, type GroupSearchResultApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

export interface GroupSearchModalProps {
  visible: boolean
  onClose: () => void
  onRequest: (targetGroupId: string) => Promise<{ kind: "ok" } | GeneralApiProblem>
}

const SEARCH_DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 2

function describeProblem(problem: GeneralApiProblem): string {
  switch (problem.kind) {
    case "conflict":
      return translate("groupFriendsScreen:requestConflict")
    case "forbidden":
      return translate("groupFriendsScreen:actionForbidden")
    case "not-found":
      return translate("groupFriendsScreen:notFoundError")
    default:
      return translate("groupFriendsScreen:requestError")
  }
}

export function GroupSearchModal({ visible, onClose, onRequest }: GroupSearchModalProps) {
  const { insets } = useResponsiveLayout()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GroupSearchResultApiDto[]>([])
  const [searching, setSearching] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const thisRequestId = ++requestIdRef.current
      const result = await api.searchGroups(trimmed)
      if (thisRequestId !== requestIdRef.current) return
      setSearching(false)
      if (result.kind === "ok") {
        setResults(result.groups)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const reset = () => {
    setQuery("")
    setResults([])
    setSearching(false)
    setSendingId(null)
    setErrorText(null)
  }

  const handleClose = () => {
    if (sendingId) return
    reset()
    Keyboard.dismiss()
    onClose()
  }

  const handleSend = async (targetGroupId: string) => {
    if (sendingId) return
    setErrorText(null)
    setSendingId(targetGroupId)
    const result = await onRequest(targetGroupId)
    setSendingId(null)

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
            maxHeight: "80%",
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
              {translate("groupFriendsScreen:searchTitle")}
            </Text>

            <XStack width={20} />
          </XStack>

          <YStack paddingHorizontal={16} paddingTop={16} gap={8}>
            <TextField
              value={query}
              onChangeText={(text) => {
                setQuery(text)
                if (errorText) setErrorText(null)
              }}
              autoFocus
              autoCapitalize="none"
              placeholder={translate("groupFriendsScreen:searchPlaceholder")}
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
            {errorText ? (
              <Text color="#E74C3C" fontSize={12}>
                {errorText}
              </Text>
            ) : null}
          </YStack>

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
            renderItem={({ item }) => (
              <XStack
                alignItems="center"
                gap={12}
                paddingVertical={10}
                borderBottomWidth={1}
                borderBottomColor={eliteForgeColors.carbonBorder}
              >
                <GroupAvatar
                  seed={item.id}
                  name={item.name}
                  photoBase64={item.photoBase64}
                  size={40}
                />
                <YStack flex={1}>
                  <Text color="#FFFFFF" fontWeight="700" fontSize={14} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text color="rgba(255,255,255,0.5)" fontSize={12}>
                    {translate("groupFriendsScreen:memberCount", { count: item.memberCount })}
                  </Text>
                </YStack>
                <Pressable
                  onPress={() => handleSend(item.id)}
                  disabled={sendingId === item.id}
                  accessibilityRole="button"
                >
                  <XStack
                    backgroundColor={eliteForgeColors.emerald}
                    borderRadius={10}
                    paddingHorizontal={12}
                    paddingVertical={8}
                    alignItems="center"
                    gap={6}
                    opacity={sendingId === item.id ? 0.6 : 1}
                  >
                    {sendingId === item.id ? (
                      <ActivityIndicator size="small" color="#1a1a1a" />
                    ) : null}
                    <Text color="#1a1a1a" fontWeight="800" fontSize={12}>
                      {translate("groupFriendsScreen:sendRequest")}
                    </Text>
                  </XStack>
                </Pressable>
              </XStack>
            )}
            ListEmptyComponent={
              searching ? (
                <YStack paddingVertical={32} alignItems="center">
                  <ActivityIndicator color={eliteForgeColors.emerald} />
                </YStack>
              ) : query.trim().length >= MIN_QUERY_LENGTH ? (
                <YStack paddingVertical={32} alignItems="center">
                  <Text color="rgba(255,255,255,0.5)" fontSize={14}>
                    {translate("groupFriendsScreen:searchNoResults")}
                  </Text>
                </YStack>
              ) : null
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
