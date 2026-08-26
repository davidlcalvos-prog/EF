import {
  findMunicipality,
  haversineKm,
  MUNICIPALITIES,
  searchMunicipalities,
} from './index';

describe('geo (Fase L.0)', () => {
  it('incluye los ~1.120 municipios de Colombia', () => {
    expect(MUNICIPALITIES.length).toBeGreaterThanOrEqual(1100);
  });

  it('findMunicipality resuelve Pereira por código DANE', () => {
    const pereira = findMunicipality('66001');
    expect(pereira?.name).toBe('Pereira');
    expect(pereira?.department).toBe('Risaralda');
    expect(pereira?.lat).toBeCloseTo(4.8, 0);
    expect(pereira?.lng).toBeCloseTo(-75.7, 1);
  });

  it('searchMunicipalities es insensible a acentos y mayúsculas', () => {
    const porBogota = searchMunicipalities('bogota', 5);
    expect(porBogota.some((m) => m.name.startsWith('Bogotá'))).toBe(true);

    const porDosq = searchMunicipalities('DOSQ', 5);
    expect(porDosq[0]?.name).toBe('Dosquebradas');
    expect(porDosq[0]?.department).toBe('Risaralda');
  });

  it('searchMunicipalities matchea por departamento después del nombre', () => {
    const porRisaralda = searchMunicipalities('risaralda', 30);
    expect(porRisaralda.length).toBeGreaterThanOrEqual(14);
  });

  it('haversineKm: Pereira ↔ Dosquebradas ≈ 5–7 km', () => {
    const pereira = findMunicipality('66001')!;
    const dosquebradas = findMunicipality('66170')!;
    const km = haversineKm(pereira, dosquebradas);
    expect(km).toBeGreaterThan(3);
    expect(km).toBeLessThan(8);
  });

  it('haversineKm: Pereira ↔ Bogotá ≈ 180 km en línea recta', () => {
    // Los ~200–210 km habituales son por carretera; la distancia de gran
    // círculo entre centroides es ~179 km, que es lo que mide Haversine.
    const pereira = findMunicipality('66001')!;
    const bogota = findMunicipality('11001')!;
    const km = haversineKm(pereira, bogota);
    expect(km).toBeGreaterThan(170);
    expect(km).toBeLessThan(195);
  });
});
