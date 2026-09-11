'use client'

import { resetPassword } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

const PASSWORD_COMPLEXITY = /^(?=.*[A-Za-z])(?=.*\d).+$/

/**
 * Canje del enlace del correo (2026-09-11): /auth/reset-password?token=…
 * Mismas reglas de contraseña que el registro. Termina en una pantalla de
 * éxito con el botón de descargar la app, como "Cuenta confirmada".
 * `useSearchParams` obliga a un límite de Suspense para que `next build`
 * pueda prerenderizar la página.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [linkInvalid, setLinkInvalid] = useState(token.length < 20)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password.length < 8 || password.length > 72) {
      setError('La contraseña debe tener entre 8 y 72 caracteres.')
      setIsLoading(false)
      return
    }
    if (!PASSWORD_COMPLEXITY.test(password)) {
      setError('La contraseña debe incluir al menos una letra y un número.')
      setIsLoading(false)
      return
    }
    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden.')
      setIsLoading(false)
      return
    }

    try {
      await resetPassword({ token, password })
      setDone(true)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setLinkInvalid(true)
        } else if (err.status === 429) {
          setError('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.')
        } else {
          setError(err.message)
        }
      } else {
        setError('No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
          ¡Contraseña actualizada!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Ya puedes entrar con tu contraseña nueva. Abre la app de Elite Forge e inicia
          sesión con el mismo email.
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

  if (linkInvalid) {
    return (
      <div className="text-center">
        <h1 className="mt-2 font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
          Enlace inválido o vencido
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          El enlace para cambiar la contraseña ya se usó, venció (dura 30 minutos) o no
          es correcto. Pide uno nuevo y usa el correo más reciente.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button
            render={<Link href="/auth/forgot-password" />}
            className="ef-cta font-heading font-semibold uppercase tracking-wide"
          >
            Pedir un enlace nuevo
          </Button>
          <Button
            render={<Link href="/auth/login" />}
            variant="outline"
            className="font-heading font-medium uppercase tracking-wide"
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-panel">
      <div className="mb-8 text-center">
        <p className="font-heading text-xs font-medium uppercase tracking-[0.3em] text-primary">
          Elite Forge
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
          Elige una contraseña nueva
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre 8 y 72 caracteres, con al menos una letra y un número
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña nueva</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeatPassword">Repite la contraseña</Label>
          <Input
            id="repeatPassword"
            type="password"
            required
            autoComplete="new-password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="ef-cta h-11 w-full font-heading font-semibold uppercase tracking-wide"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Guardar contraseña'}
        </Button>
      </form>
    </div>
  )
}
