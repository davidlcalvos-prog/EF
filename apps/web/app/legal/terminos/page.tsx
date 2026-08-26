import type { Metadata } from 'next'
import { LegalPlaceholderPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Términos de uso — Elite Forge',
}

export default function TerminosPage() {
  return <LegalPlaceholderPage title="Términos de uso" />
}
