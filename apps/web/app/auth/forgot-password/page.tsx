'use client'

import { forgotPassword } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * "Olvidé mi contraseña" (2026-09-11). Mismo patrón que login/sign-up.
 * El backend responde 200 exista o no el correo (anti-enumeración), así que
 * esta pantalla muestra el MISMO mensaje de éxito en todos los casos; solo
 * distingue 429 (demasiados intentos) y error de red.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 254) {
      setError('Introduce un correo electrónico válido.')
      setIsLoading(false)
      return
    }

    try {
      await forgotPassword({ email: normalizedEmail })
      setSent(true)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.')
        } else if (err.status === 400) {
          setError('Introduce un correo electrónico válido.')
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

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <MailCheck className="h-8 w-8 text-primary" />
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
          Revisa tu correo
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Si existe una cuenta con ese correo, te enviamos un enlace para elegir una
          contraseña nueva. Vence en 30 minutos. Revisa también la carpeta de spam.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button
            render={<Link href="/auth/login" />}
            className="ef-cta font-heading font-semibold uppercase tracking-wide"
          >
            Volver a iniciar sesión
          </Button>
          <Button
            variant="outline"
            className="font-heading font-medium uppercase tracking-wide"
            onClick={() => setSent(false)}
          >
            Usar otro correo
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
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escribe el correo de tu cuenta y te enviamos un enlace para elegir una nueva
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="ef-cta h-11 w-full font-heading font-semibold uppercase tracking-wide"
          disabled={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar enlace'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Te acordaste?{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
