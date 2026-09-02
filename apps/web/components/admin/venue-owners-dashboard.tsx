'use client'

import { useState, useTransition } from 'react'
import { Copy, Plus, RefreshCw, UserRound } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createVenueOwnerAction,
  setVenueOwnerStatusAction,
} from '@/app/admin/(portal)/duenos-de-cancha/actions'
import type { VenueOwner } from '@/lib/dal/admin/venue-owners'

/** Aleatoria de 12: letras (sin ambiguas), dígitos y símbolos — cumple letra+número. */
function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789#$%&*'
  // Regenerar hasta que tenga letra Y número (política del backend) —
  // sin sufijos fijos que debiliten la aleatoriedad.
  for (;;) {
    const bytes = new Uint32Array(12)
    crypto.getRandomValues(bytes)
    const candidate = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
    if (/[A-Za-z]/.test(candidate) && /\d/.test(candidate)) {
      return candidate
    }
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function VenueOwnersDashboard({
  initialOwners,
  loadError,
}: {
  initialOwners: VenueOwner[]
  loadError: string | null
}) {
  const [owners, setOwners] = useState(initialOwners)
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setError(null)
  }

  const handleCreate = () => {
    setError(null)
    startTransition(async () => {
      try {
        const owner = await createVenueOwnerAction({
          name: name.trim(),
          email: email.trim(),
          password,
        })
        setOwners((prev) => [owner, ...prev])
        // La contraseña temporal se muestra UNA sola vez — no se vuelve a ver.
        setCreatedPassword(password)
        setCreatedEmail(owner.email)
        setCopied(false)
        resetForm()
        setFormOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo crear el dueño.')
      }
    })
  }

  const handleToggle = (owner: VenueOwner) => {
    setError(null)
    startTransition(async () => {
      try {
        const updated = await setVenueOwnerStatusAction(owner.id, !owner.estado)
        setOwners((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.')
      }
    })
  }

  const copyPassword = async () => {
    if (!createdPassword) return
    try {
      await navigator.clipboard.writeText(createdPassword)
      setCopied(true)
    } catch {
      /* el navegador puede bloquear el clipboard; la clave sigue visible */
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Dueños de cancha"
        subtitle="Alta y gestión de Empresarios — no se registran solos: los das de alta acá y les comunicás la contraseña temporal."
        breadcrumbs={[{ label: 'Resumen', href: '/admin' }, { label: 'Dueños de cancha' }]}
      />

      {loadError && (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {createdPassword && (
        <div className="mb-6 rounded-xl border border-primary/40 bg-primary/10 p-4">
          <p className="text-sm font-semibold text-primary">
            Dueño creado: {createdEmail}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Copiá la contraseña temporal ahora y envíasela — <strong>no se vuelve a mostrar</strong>.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-foreground">
              {createdPassword}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copyPassword}>
              <Copy className="mr-1 h-4 w-4" />
              {copied ? 'Copiada' : 'Copiar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreatedPassword(null)}
            >
              Entendido, ocultar
            </Button>
          </div>
        </div>
      )}

      <div className="mb-6">
        {formOpen ? (
          <div className="rounded-xl border border-white/10 bg-black/30 p-5">
            <p className="mb-4 text-sm font-semibold text-foreground">Nuevo dueño de cancha</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="owner-name">Nombre y apellido</Label>
                <Input
                  id="owner-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre Apellido"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="owner-email">Correo</Label>
                <Input
                  id="owner-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dueno@ejemplo.com"
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="owner-password">Contraseña temporal</Label>
                <div className="flex gap-2">
                  <Input
                    id="owner-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8, con letra y número"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPassword(generateTempPassword())}
                  >
                    <RefreshCw className="mr-1 h-4 w-4" />
                    Generar
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                onClick={handleCreate}
                disabled={pending || !name.trim() || !email.trim() || password.length < 8}
              >
                {pending ? 'Creando…' : 'Crear dueño'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  resetForm()
                  setFormOpen(false)
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Nuevo dueño de cancha
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Complejo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {owners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <UserRound className="mx-auto mb-2 h-6 w-6 opacity-60" />
                  Todavía no hay dueños de cancha.
                </td>
              </tr>
            ) : (
              owners.map((owner) => (
                <tr key={owner.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{owner.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{owner.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {owner.venueName ?? <span className="opacity-60">Sin complejo</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        owner.estado
                          ? 'rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary'
                          : 'rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive'
                      }
                    >
                      {owner.estado ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(owner.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => handleToggle(owner)}
                    >
                      {owner.estado ? 'Desactivar' : 'Activar'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
