import { Logo } from '@/components/logo'
import { LandingBackground } from '@/components/landing/landing-background'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <LandingBackground />
      <div className="relative z-10 flex min-h-screen flex-col px-4">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between py-4 sm:px-2">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-md transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Volver
          </Link>
          <Link href="/" className="inline-flex items-center">
            <Logo className="[&_img]:h-9" />
          </Link>
        </div>
        <main className="flex flex-1 items-center justify-center pb-16 pt-4">
          <div className="w-full max-w-md">
            <div className="ef-card overflow-hidden rounded-2xl">
              <div className="ef-split-accent" aria-hidden />
              <div className="p-6 sm:p-8">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
