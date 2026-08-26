'use client'

import { login } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 254) {
      setError('Introduce un correo electrónico válido.')
      setIsLoading(false)
      return
    }

    if (password.length < 8 || password.length > 72) {
      setError('La contraseña debe tener entre 8 y 72 caracteres.')
      setIsLoading(false)
      return
    }

    try {
      await login({
        email: normalizedEmail,
        password,
      })
      setError(
        'Los jugadores usan la app móvil de Elite Forge. Descárgala desde la landing.',
      )
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Correo o contraseña incorrectos.')
        } else if (err.status === 429) {
          setError('Demasiados intentos. Espera un momento e inténtalo de nuevo.')
        } else {
          setError(err.message)
        }
      } else {
        setError(
          'No se pudo conectar con el servidor. ¿Está el backend activo en el puerto 3000?',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-panel">
      <div className="mb-8 text-center">
        <p className="font-heading text-xs font-medium uppercase tracking-[0.3em] text-primary">
          Elite Forge
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
          Bienvenido de vuelta
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inicia sesión para seguir forjando tu legado
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          className="ef-cta h-11 w-full font-heading font-semibold uppercase tracking-wide"
          disabled={isLoading}
        >
          {isLoading ? 'Entrando...' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link
          href="/auth/sign-up"
          className="font-medium text-primary hover:underline"
        >
          Regístrate gratis
        </Link>
      </p>
    </div>
  )
}
