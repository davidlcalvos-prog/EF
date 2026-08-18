import { Alert, Image, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Text, XStack, YStack } from "tamagui"

import { useAuth } from "@/context/AuthContext"
import type { FeedPost } from "@/data/mockFeedPosts"
import { useInteractiveMotion } from "@/hooks/useInteractiveMotion"
import type { TxKeyPath } from "@/i18n"
import { translate } from "@/i18n/translate"
import { formatRelativeTime } from "@/utils/formatDate"

import { FeedAvatar } from "./FeedAvatar"

export interface FeedPostCardProps {
  post: FeedPost
  onShare?: (post: FeedPost) => void
  onToggleLike?: (postId: string) => void
  onDeletePost?: (postId: string) => void
  onOpenComments?: (post: FeedPost) => void
}

function ActionButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  active?: boolean
  onPress?: () => void
}) {
  const motion = useInteractiveMotion("button")
  const color = active ? "#E74C3C" : "rgba(255,255,255,0.75)"

  return (
    <Pressable
      onPress={onPress}
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      style={{ flex: 1 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <XStack flex={1} alignItems="center" justifyContent="center" paddingVertical={10} gap={6}>
        <Ionicons name={icon} size={18} color={color} />
        <Text color={color} fontSize={13} fontWeight="600" numberOfLines={1}>
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}

export function FeedPostCard({
  post,
  onShare,
  onToggleLike,
  onDeletePost,
  onOpenComments,
}: FeedPostCardProps) {
  const { authUserId } = useAuth()
  const isAd = post.kind === "eliteAd"
  const isOwnPost = !isAd && !!post.authorId && post.authorId === authUserId
  const content = post.contentIsTranslationKey
    ? translate(post.content as TxKeyPath)
    : post.content
  const timeLabel = post.createdAt
    ? formatRelativeTime(post.createdAt)
    : translate(post.timeAgoKey as TxKeyPath)
  const motion = useInteractiveMotion("card")

  const handleDeletePress = () => {
    Alert.alert(
      translate("feedScreen:deletePostConfirmTitle"),
      translate("feedScreen:deletePostConfirmMessage"),
      [
        { text: translate("feedScreen:composeCancel"), style: "cancel" },
        {
          text: translate("feedScreen:deleteConfirm"),
          style: "destructive",
          onPress: () => onDeletePost?.(post.id),
        },
      ],
    )
  }

  return (
    <Pressable
      onPressIn={motion.onPressIn}
      onPressOut={motion.onPressOut}
      onHoverIn={motion.onHoverIn}
      onHoverOut={motion.onHoverOut}
    >
      <YStack
        backgroundColor="#363636"
        borderRadius={14}
        borderWidth={1}
        borderColor={isAd ? "#00CEC8" : "#555555"}
        overflow="hidden"
        marginBottom={12}
      >
        {isAd ? (
          <XStack height={3}>
            <YStack flex={1} backgroundColor="#00CEC8" />
            <YStack flex={1} backgroundColor="#FF8C00" />
          </XStack>
        ) : null}

        <YStack padding={14} gap={12}>
          <XStack alignItems="center" gap={12}>
            <FeedAvatar label={post.authorName} color={post.authorAvatarColor} size={44} />
            <YStack flex={1} gap={2}>
              <XStack alignItems="center" gap={8}>
                <Text color="#FFFFFF" fontWeight="700" fontSize={15}>
                  {post.authorName}
                </Text>
                {isAd && post.adBadgeKey ? (
                  <XStack
                    backgroundColor="rgba(0, 206, 200, 0.15)"
                    borderRadius={6}
                    paddingHorizontal={8}
                    paddingVertical={2}
                  >
                    <Text color="#00CEC8" fontSize={11} fontWeight="700">
                      {translate(post.adBadgeKey as TxKeyPath)}
                    </Text>
                  </XStack>
                ) : null}
              </XStack>
              <Text color="rgba(255,255,255,0.5)" fontSize={13}>
                {post.authorHandle} · {timeLabel}
              </Text>
            </YStack>
            {isOwnPost ? (
              <Pressable
                onPress={handleDeletePress}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={translate("feedScreen:deletePost")}
              >
                <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.45)" />
              </Pressable>
            ) : null}
          </XStack>

          <Text color="#FFFFFF" fontSize={15} lineHeight={22}>
            {content}
          </Text>

          {post.mediaType !== "none" && post.mediaUrl ? (
            <YStack borderRadius={12} overflow="hidden" position="relative">
              <Image
                source={{ uri: post.mediaUrl }}
                style={{ width: "100%", height: 200 }}
                resizeMode="cover"
                accessibilityLabel={content}
              />
              {post.mediaType === "video" ? (
                <XStack
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="rgba(0,0,0,0.25)"
                >
                  <XStack
                    width={56}
                    height={56}
                    borderRadius={28}
                    backgroundColor="rgba(0,0,0,0.55)"
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={2}
                    borderColor="#FFFFFF"
                  >
                    <Ionicons name="play" size={26} color="#FFFFFF" style={{ marginLeft: 3 }} />
                  </XStack>
                </XStack>
              ) : null}
            </YStack>
          ) : null}

          {isAd && post.adCtaKey ? (
            <Pressable accessibilityRole="button">
              <XStack
                backgroundColor="#00CEC8"
                borderRadius={10}
                paddingVertical={12}
                alignItems="center"
                justifyContent="center"
              >
                <Text color="#424242" fontWeight="800" fontSize={14}>
                  {translate(post.adCtaKey as TxKeyPath)}
                </Text>
              </XStack>
            </Pressable>
          ) : null}

          {!isAd ? (
            <>
              <XStack
                paddingTop={4}
                borderTopWidth={1}
                borderTopColor="#555555"
                justifyContent="space-between"
              >
                <Text color="rgba(255,255,255,0.55)" fontSize={13}>
                  {translate("feedScreen:likesCount", { count: post.likes })}
                </Text>
                <Text color="rgba(255,255,255,0.55)" fontSize={13}>
                  {translate("feedScreen:commentsCount", {
                    count: post.comments,
                  })}
                </Text>
              </XStack>

              <XStack borderTopWidth={1} borderTopColor="#555555">
                <ActionButton
                  icon={post.likedByMe ? "heart" : "heart-outline"}
                  label={translate("feedScreen:like")}
                  active={post.likedByMe}
                  onPress={() => onToggleLike?.(post.id)}
                />
                <ActionButton
                  icon="chatbubble-outline"
                  label={translate("feedScreen:comment")}
                  onPress={() => onOpenComments?.(post)}
                />
                <ActionButton
                  icon="share-outline"
                  label={translate("feedScreen:share")}
                  onPress={() => onShare?.(post)}
                />
              </XStack>
            </>
          ) : null}
        </YStack>
      </YStack>
    </Pressable>
  )
}
