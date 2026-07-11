export interface ProfesionInfo {
  id: string
  nombre: string
  icon: string
}

export const PROFESIONES: ProfesionInfo[] = [
  { id: 'mineria', nombre: 'Minería', icon: '⛏' },
  { id: 'herboristeria', nombre: 'Herboristería', icon: '🌿' },
  { id: 'desuello', nombre: 'Desuello', icon: '🪒' },
  { id: 'herreria', nombre: 'Herrería', icon: '🔨' },
  { id: 'peleteria', nombre: 'Peletería', icon: '🟤' },
  { id: 'sastreria', nombre: 'Sastrería', icon: '🧵' },
  { id: 'alquimia', nombre: 'Alquimia', icon: '⚗' },
  { id: 'encantamiento', nombre: 'Encantamiento', icon: '✨' },
  { id: 'ingenieria', nombre: 'Ingeniería', icon: '⚙' },
  { id: 'joyeria', nombre: 'Joyería', icon: '💎' },
  { id: 'inscripcion', nombre: 'Inscripción', icon: '📜' },
]

export const PROFESION_MAP: Record<string, ProfesionInfo> = PROFESIONES.reduce(
  (acc, p) => { acc[p.id] = p; return acc },
  {} as Record<string, ProfesionInfo>,
)

export function profesionNombre(id: string): string {
  if (!id) return ''
  return PROFESION_MAP[id]?.nombre ?? id
}

export function profesionIcon(id: string): string {
  if (!id) return ''
  return PROFESION_MAP[id]?.icon ?? ''
}
