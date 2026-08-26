import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter, Geist_Mono } from 'next/font/google'
import { eliteForgeColors } from '@/lib/theme/elite-forge'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ELITE FORGE — Del Amateur al Pro',
  description:
    'La app que transforma a jugadores de fútbol amateur en profesionales. Mide tu rendimiento, organiza torneos, encuentra partidos y reserva canchas.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: eliteForgeColors.carbon,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
