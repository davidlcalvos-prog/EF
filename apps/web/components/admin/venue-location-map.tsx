'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Los assets por defecto de Leaflet no resuelven bajo el bundler de Next —
// se los damos explícitos desde el paquete. Según el bundler, el import de un
// PNG llega como StaticImageData ({src}) o como string directo.
function assetUrl(asset: unknown): string {
  return typeof asset === 'string' ? asset : (asset as { src: string }).src
}

const defaultIcon = L.icon({
  iconUrl: assetUrl(markerIcon),
  iconRetinaUrl: assetUrl(markerIcon2x),
  shadowUrl: assetUrl(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
})

/** Recentra el mapa cuando cambia el municipio elegido. */
function RecenterOnChange({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export interface VenueLocationMapProps {
  /** Centro del mapa (centroide del municipio o pin guardado). */
  center: [number, number]
  /** Posición del pin (por defecto el centro). */
  pin: [number, number]
  /** null = solo lectura (sin arrastre). */
  onPinChange: ((pin: [number, number]) => void) | null
  heightClass?: string
  zoom?: number
}

/**
 * Mapa OpenStreetMap con pin (Fase L.0) — sin API key. Importar SIEMPRE con
 * next/dynamic y ssr:false (Leaflet toca window al cargar).
 */
export default function VenueLocationMap({
  center,
  pin,
  onPinChange,
  heightClass = 'h-64',
  zoom = 14,
}: VenueLocationMapProps) {
  return (
    <div className={`${heightClass} overflow-hidden rounded-lg border border-border`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnChange center={center} />
        <Marker
          position={pin}
          icon={defaultIcon}
          draggable={onPinChange != null}
          eventHandlers={
            onPinChange
              ? {
                  dragend: (event) => {
                    const position = (event.target as L.Marker).getLatLng()
                    onPinChange([position.lat, position.lng])
                  },
                }
              : undefined
          }
        />
      </MapContainer>
    </div>
  )
}
