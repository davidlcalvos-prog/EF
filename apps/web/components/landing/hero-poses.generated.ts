// GENERADO por scripts/split-hero-poses.js a partir de la ilustración de las
// tres poses — no editar a mano; volver a correr el script si cambia la imagen.
// Coordenadas en el viewBox 400×440 del hero (components/landing/hero-player.tsx).

export interface RasterPose {
  /** Ruta pública del PNG con alfa. */
  src: string
  /** Tamaño natural del PNG, en px. */
  width: number
  height: number
  /** Ubicación en el viewBox del hero. */
  x: number
  y: number
  w: number
  h: number
  /** Puntos del borde trasero del cuerpo: de ahí salen los trazos de energía. */
  anchors: [number, number][]
  /** Centro y radio del balón en el viewBox, si se detectó separado del cuerpo. */
  ball: [number, number, number] | null
  /** Dirección de los trazos (sentido contrario al movimiento). */
  trail: [number, number]
}

export const RASTER_POSES: RasterPose[] | null = [
  {
    "src": "/hero/pose-1.png",
    "width": 603,
    "height": 869,
    "x": 70.9,
    "y": 24,
    "w": 258.1,
    "h": 372,
    "anchors": [
      [
        96.2,
        45
      ],
      [
        91.9,
        74.9
      ],
      [
        106,
        104.9
      ],
      [
        128.7,
        134.9
      ],
      [
        117.2,
        164.8
      ],
      [
        85.5,
        194.8
      ],
      [
        114.6,
        224.8
      ],
      [
        128.3,
        254.7
      ],
      [
        141.6,
        284.7
      ],
      [
        120.2,
        314.7
      ],
      [
        101.8,
        344.6
      ],
      [
        86.3,
        374.6
      ]
    ],
    "ball": null,
    "trail": [
      -0.85,
      0.4
    ]
  },
  {
    "src": "/hero/pose-2.png",
    "width": 614,
    "height": 647,
    "x": 30,
    "y": 37.7,
    "w": 340,
    "h": 358.3,
    "anchors": [
      [
        275.9,
        59.9
      ],
      [
        161.2,
        88.1
      ],
      [
        118,
        116.9
      ],
      [
        207.2,
        145.2
      ],
      [
        187.3,
        173.9
      ],
      [
        174.5,
        202.2
      ],
      [
        160.1,
        231
      ],
      [
        146.3,
        259.2
      ],
      [
        103.6,
        288
      ],
      [
        77.1,
        316.3
      ],
      [
        42.7,
        345.1
      ],
      [
        41.6,
        373.3
      ]
    ],
    "ball": [
      306,
      355.6,
      29.9
    ],
    "trail": [
      -1,
      0.12
    ]
  },
  {
    "src": "/hero/pose-3.png",
    "width": 516,
    "height": 698,
    "x": 62.5,
    "y": 24,
    "w": 275,
    "h": 372,
    "anchors": [
      [
        188.8,
        46.4
      ],
      [
        94.5,
        76.2
      ],
      [
        71,
        105.5
      ],
      [
        132.3,
        135.4
      ],
      [
        119,
        165.2
      ],
      [
        122.7,
        195.1
      ],
      [
        139.8,
        224.4
      ],
      [
        154.7,
        254.2
      ],
      [
        130.7,
        284.1
      ],
      [
        115.8,
        313.9
      ],
      [
        81.7,
        343.2
      ],
      [
        82.8,
        373.1
      ]
    ],
    "ball": [
      297.6,
      140.9,
      23.7
    ],
    "trail": [
      -0.9,
      0.3
    ]
  }
]
