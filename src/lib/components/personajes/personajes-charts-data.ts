import type { Personaje } from '../../types'
import { PERS_RACE_INFO, CLASS_MAP, PERS_CLASS_COLORS } from '../../constants'

export { PERS_CLASS_COLORS }

export const CLASS_ORDER: Record<string, number> = {
  warrior: 0, paladin: 1, hunter: 2, rogue: 3,
  priest: 4, dk: 5, shaman: 6, mage: 7,
  warlock: 8, monk: 9, druid: 10, dh: 11, evoker: 12,
}

export function classKey(clase: string): string {
  return CLASS_MAP[clase] || 'warrior'
}

export function classLabel(key: string): string {
  const rev: Record<string, string> = {}
  for (const [k, v] of Object.entries(CLASS_MAP)) if (!rev[v]) rev[v] = k
  return rev[key] || key
}

export interface RaceClassCell {
  count: number
  names: string[]
}

export function computeRaceClassMatrix(chars: Personaje[]): {
  races: string[]
  classes: string[]
  matrix: Record<string, Record<string, RaceClassCell>>
} {
  const raceSet = new Set<string>()
  const classSet = new Set<string>()
  const matrix: Record<string, Record<string, RaceClassCell>> = {}

  for (const c of chars) {
    raceSet.add(c.raza)
    const ck = classKey(c.clase)
    classSet.add(ck)
    if (!matrix[c.raza]) matrix[c.raza] = {}
    if (!matrix[c.raza][ck]) matrix[c.raza][ck] = { count: 0, names: [] }
    matrix[c.raza][ck].count++
    matrix[c.raza][ck].names.push(c.nombre)
  }

  const races = [...raceSet].sort((a, b) => {
    const fa = (PERS_RACE_INFO[a]?.type ?? '')
    const fb = (PERS_RACE_INFO[b]?.type ?? '')
    if (fa !== fb) return fa.localeCompare(fb)
    return a.localeCompare(b)
  })

  const classes = [...classSet].sort((a, b) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99))

  return { races, classes, matrix }
}

export const LEVEL_BUCKETS = [
  { min: 1, max: 10, label: '1-10' },
  { min: 11, max: 20, label: '11-20' },
  { min: 21, max: 30, label: '21-30' },
  { min: 31, max: 40, label: '31-40' },
  { min: 41, max: 50, label: '41-50' },
  { min: 51, max: 60, label: '51-60' },
  { min: 61, max: 70, label: '61-70' },
  { min: 71, max: 80, label: '71-80' },
  { min: 81, max: 90, label: '81-90' },
]

export interface LevelClassCell {
  count: number
  names: string[]
}

export function computeLevelClassMatrix(chars: Personaje[]): {
  buckets: typeof LEVEL_BUCKETS
  classes: string[]
  matrix: Record<string, Record<string, LevelClassCell>>
} {
  const classSet = new Set<string>()
  const matrix: Record<string, Record<string, LevelClassCell>> = {}

  for (const b of LEVEL_BUCKETS) {
    matrix[b.label] = {}
    for (const c of chars) {
      if (c.nivel >= b.min && c.nivel <= b.max) {
        const ck = classKey(c.clase)
        classSet.add(ck)
        if (!matrix[b.label][ck]) matrix[b.label][ck] = { count: 0, names: [] }
        matrix[b.label][ck].count++
        matrix[b.label][ck].names.push(c.nombre)
      }
    }
  }

  const classes = [...classSet].sort((a, b) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99))

  return { buckets: LEVEL_BUCKETS, classes, matrix }
}

export interface FactionClassEntry {
  clase: string
  classKey: string
  alliance: number
  horde: number
  total: number
}

export function computeFactionClassCounts(chars: Personaje[]): FactionClassEntry[] {
  const map = new Map<string, { alliance: number; horde: number }>()
  for (const c of chars) {
    const ck = classKey(c.clase)
    if (!map.has(ck)) map.set(ck, { alliance: 0, horde: 0 })
    const entry = map.get(ck)!
    if (c.faccion === 'Alianza') entry.alliance++
    else entry.horde++
  }
  return [...map.entries()]
    .map(([ck, counts]) => ({
      clase: classLabel(ck),
      classKey: ck,
      alliance: counts.alliance,
      horde: counts.horde,
      total: counts.alliance + counts.horde,
    }))
    .sort((a, b) => b.total - a.total || a.clase.localeCompare(b.clase))
}

export const FACTION_COLORS: Record<string, string> = {
  Alianza: '#4a9eff',
  Horda: '#cc3300',
}

export const RACE_FACTION: Record<string, string> = {
  'Human': 'Alianza', 'Night Elf': 'Alianza', 'Gnome': 'Alianza',
  'Dwarf': 'Alianza', 'Draenei': 'Alianza', 'Worgen': 'Alianza',
  'Pandaren': 'Alianza', 'Dracthyr': 'Alianza',
  'Void Elf': 'Alianza', 'Light Draenei': 'Alianza',
  'Dark Iron Dwarf': 'Alianza', 'Kul Tiran': 'Alianza',
  'Mechagnome': 'Alianza', 'Earthen': 'Alianza',
  'Orco': 'Horda', 'Undead': 'Horda', 'Tauren': 'Horda',
  'Troll': 'Horda', 'Blood Elf': 'Horda', 'Goblin': 'Horda',
  "Mag'har": 'Horda', 'Nightborne': 'Horda',
  'Highmountain': 'Horda', 'Zandalari': 'Horda',
  'Vulpera': 'Horda', 'Haranir': 'Horda',
}
