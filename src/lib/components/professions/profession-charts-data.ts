import { PROFESIONES, PROFESION_MAP, profesionIcon } from '../../constants/profesiones'
import type { Personaje } from '../../types'
import { dataStore } from '../../stores/data'

export const RECOLECCION_IDS = new Set(['mineria', 'herboristeria', 'desuello'])

export interface ProfCount {
  id: string
  nombre: string
  icon: string
  count: number
  p1ro: number
  p2do: number
  p3ro: number
  p4to: number
  sinRol: number
  esRecoleccion: boolean
}

export interface CharProfCell {
  rol: '1ro' | '2do' | '3ro' | '4to' | 'none'
  slot: number
}

export type PairMatrix = Record<string, Record<string, number>>

export function computeProfCounts(personajes: Personaje[], profType: 'todas' | 'recoleccion' | 'artesania', profSlot: 'ambas' | 'primera' | 'segunda', filterMain: boolean, filterCD: boolean, filterNone: boolean): ProfCount[] {
  return PROFESIONES
    .filter(p => {
      if (profType === 'recoleccion') return RECOLECCION_IDS.has(p.id)
      if (profType === 'artesania') return !RECOLECCION_IDS.has(p.id)
      return true
    })
    .map(p => {
      let chars = personajes.filter(c => (c.profesiones ?? []).some(s => s.id === p.id))
      if (profSlot !== 'ambas') {
        const slotIdx = profSlot === 'primera' ? 0 : 1
        chars = chars.filter(c => (c.profesiones ?? [])[slotIdx]?.id === p.id)
      }
      const anyRoleFilter = filterMain || filterCD || filterNone
      if (anyRoleFilter) {
        chars = chars.filter(c => {
          const slot = (c.profesiones ?? []).find(s => s.id === p.id)
          const rol = slot?.rol ?? 'none'
          if (filterMain && rol === '1ro') return true
          if (filterCD && (rol === '2do' || rol === '3ro' || rol === '4to')) return true
          if (filterNone && rol === 'none') return true
          return false
        })
      }
      const p1ro = chars.filter(c => (c.profesiones ?? []).some(s => s.id === p.id && s.rol === '1ro')).length
      const p2do = chars.filter(c => (c.profesiones ?? []).some(s => s.id === p.id && s.rol === '2do')).length
      const p3ro = chars.filter(c => (c.profesiones ?? []).some(s => s.id === p.id && s.rol === '3ro')).length
      const p4to = chars.filter(c => (c.profesiones ?? []).some(s => s.id === p.id && s.rol === '4to')).length
      const sinRol = chars.length - p1ro - p2do - p3ro - p4to
      return {
        id: p.id,
        nombre: p.nombre,
        icon: profesionIcon(p.id),
        count: chars.length,
        p1ro,
        p2do,
        p3ro,
        p4to,
        sinRol,
        esRecoleccion: RECOLECCION_IDS.has(p.id),
      }
    })
}

export function computeCharProfMatrix(personajes: Personaje[]): Record<string, Record<string, CharProfCell | null>> {
  const matrix: Record<string, Record<string, CharProfCell | null>> = {}
  for (const c of personajes) {
    const row: Record<string, CharProfCell | null> = {}
    for (const p of PROFESIONES) {
      const slot = (c.profesiones ?? []).find(s => s.id === p.id)
      if (slot) {
        row[p.id] = { rol: slot.rol ?? 'none', slot: (c.profesiones ?? []).indexOf(slot) }
      } else {
        row[p.id] = null
      }
    }
    matrix[c.nombre] = row
  }
  return matrix
}

export function computePairMatrix(personajes: Personaje[]): PairMatrix {
  const profIds = PROFESIONES.map(p => p.id)
  const matrix: PairMatrix = {}
  for (const id of profIds) {
    matrix[id] = {}
    for (const id2 of profIds) {
      matrix[id][id2] = 0
    }
  }
  for (const c of personajes) {
    const ids = (c.profesiones ?? []).map(s => s.id).filter(Boolean)
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < ids.length; j++) {
        if (i !== j) {
          matrix[ids[i]][ids[j]]++
          matrix[ids[j]][ids[i]]++
        }
      }
    }
    for (const id of ids) {
      matrix[id][id]++
    }
  }
  return matrix
}

export function computeProfAvgValues(): Record<string, number> {
  const indexes = dataStore.getIndexes()
  if (indexes.length === 0) return {}
  const values: Record<string, number> = {}
  for (const p of PROFESIONES) {
    let sum = 0
    let count = 0
    for (const idx of indexes) {
      const v = dataStore.getStrategicValue('profession', p.id, idx.id)
      if (v !== undefined) {
        sum += v
        count++
      }
    }
    if (count > 0) {
      values[p.id] = sum / count
    }
  }
  return values
}

export function classKey(clase: string): string {
  const map: Record<string, string> = {
    'Guerrero': 'warrior', 'Paladín': 'paladin', 'Cazador': 'hunter',
    'Pícaro': 'rogue', 'Sacerdote': 'priest', 'DK': 'dk',
    'Chamán': 'shaman', 'Mago': 'mage', 'Brujo': 'warlock',
    'Monje': 'monk', 'Druida': 'druid', 'DH': 'dh', 'Evocadora': 'evoker',
  }
  return map[clase] || 'warrior'
}

export const CLASS_ORDER: Record<string, number> = {
  'warrior': 0, 'paladin': 1, 'hunter': 2, 'rogue': 3,
  'priest': 4, 'dk': 5, 'shaman': 6, 'mage': 7,
  'warlock': 8, 'monk': 9, 'druid': 10, 'dh': 11, 'evoker': 12,
}

export const PERS_CLASS_COLORS: Record<string, string> = {
  warrior: '#c69b3a', paladin: '#f48cba', hunter: '#aad372', rogue: '#fff569',
  priest: '#ffffff', dk: '#c41e3a', shaman: '#0070dd', mage: '#3fc7eb',
  warlock: '#8788ee', monk: '#00ff96', druid: '#ff7c0a', dh: '#a330c9', evoker: '#33937f',
}

export function sortByClass(chars: Personaje[]): Personaje[] {
  return [...chars].sort((a, b) => {
    const ca = CLASS_ORDER[classKey(a.clase)] ?? 99
    const cb = CLASS_ORDER[classKey(b.clase)] ?? 99
    if (ca !== cb) return ca - cb
    return a.nombre.localeCompare(b.nombre)
  })
}
