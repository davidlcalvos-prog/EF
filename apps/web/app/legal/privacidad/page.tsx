import type { Metadata } from 'next'
import { LegalPlaceholderPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Política de privacidad — Elite Forge',
}

export default function PrivacidadPage() {
  return <LegalPlaceholderPage title="Política de privacidad" />
}
