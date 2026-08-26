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

export default function HomePage() {
  return (
    // isolate: stacking context propio para que el fondo con z negativo quede
    // por encima del bg del body y debajo del contenido.
    <main className="isolate min-h-screen">
      <LandingBackground />
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
    </main>
  )
}
