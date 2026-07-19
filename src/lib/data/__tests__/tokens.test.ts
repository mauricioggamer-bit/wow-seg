import { describe, it, expect } from 'vitest'
import { normalizeData } from '../persistence'
import type { WowData } from '../../types'
import { TOKENS, TOKEN_TIERS, tokensByTier } from '../tokens'

function minimalData(): WowData {
  return {
    _meta: {
      version: '2',
      descripcion: '',
      reset_weekly_dia: 'tuesday',
      ultimo_reset_semanal: null,
      total_personajes: 0,
      total_activos: 0,
    },
    personajes: [],
    warbands: [],
  } as WowData
}

describe('normalizeData: tokenUnlocks opt-in', () => {
  it('inicializa tokenUnlocks como objeto vacío si falta', () => {
    const data = minimalData()
    const result = normalizeData(data)
    expect(result.tokenUnlocks).toEqual({})
  })

  it('preserva entradas válidas y descarta valores no-array', () => {
    const data = minimalData() as any
    data.tokenUnlocks = {
      't5-head-hero': ['Cazador', 'Mago'],
      't10-mark-vanquisher': ['Pícaro'],
      'mal-formado': 'no-es-array',
      'otro-mal': 42,
    }
    const result = normalizeData(data)
    expect(result.tokenUnlocks).toEqual({
      't5-head-hero': ['Cazador', 'Mago'],
      't10-mark-vanquisher': ['Pícaro'],
    })
  })

  it('filtra elementos no-string dentro de un array', () => {
    const data = minimalData() as any
    data.tokenUnlocks = { 't5-head-hero': ['Mago', 7, null, 'Brujo'] }
    const result = normalizeData(data)
    expect(result.tokenUnlocks).toEqual({ 't5-head-hero': ['Mago', 'Brujo'] })
  })
})

describe('TOKENS catálogo', () => {
  it('cubre los 8 tiers esperados', () => {
    const presentes = new Set(TOKENS.map(t => t.tier))
    for (const t of TOKEN_TIERS) expect(presentes.has(t)).toBe(true)
  })

  it('IDs son únicos', () => {
    const ids = TOKENS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('T10 tiene 6 entradas (3 grupos × 2 modos normal/heroic)', () => {
    expect(tokensByTier('T10')).toHaveLength(6)
  })

  it('T9 tiene 9 entradas (3 grupos × 3 ilvls)', () => {
    expect(tokensByTier('T9')).toHaveLength(9)
  })

  it('T5 tiene 15 entradas (5 slots × 3 grupos Hero/Champion/Defender)', () => {
    expect(tokensByTier('T5')).toHaveLength(15)
  })

  it('T6 tiene 24 entradas (8 slots × 3 grupos)', () => {
    expect(tokensByTier('T6')).toHaveLength(24)
  })

  it('T11 tiene 6 entradas (2 slots head/shoulders × 3 grupos)', () => {
    expect(tokensByTier('T11')).toHaveLength(6)
  })

  it('clases de Vanquisher en WotLK incluyen DK', () => {
    const t10v = tokensByTier('T10').find(t => t.grupo === 'vanquisher')!
    expect(t10v.clases).toEqual(['Pícaro', 'DK', 'Mago', 'Druida'])
  })

  it('clases de Hero en TBC no incluyen DK', () => {
    const t5h = tokensByTier('T5').find(t => t.grupo === 'hero' && t.slot === 'head')!
    expect(t5h.clases).toEqual(['Cazador', 'Mago', 'Brujo'])
  })
})