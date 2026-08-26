'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminPortalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-2xl font-bold italic uppercase tracking-tight text-foreground">
        Algo salió mal
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ocurrió un error al cargar esta sección. Verifica que el backend esté
        activo e intenta de nuevo.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button type="button" onClick={reset}>
          Reintentar
        </Button>
        <Link
          href="/admin"
          className="text-sm font-medium text-primary hover:underline"
        >
          Volver al resumen
        </Link>
      </div>
    </div>
  )
}
