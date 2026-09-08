import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/landing-nav'
import { LandingBackground } from '@/components/landing/landing-background'
import { Hero } from '@/components/landing/hero'
import { PerformanceSection } from '@/components/landing/performance-section'
import { TournamentsSection } from '@/components/landing/tournaments-section'
import { MatchFinderSection } from '@/components/landing/match-finder-section'
import { CommunitySection } from '@/components/landing/community-section'
import { CourtsSection } from '@/components/landing/courts-section'
import { DownloadSection } from '@/components/landing/download-section'
import { FinalCta, LandingFooter } from '@/components/landing/final-cta'

// El título del layout raíz sigue con el slogan viejo; ese archivo es
// compartido con las páginas legales y no se toca. La landing define el suyo.
export const metadata: Metadata = {
  title: 'ELITE FORGE — El talento no nace. Se forja.',
  description:
    'Tests físicos y de mentalidad que cargas tú, grupos, partidos internos y VS, comodín cerca de ti, reservas de canchas y campeonatos con rankings.',
}

export default function HomePage() {
  return (
    // Fondo en z-0 y contenido en z-10 explícito: el orden no depende de
    // ningún stacking context implícito.
    <main className="relative min-h-screen">
      <LandingBackground />
      <div className="relative z-10">
        <LandingNav />
        <Hero />
        <PerformanceSection />
        <TournamentsSection />
        <MatchFinderSection />
        <CommunitySection />
        <CourtsSection />
        <DownloadSection />
        <FinalCta />
        <LandingFooter />
      </div>
    </main>
  )
}
