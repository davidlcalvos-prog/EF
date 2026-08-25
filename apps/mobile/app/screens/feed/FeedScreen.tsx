import { useCallback, useState } from "react"
import { ActivityIndicator, Pressable, RefreshControl, StatusBar } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Drawer } from "react-native-drawer-layout"
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated"
import { Text, XStack, YStack } from "tamagui"

import { useAuth } from "@/context/AuthContext"
import type { FeedPost } from "@/data/mockFeedPosts"
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"
import { isRTL } from "@/i18n"
import { translate } from "@/i18n/translate"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { eliteForgeColors } from "@/theme/eliteForgeColors"

import { FeedCommentsSheet } from "./components/FeedCommentsSheet"
import { FeedComposeModal } from "./components/FeedComposeModal"
import { FeedComposer } from "./components/FeedComposer"
import { FeedDrawer, type FeedDrawerItemId } from "./components/FeedDrawer"
import { FeedNavbar } from "./components/FeedNavbar"
import { FeedPostCard } from "./components/FeedPostCard"
import { FeedShareSheet } from "./components/FeedShareSheet"
import { useFeed } from "./useFeed"

export function FeedScreen(_props: AppStackScreenProps<"Feed">) {
  const navigation = useNavigation<AppStackScreenProps<"Feed">["navigation"]>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [sharePost, setSharePost] = useState<FeedPost | null>(null)
  const [commentsPost, setCommentsPost] = useState<FeedPost | null>(null)
  const { logout } = useAuth()
  const { horizontalPadding, insets, contentMaxWidth } = useResponsiveLayout()
  const scrollY = useSharedValue(0)

  const {
    posts,
    loading,
    refreshing,
    loadingMore,
    error,
    refresh,
    loadMore,
    createPost,
    toggleLike,
    deletePost,
    bumpCommentsCount,
  } = useFeed()

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const handleDrawerItem = useCallback(
    (id: FeedDrawerItemId) => {
      closeDrawer()
      if (id === "profile") {
        navigation.navigate("Profile")
        return
      }
      if (id === "groups") {
        navigation.navigate("Groups")
        return
      }
      if (id === "matches") {
        navigation.navigate("Matches")
        return
      }
      if (id === "tournaments") {
        navigation.navigate("Tournaments")
        return
      }
      navigation.navigate("Reservations")
    },
    [closeDrawer, navigation],
  )

  const handleProfilePress = useCallback(() => {
    navigation.navigate("Profile")
  }, [navigation])

  const handleLogout = useCallback(() => {
    closeDrawer()
    logout()
  }, [closeDrawer, logout])

  const handleComposerPress = useCallback(() => {
    setComposeOpen(true)
  }, [])

  const handleShare = useCallback((post: FeedPost) => {
    setSharePost(post)
  }, [])

  const handleOpenComments = useCallback((post: FeedPost) => {
    setCommentsPost(post)
  }, [])

  const renderPost = useCallback(
    ({ item }: { item: FeedPost }) => {
      return (
        <FeedPostCard
          post={item}
          onShare={handleShare}
          onToggleLike={toggleLike}
          onDeletePost={deletePost}
          onOpenComments={handleOpenComments}
        />
      )
    },
    [handleShare, toggleLike, deletePost, handleOpenComments],
  )

  const listHeader = useCallback(
    () => (
      <YStack width="100%" maxWidth={contentMaxWidth} alignSelf="center">
        <FeedComposer onPress={handleComposerPress} />
      </YStack>
    ),
    [contentMaxWidth, handleComposerPress],
  )

  const listFooter = useCallback(() => {
    if (!loadingMore) return null
    return (
      <YStack paddingVertical={16} alignItems="center">
        <ActivityIndicator color={eliteForgeColors.emerald} />
      </YStack>
    )
  }, [loadingMore])

  const listEmpty = useCallback(() => {
    if (loading) {
      return (
        <YStack paddingVertical={48} alignItems="center">
          <ActivityIndicator color={eliteForgeColors.emerald} />
        </YStack>
      )
    }
    if (error) {
      return (
        <YStack paddingVertical={48} alignItems="center" gap={12}>
          <Text color="rgba(255,255,255,0.6)" fontSize={14} textAlign="center">
            {translate("feedScreen:loadError")}
          </Text>
          <Pressable onPress={refresh} accessibilityRole="button">
            <XStack
              backgroundColor={eliteForgeColors.emerald}
              borderRadius={12}
              paddingHorizontal={18}
              paddingVertical={10}
            >
              <Text color="#1a1a1a" fontWeight="700" fontSize={13}>
                {translate("feedScreen:retry")}
              </Text>
            </XStack>
          </Pressable>
        </YStack>
      )
    }
    return (
      <YStack paddingVertical={48} alignItems="center">
        <Text color="rgba(255,255,255,0.5)" fontSize={14}>
          {translate("feedScreen:emptyFeed")}
        </Text>
      </YStack>
    )
  }, [loading, error, refresh])

  return (
    <YStack flex={1} backgroundColor={eliteForgeColors.carbon}>
      <StatusBar barStyle="light-content" backgroundColor={eliteForgeColors.carbon} />

      <Drawer
        open={drawerOpen}
        onOpen={openDrawer}
        onClose={closeDrawer}
        drawerPosition={isRTL ? "right" : "left"}
        drawerType="front"
        drawerStyle={{ width: "82%" }}
        renderDrawerContent={() => (
          <FeedDrawer
            onClose={closeDrawer}
            onItemPress={handleDrawerItem}
            onLogout={handleLogout}
          />
        )}
      >
        <YStack flex={1} paddingTop={insets.top}>
          <FeedNavbar
            onMenuPress={openDrawer}
            onProfilePress={handleProfilePress}
            scrollY={scrollY}
          />

          <Animated.FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderPost}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            ListEmptyComponent={listEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={eliteForgeColors.emerald}
              />
            }
            onEndReached={() => loadMore()}
            onEndReachedThreshold={0.4}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingTop: 12,
              paddingBottom: insets.bottom + 24,
              maxWidth: contentMaxWidth,
              width: "100%",
              alignSelf: "center",
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
          />
        </YStack>
      </Drawer>

      <FeedComposeModal
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPost={createPost}
      />
      <FeedShareSheet
        visible={sharePost !== null}
        authorName={sharePost?.authorName}
        onClose={() => setSharePost(null)}
      />
      <FeedCommentsSheet
        visible={commentsPost !== null}
        post={commentsPost}
        onClose={() => setCommentsPost(null)}
        onCommentsCountChange={bumpCommentsCount}
      />
    </YStack>
  )
}
