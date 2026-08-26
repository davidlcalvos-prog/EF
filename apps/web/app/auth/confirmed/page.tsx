import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ConfirmedPage() {
  return (
    <div className="text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </span>
      <h1 className="mt-6 font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
        ¡Cuenta confirmada!
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Tu cuenta está lista. Descarga la app de Elite Forge e inicia sesión con
        el mismo email y contraseña.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Button
          render={<Link href="/#descarga" />}
          className="ef-cta font-heading font-semibold uppercase tracking-wide"
        >
          Descargar app
        </Button>
        <Button
          render={<Link href="/" />}
          variant="outline"
          className="font-heading font-medium uppercase tracking-wide"
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  )
}
