import Image from 'next/image'

/**
 * Solo imagen. El enlace lo pone el padre (`Link`) para no anidar `<a>`.
 *
 * Lockup horizontal (emblema + wordmark) generado por
 * scripts/generate-brand-assets.js a partir del logo maestro: a 56-64 px de
 * alto el texto "ELITE FORGE" se lee, cosa que el PNG cuadrado de 1024² con el
 * wordmark al pie no lograba a 48 px. `[&_img]:h-*` desde el padre sigue
 * funcionando (un solo <img>).
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/brand/elite-forge-lockup.png"
        alt="Elite Forge"
        width={520}
        height={256}
        className="h-14 w-auto object-contain sm:h-16"
        priority
      />
    </span>
  )
}
