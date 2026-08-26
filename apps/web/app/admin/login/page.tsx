'use client'

import { login } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { getAdminHomePath, isAdminRole } from '@/lib/admin/roles'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const accessDenied = searchParams.get('error') === 'access_denied'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      })

      if (!isAdminRole(result.user.role)) {
        await fetch('/api/session/logout', { method: 'POST' })
        setError(
          'Esta cuenta no tiene acceso al portal de administración. Usa la app móvil o contacta soporte.',
        )
        return
      }

      await fetch('/api/session/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: result.accessToken }),
      })

      router.push(getAdminHomePath(result.user.role))
      router.refresh()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? 'Correo o contraseña incorrectos.'
            : err.message,
        )
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Volver a Elite Forge
        </Link>
        <div className="mb-8 text-center">
          <p className="font-heading text-xs font-medium uppercase tracking-[0.3em] text-primary">
            Elite Forge Admin
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold italic uppercase tracking-tight text-foreground">
            Portal de gestión
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceso para administradores de canchas y empresarios
          </p>
        </div>

        {accessDenied && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            No tienes permisos para acceder al portal de administración.
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
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
            className="h-11 w-full font-heading font-semibold uppercase tracking-wide"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar al portal'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Todavía no tenés cuenta de dueño de cancha? Escribinos a{' '}
          <a
            href="mailto:canchas@eliteforge.app"
            className="font-medium text-primary hover:underline"
          >
            canchas@eliteforge.app
          </a>
        </p>
      </div>
    </div>
  )
}
