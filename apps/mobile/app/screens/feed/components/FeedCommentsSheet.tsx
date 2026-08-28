import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAppAlert } from "@/components/AppAlert"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { FeedPost } from "@/data/mockFeedPosts"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { translate } from "@/i18n/translate"
import { api, type CommentApiDto } from "@/services/api"
import { eliteForgeColors } from "@/theme/eliteForgeColors"
import { formatRelativeTime } from "@/utils/formatDate"

import { FeedAvatar } from "./FeedAvatar"

export interface FeedCommentsSheetProps {
  visible: boolean
  post: FeedPost | null
  onClose: () => void
  /** Refleja altas/bajas de comentarios en el contador del post dentro del feed. */
  onCommentsCountChange?: (postId: string, delta: number) => void
}

const PAGE_SIZE = 20

const AVATAR_PALETTE = ["#00CEC8", "#FF8C00", "#7B68EE", "#2ECC71", "#E74C3C"]

function pickAvatarColor(seed: string) {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

export function FeedCommentsSheet({
  visible,
  post,
  onClose,
  onCommentsCountChange,
}: FeedCommentsSheetProps) {
  const { authUserId } = useAuth()
  const { insets } = useResponsiveLayout()
  const showAlert = useAppAlert()

  const [comments, setComments] = useState<CommentApiDto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(false)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  const postId = post?.id

  useEffect(() => {
    if (!visible || !postId) return

    setComments([])
    setPage(1)
    setHasMore(false)
    setError(false)
    setDraft("")
    setLoading(true)

    api.listFeedComments(postId, 1, PAGE_SIZE).then((result) => {
      setLoading(false)
      if (result.kind !== "ok") {
        setError(true)
        return
      }
      setComments(result.comments)
      setHasMore(result.comments.length === PAGE_SIZE)
    })
  }, [visible, postId])

  const handleLoadMore = useCallback(async () => {
    if (!postId || loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    const result = await api.listFeedComments(postId, nextPage, PAGE_SIZE)
    setLoadingMore(false)
    if (result.kind !== "ok") return
    setComments((prev) => [...prev, ...result.comments])
    setHasMore(result.comments.length === PAGE_SIZE)
    setPage(nextPage)
  }, [postId, page, loadingMore, hasMore])

  const handleSend = useCallback(async () => {
    const content = draft.trim()
    if (!content || !postId || sending) return

    setSending(true)
    const result = await api.createFeedComment(postId, content)
    setSending(false)

    if (result.kind !== "ok") {
      showAlert(translate("feedScreen:commentsErrorTitle"), translate("feedScreen:commentsError"))
      return
    }

    setComments((prev) => [result.comment, ...prev])
    setDraft("")
    onCommentsCountChange?.(postId, 1)
  }, [draft, postId, sending, onCommentsCountChange, showAlert])

  const handleDeleteComment = useCallback(
    (comment: CommentApiDto) => {
      showAlert(
        translate("feedScreen:deleteCommentConfirmTitle"),
        translate("feedScreen:deleteCommentConfirmMessage"),
        [
          { text: translate("feedScreen:composeCancel"), style: "cancel" },
          {
            text: translate("feedScreen:deleteConfirm"),
            style: "destructive",
            onPress: async () => {
              const result = await api.deleteFeedComment(comment.id)
              if (result.kind !== "ok") return
              setComments((prev) => prev.filter((item) => item.id !== comment.id))
              if (postId) onCommentsCountChange?.(postId, -1)
            },
          },
        ],
      )
    },
    [postId, onCommentsCountChange, showAlert],
  )

  const handleClose = () => {
    setDraft("")
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={handleClose} />

        <YStack
          backgroundColor="#363636"
          borderTopLeftRadius={20}
          borderTopRightRadius={20}
          borderWidth={1}
          borderColor="#555555"
          maxHeight="75%"
          paddingBottom={insets.bottom + 10}
        >
          <XStack
            alignSelf="center"
            width={40}
            height={4}
            borderRadius={2}
            backgroundColor="#666666"
            marginTop={10}
            marginBottom={8}
          />

          <Text
            color="#FFFFFF"
            fontWeight="800"
            fontSize={17}
            paddingHorizontal={16}
            marginBottom={8}
          >
            {translate("feedScreen:commentsTitle")}
          </Text>

          <ScrollView
            style={{ paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {loading ? (
              <YStack paddingVertical={24} alignItems="center">
                <ActivityIndicator color={eliteForgeColors.emerald} />
              </YStack>
            ) : error ? (
              <Text color="rgba(255,255,255,0.6)" fontSize={14} paddingVertical={16}>
                {translate("feedScreen:commentsError")}
              </Text>
            ) : comments.length === 0 ? (
              <Text color="rgba(255,255,255,0.5)" fontSize={14} paddingVertical={16}>
                {translate("feedScreen:commentsEmpty")}
              </Text>
            ) : (
              comments.map((comment) => {
                const canDelete = comment.authorId === authUserId || post?.authorId === authUserId
                return (
                  <XStack key={comment.id} gap={10} paddingVertical={10} alignItems="flex-start">
                    <FeedAvatar
                      label={comment.authorName}
                      color={pickAvatarColor(comment.authorId)}
                      size={32}
                    />
                    <YStack flex={1} gap={2}>
                      <XStack alignItems="center" gap={6}>
                        <Text color="#FFFFFF" fontWeight="700" fontSize={13}>
                          {comment.authorName}
                        </Text>
                        <Text color="rgba(255,255,255,0.45)" fontSize={11}>
                          {comment.authorHandle} · {formatRelativeTime(comment.createdAt)}
                        </Text>
                      </XStack>
                      <Text color="rgba(255,255,255,0.85)" fontSize={14} lineHeight={19}>
                        {comment.content}
                      </Text>
                    </YStack>
                    {canDelete ? (
                      <Pressable
                        onPress={() => handleDeleteComment(comment)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={translate("feedScreen:deleteComment")}
                      >
                        <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.4)" />
                      </Pressable>
                    ) : null}
                  </XStack>
                )
              })
            )}

            {hasMore ? (
              <Pressable
                onPress={handleLoadMore}
                disabled={loadingMore}
                accessibilityRole="button"
                style={{ paddingVertical: 10 }}
              >
                {loadingMore ? (
                  <ActivityIndicator color={eliteForgeColors.emerald} />
                ) : (
                  <Text
                    color={eliteForgeColors.emerald}
                    fontSize={13}
                    fontWeight="700"
                    textAlign="center"
                  >
                    {translate("feedScreen:commentsLoadMore")}
                  </Text>
                )}
              </Pressable>
            ) : null}
          </ScrollView>

          <XStack
            paddingHorizontal={16}
            paddingTop={10}
            borderTopWidth={1}
            borderTopColor="rgba(85,85,85,0.7)"
            gap={8}
            alignItems="center"
          >
            <TextField
              value={draft}
              onChangeText={setDraft}
              placeholder={translate("feedScreen:commentsPlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.35)"
              containerStyle={{ flex: 1 }}
              inputWrapperStyle={{
                borderWidth: 1,
                borderColor: "#555555",
                borderRadius: 20,
                backgroundColor: "#2e2e2e",
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
              style={{ color: "#FFFFFF", fontSize: 14 }}
            />
            <Pressable
              onPress={handleSend}
              disabled={draft.trim().length === 0 || sending}
              accessibilityRole="button"
              accessibilityLabel={translate("feedScreen:commentsSend")}
              style={{ opacity: draft.trim().length === 0 || sending ? 0.4 : 1 }}
            >
              <XStack
                width={36}
                height={36}
                borderRadius={18}
                backgroundColor={eliteForgeColors.emerald}
                alignItems="center"
                justifyContent="center"
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#1a1a1a" />
                ) : (
                  <Ionicons name="send" size={16} color="#1a1a1a" />
                )}
              </XStack>
            </Pressable>
          </XStack>
        </YStack>
      </View>
    </Modal>
  )
}
