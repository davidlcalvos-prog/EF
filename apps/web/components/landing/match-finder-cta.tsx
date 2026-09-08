'use client'

import { useState } from 'react'

import { BootsIcon } from '@/components/icons/football'
import { Button } from '@/components/ui/button'
import { FeatureDialog, type LandingFeature } from './feature-dialog'

/** Comodín "Cerca de mí" tal cual está en la app (Fase 11 y 11.1). */
const nearbyFeature: LandingFeature = {
  icon: BootsIcon,
  title: 'Comodín: cerca de mí',
  tagline:
    'Una lista, no un mapa: las vacantes que publican los grupos de tu municipio, para que te postules y juegues con gente nueva.',
  steps: [
    {
      title: 'Define tu zona',
      text: 'En tu perfil eliges tu municipio y activas "avisarme si falta un jugador cerca". Es opcional: si no lo activas, no recibes avisos.',
    },
    {
      title: 'Un grupo publica una vacante',
      text: 'Para un partido concreto, con la posición que necesitan (hasta 5 cupos por partido). Si tu posición favorita coincide, te llega la notificación.',
    },
    {
      title: 'Te postulas desde "Cerca de mí"',
      text: 'La lista muestra las vacantes abiertas de tu zona con fecha, hora y posición. Un toque y quedas postulado.',
    },
    {
      title: 'El grupo elige',
      text: 'El creador o un admin acepta a quien quiera. Si te aceptan, te avisamos y quedas en la planilla del partido.',
    },
  ],
  note: 'No hay mapa ni geolocalización: la zona es el municipio que eliges en tu perfil.',
}

/**
 * Botón de la sección "Cerca de mí": abre el modal explicativo en vez de
 * mandar directo a registro (el CTA a registro vive dentro del modal).
 */
export function MatchFinderCta() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        aria-haspopup="dialog"
        className="ef-cta mt-6 h-12 px-6 font-heading font-semibold uppercase tracking-wide"
      >
        <BootsIcon className="mr-1 h-5 w-5" />
        Cómo funciona el comodín
      </Button>
      <FeatureDialog feature={nearbyFeature} open={open} onOpenChange={setOpen} />
    </>
  )
}
