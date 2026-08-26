/** Municipio de Colombia según DIVIPOLA (DANE). */
export interface Municipality {
  /** Código DANE de 5 dígitos (departamento + municipio). */
  code: string;
  name: string;
  department: string;
  /** Centroide del municipio. */
  lat: number;
  lng: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}
