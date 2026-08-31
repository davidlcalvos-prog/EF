import { translate } from "@/i18n/translate"
import type { CourtSizeApi } from "@/services/api"

export function courtSizeLabel(size: CourtSizeApi): string {
  return translate(`reservationsScreen:courtSize_${size}` as never)
}

const COURT_SIZE_TO_FORMAT: Record<CourtSizeApi, string> = {
  five: "5v5",
  six: "6v6",
  seven: "7v7",
  eight: "8v8",
  eleven: "11v11",
}

export function courtSizeToFormat(size: CourtSizeApi): string {
  return COURT_SIZE_TO_FORMAT[size]
}

export function mostCommonCourtSize(
  courtSizes: Array<{ size: CourtSizeApi; count: number }>,
): CourtSizeApi | null {
  if (courtSizes.length === 0) return null
  return courtSizes.reduce((best, entry) => (entry.count > best.count ? entry : best)).size
}
