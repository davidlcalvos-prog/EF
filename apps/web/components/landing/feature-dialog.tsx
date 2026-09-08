'use client'

import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface LandingFeature {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  /** Una frase: qué es, tal cual funciona en la app. */
  tagline: string
  /** Pasos en el orden en que el usuario los vive en la app. Sin inventar. */
  steps: { title: string; text: string }[]
  /** Aclaración honesta (límites, quién puede, qué no hace). */
  note?: string
  accent?: 'emerald' | 'orange'
}

/**
 * Modal explicativo de una función de la app. Todo lo que dice tiene que
 * existir en apps/mobile — es la continuación del lote de veracidad, no un
 * lugar para prometer más. Cierra con el CTA a registro.
 */
export function FeatureDialog({
  feature,
  open,
  onOpenChange,
}: {
  feature: LandingFeature | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const accent = feature?.accent === 'orange' ? 'ef-chip-orange' : ''
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {feature && (
          <>
            <DialogHeader className="sm:flex-row sm:items-start sm:gap-4 sm:text-left">
              <span className={`ef-chip mx-auto h-12 w-12 shrink-0 sm:mx-0 ${accent}`}>
                <feature.icon className="h-6 w-6" />
              </span>
              <div className="flex flex-col gap-2">
                <DialogTitle>{feature.title}</DialogTitle>
                <DialogDescription>{feature.tagline}</DialogDescription>
              </div>
            </DialogHeader>

            <ol className="mt-2 space-y-3">
              {feature.steps.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-xs font-bold text-primary ring-1 ring-primary/40">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {step.title}
                    </span>
                    <span className="block text-sm leading-relaxed text-muted-foreground">
                      {step.text}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            {feature.note && (
              <p className="rounded-xl bg-black/25 px-4 py-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-white/5">
                {feature.note}
              </p>
            )}

            <DialogFooter className="mt-2">
              <DialogClose
                render={<Button variant="ghost" className="font-heading uppercase tracking-wide" />}
              >
                Seguir mirando
              </DialogClose>
              <Button
                render={<Link href="/auth/sign-up" />}
                className="ef-cta font-heading font-semibold uppercase tracking-wide"
              >
                Crear cuenta gratis <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
