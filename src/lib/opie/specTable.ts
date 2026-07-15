/**
 * Static class -> specialization table (global spec IDs), used by the
 * "skip by spec" pickers in RingEditor.svelte. Spec IDs have been stable
 * since Mists of Pandaria and don't require a live WoW connection — this
 * is the same kind of offline-safe fixed data as the raidmark/worldmark/
 * uipanel/peq/housing enums.
 */
export interface SpecInfo {
  id: number
  name: string
}

export interface ClassSpecs {
  className: string
  specs: SpecInfo[]
}

export const CLASS_SPECS: ClassSpecs[] = [
  { className: 'Guerrero', specs: [{ id: 71, name: 'Armas' }, { id: 72, name: 'Furia' }, { id: 73, name: 'Protección' }] },
  { className: 'Paladín', specs: [{ id: 65, name: 'Sagrado' }, { id: 66, name: 'Protección' }, { id: 70, name: 'Reprensión' }] },
  { className: 'Cazador', specs: [{ id: 253, name: 'Bestias' }, { id: 254, name: 'Puntería' }, { id: 255, name: 'Supervivencia' }] },
  { className: 'Pícaro', specs: [{ id: 259, name: 'Asesinato' }, { id: 260, name: 'Combate' }, { id: 261, name: 'Sutileza' }] },
  { className: 'Sacerdote', specs: [{ id: 256, name: 'Disciplina' }, { id: 257, name: 'Sagrado' }, { id: 258, name: 'Sombra' }] },
  { className: 'DK', specs: [{ id: 250, name: 'Sangre' }, { id: 251, name: 'Escarcha' }, { id: 252, name: 'Profano' }] },
  { className: 'Chamán', specs: [{ id: 262, name: 'Elemental' }, { id: 263, name: 'Mejora' }, { id: 264, name: 'Restauración' }] },
  { className: 'Mago', specs: [{ id: 62, name: 'Arcano' }, { id: 63, name: 'Fuego' }, { id: 64, name: 'Escarcha' }] },
  { className: 'Brujo', specs: [{ id: 265, name: 'Aflicción' }, { id: 266, name: 'Demonología' }, { id: 267, name: 'Destrucción' }] },
  { className: 'Monje', specs: [{ id: 268, name: 'Maestro Cervecero' }, { id: 269, name: 'Viajero del Viento' }, { id: 270, name: 'Tejedor de Niebla' }] },
  { className: 'Druida', specs: [{ id: 102, name: 'Equilibrio' }, { id: 103, name: 'Feral' }, { id: 104, name: 'Guardián' }, { id: 105, name: 'Restauración' }] },
  { className: 'DH', specs: [{ id: 577, name: 'Devastación' }, { id: 581, name: 'Venganza' }] },
  { className: 'Evocadora', specs: [{ id: 1467, name: 'Devastación' }, { id: 1468, name: 'Preservación' }, { id: 1473, name: 'Aumento' }] },
]

const SPEC_NAME_BY_ID: Record<number, string> = {}
for (const c of CLASS_SPECS) for (const s of c.specs) SPEC_NAME_BY_ID[s.id] = `${s.name} (${c.className})`

export function specLabel(id: number): string {
  return SPEC_NAME_BY_ID[id] ?? `Spec ${id}`
}
