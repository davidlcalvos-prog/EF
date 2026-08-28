export type FeedPostKind = "player" | "eliteAd"

export type FeedMediaType = "none" | "image" | "video"

export interface FeedPost {
  id: string
  kind: FeedPostKind
  /** Id real del autor (posts del backend) — usado para "es mío" (borrar, etc). Ausente en anuncios. */
  authorId?: string
  authorName: string
  authorHandle: string
  authorAvatarColor: string
  /** Foto real de perfil (posts reales del backend) — null/ausente en anuncios. */
  authorAvatarPhoto?: string | null
  /** Etiqueta curada ("Sponsored") — solo se usa si no hay `createdAt`. */
  timeAgoKey: string
  /** ISO — presente en posts reales del backend, usado para tiempo relativo real. */
  createdAt?: string
  content: string
  /** true solo en los anuncios mock: `content` es una clave de traducción, no texto literal. */
  contentIsTranslationKey?: boolean
  mediaType: FeedMediaType
  mediaUrl?: string
  likes: number
  comments: number
  shares: number
  /** Presente en posts reales del backend. */
  likedByMe?: boolean
  /** Solo anuncios Elite Forge */
  adBadgeKey?: string
  adCtaKey?: string
}

export const MOCK_FEED_POSTS: FeedPost[] = [
  {
    id: "ad-1",
    kind: "eliteAd",
    authorName: "Elite Forge",
    authorHandle: "@eliteforge",
    authorAvatarColor: "#00CEC8",
    timeAgoKey: "feedScreen:timeSponsored",
    content: "feedScreen:adPost1",
    contentIsTranslationKey: true,
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    likes: 0,
    comments: 0,
    shares: 0,
    adBadgeKey: "feedScreen:adBadge",
    adCtaKey: "feedScreen:adCta",
  },
  {
    id: "post-1",
    kind: "player",
    authorName: "Carlos Méndez",
    authorHandle: "@carlos10",
    authorAvatarColor: "#FF8C00",
    timeAgoKey: "feedScreen:time2h",
    content: "feedScreen:post1",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
    likes: 124,
    comments: 18,
    shares: 6,
  },
  {
    id: "post-2",
    kind: "player",
    authorName: "Laura Vega",
    authorHandle: "@laurav",
    authorAvatarColor: "#7B68EE",
    timeAgoKey: "feedScreen:time5h",
    content: "feedScreen:post2",
    mediaType: "none",
    likes: 89,
    comments: 12,
    shares: 3,
  },
  {
    id: "ad-2",
    kind: "eliteAd",
    authorName: "Elite Forge",
    authorHandle: "@eliteforge",
    authorAvatarColor: "#00CEC8",
    timeAgoKey: "feedScreen:timeSponsored",
    content: "feedScreen:adPost2",
    contentIsTranslationKey: true,
    mediaType: "none",
    likes: 0,
    comments: 0,
    shares: 0,
    adBadgeKey: "feedScreen:adBadge",
    adCtaKey: "feedScreen:adCtaLearn",
  },
  {
    id: "post-3",
    kind: "player",
    authorName: "Diego Ríos",
    authorHandle: "@drioss",
    authorAvatarColor: "#2ECC71",
    timeAgoKey: "feedScreen:time1d",
    content: "feedScreen:post3",
    mediaType: "video",
    mediaUrl: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80",
    likes: 256,
    comments: 42,
    shares: 19,
  },
  {
    id: "post-4",
    kind: "player",
    authorName: "Ana Torres",
    authorHandle: "@anatorres",
    authorAvatarColor: "#E74C3C",
    timeAgoKey: "feedScreen:time2d",
    content: "feedScreen:post4",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
    likes: 198,
    comments: 31,
    shares: 11,
  },
]
