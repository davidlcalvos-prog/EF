import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Logo />
      <p className="mt-8 font-heading text-6xl font-bold italic text-primary">
        404
      </p>
      <h1 className="mt-4 font-heading text-2xl font-bold italic uppercase tracking-tight text-foreground">
        Esta página no existe
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        El enlace puede estar roto o la página fue movida.
      </p>
      <div className="mt-8 flex gap-3">
        <Button render={<Link href="/" />}>Ir al inicio</Button>
        <Button render={<Link href="/admin" />} variant="outline">
          Portal de dueños
        </Button>
      </div>
    </main>
  )
}
