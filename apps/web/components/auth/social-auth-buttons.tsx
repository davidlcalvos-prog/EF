'use client'

import { externalBrandColors } from '@/lib/theme/elite-forge'

type SocialProvider = 'google' | 'facebook'

interface SocialAuthButtonsProps {
  onProviderClick?: (provider: SocialProvider) => void
  disabled?: boolean
  layout?: 'row' | 'column'
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill={externalBrandColors.googleBlue}
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill={externalBrandColors.googleGreen}
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill={externalBrandColors.googleYellow}
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill={externalBrandColors.googleRed}
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="#fff">
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.03H7.9v-2.9h2.4V9.84c0-2.37 1.4-3.68 3.56-3.68 1.03 0 2.11.18 2.11.18v2.32h-1.19c-1.17 0-1.54.73-1.54 1.48v1.78h2.62l-.42 2.9h-2.2V22c4.78-.75 8.44-4.91 8.44-9.93z" />
    </svg>
  )
}

export function SocialAuthButtons({
  onProviderClick,
  disabled = false,
  layout = 'column',
}: SocialAuthButtonsProps) {
  return (
    <div
      className={
        layout === 'row'
          ? 'flex shrink-0 flex-row gap-2'
          : 'flex shrink-0 flex-col gap-2'
      }
      role="group"
      aria-label="Registro social"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onProviderClick?.('facebook')}
        aria-label="Continuar con Facebook"
        className="btn-facebook flex size-11 items-center justify-center rounded-xl text-white transition disabled:opacity-50"
      >
        <FacebookIcon className="size-5" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onProviderClick?.('google')}
        aria-label="Continuar con Gmail"
        className="flex size-11 items-center justify-center rounded-xl border border-border bg-white transition hover:bg-white/90 disabled:opacity-50"
      >
        <GoogleIcon className="size-5" />
      </button>
    </div>
  )
}
