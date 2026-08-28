import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { MOCK_FEED_POSTS, type FeedPost } from "@/data/mockFeedPosts"
import { api, type PostApiDto } from "@/services/api"
import type { GeneralApiProblem } from "@/services/api/apiProblem"

const PAGE_SIZE = 20
/** Anuncios Elite Forge siguen curados a mano (no vienen del backend, ver Fase 5) — se intercala uno cada 4 posts reales. */
const AD_INTERVAL = 4
const ELITE_ADS = MOCK_FEED_POSTS.filter((post) => post.kind === "eliteAd")

const AVATAR_PALETTE = ["#00CEC8", "#FF8C00", "#7B68EE", "#2ECC71", "#E74C3C"]

function pickAvatarColor(seed: string) {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

function mapPostToFeedPost(post: PostApiDto): FeedPost {
  return {
    id: post.id,
    kind: "player",
    authorId: post.authorId,
    authorName: post.authorName,
    authorHandle: post.authorHandle,
    authorAvatarColor: pickAvatarColor(post.authorId),
    authorAvatarPhoto: post.authorAvatarBase64,
    timeAgoKey: "",
    createdAt: post.createdAt,
    content: post.content,
    mediaType: post.mediaType,
    mediaUrl: post.mediaUrl ?? undefined,
    likes: post.likesCount,
    comments: post.commentsCount,
    shares: 0,
    likedByMe: post.likedByMe,
  }
}

/**
 * Composición del Feed real: pide/pagina posts del backend (Fase 5) e intercala
 * client-side los anuncios curados de `MOCK_FEED_POSTS`. Sin gestor de estado
 * global en el proyecto — mismo criterio que `useProfileStats`/`usePlayerProfile`.
 */
export function useFeed() {
  const [realPosts, setRealPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<GeneralApiProblem | null>(null)
  const pageRef = useRef(1)
  const inFlightRef = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setRefreshing(true)
    setError(null)

    const result = await api.listFeedPosts(1, PAGE_SIZE)
    if (result.kind === "ok") {
      setRealPosts(result.posts.map(mapPostToFeedPost))
      setHasMore(result.posts.length === PAGE_SIZE)
      pageRef.current = 1
    } else {
      setError(result)
    }

    setRefreshing(false)
    setLoading(false)
    inFlightRef.current = false
  }, [])

  useEffect(() => {
    refresh()
    // Solo en el montaje inicial — refresh()/loadMore() se llaman explícitamente después.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || !hasMore) return
    inFlightRef.current = true
    setLoadingMore(true)

    const nextPage = pageRef.current + 1
    const result = await api.listFeedPosts(nextPage, PAGE_SIZE)
    if (result.kind === "ok") {
      setRealPosts((prev) => [...prev, ...result.posts.map(mapPostToFeedPost)])
      setHasMore(result.posts.length === PAGE_SIZE)
      pageRef.current = nextPage
    }
    // Error en loadMore no reemplaza el feed ya cargado — el usuario puede reintentar con scroll.

    setLoadingMore(false)
    inFlightRef.current = false
  }, [hasMore])

  const createPost = useCallback(async (content: string): Promise<boolean> => {
    const trimmed = content.trim()
    if (!trimmed) return false

    const result = await api.createFeedPost(trimmed)
    if (result.kind !== "ok") return false

    setRealPosts((prev) => [mapPostToFeedPost(result.post), ...prev])
    return true
  }, [])

  const toggleLike = useCallback(async (postId: string) => {
    let previous: FeedPost | undefined
    setRealPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post
        previous = post
        const likedByMe = !post.likedByMe
        return { ...post, likedByMe, likes: post.likes + (likedByMe ? 1 : -1) }
      }),
    )

    const result = await api.toggleFeedLike(postId)
    if (result.kind !== "ok" && previous) {
      const reverted = previous
      setRealPosts((prev) => prev.map((post) => (post.id === postId ? reverted : post)))
    }
  }, [])

  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    const result = await api.deleteFeedPost(postId)
    if (result.kind !== "ok") return false

    setRealPosts((prev) => prev.filter((post) => post.id !== postId))
    return true
  }, [])

  /** Usado por la hoja de comentarios para reflejar altas/bajas sin recargar el feed entero. */
  const bumpCommentsCount = useCallback((postId: string, delta: number) => {
    setRealPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, comments: post.comments + delta } : post,
      ),
    )
  }, [])

  const posts = useMemo(() => {
    if (realPosts.length === 0) return []
    const result: FeedPost[] = []
    realPosts.forEach((post, index) => {
      result.push(post)
      if (ELITE_ADS.length > 0 && (index + 1) % AD_INTERVAL === 0) {
        const ad = ELITE_ADS[Math.floor(index / AD_INTERVAL) % ELITE_ADS.length]
        result.push({ ...ad, id: `${ad.id}-${index}` })
      }
    })
    return result
  }, [realPosts])

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    createPost,
    toggleLike,
    deletePost,
    bumpCommentsCount,
  }
}
