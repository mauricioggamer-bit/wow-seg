import { describe, it, expect } from 'vitest'
import { normalizeData } from '../persistence'
import type { WowData } from '../../types'
import { TOKENS, TOKEN_TIERS, tokensByTier, tokenIdFor, defaultDifficulty } from '../tokens'

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

describe('normalizeData: tokenCounts y tokenUsedBy opt-in', () => {
  it('inicializa tokenCounts y tokenUsedBy como objetos vacíos si faltan', () => {
    const data = minimalData()
    const result = normalizeData(data)
    expect(result.tokenCounts).toEqual({})
    expect(result.tokenUsedBy).toEqual({})
  })

  it('migra tokenUnlocks (viejo binario-clase) a tokenUsedBy y lo elimina', () => {
    const data = minimalData() as any
    data.tokenUnlocks = {
      't5-head-hero': ['Cazador', 'Mago'],
      't10-mark-vanquisher': ['Pícaro'],
    }
    const result = normalizeData(data) as any
    expect(result.tokenUsedBy).toEqual({
      't5-head-hero': ['Cazador', 'Mago'],
      't10-mark-vanquisher': ['Pícaro'],
    })
    expect(result.tokenUnlocks).toBeUndefined()
    expect(result.tokenCounts).toEqual({})
  })

  it('no sobreescribe tokenUsedBy si ya existe al migrar', () => {
    const data = minimalData() as any
    data.tokenUnlocks = { 't5-head-hero': ['Cazador'] }
    data.tokenUsedBy = { 't5-head-hero': ['Mago'] }
    const result = normalizeData(data)
    expect(result.tokenUsedBy).toEqual({ 't5-head-hero': ['Mago'] })
  })

  it('sanitiza tokenCounts: floor de no-numéricos y negativos a 0', () => {
    const data = minimalData() as any
    data.tokenCounts = {
      't5-head-hero': 3,
      'mal-formado': 'no-es-numero',
      'negativo': -5,
      'flotante': 4.9,
    }
    const result = normalizeData(data)
    expect(result.tokenCounts).toEqual({
      't5-head-hero': 3,
      'mal-formado': 0,
      'negativo': 0,
      'flotante': 4,
    })
  })

  it('sanitiza tokenUsedBy: filtra elementos no-string', () => {
    const data = minimalData() as any
    data.tokenUsedBy = { 't5-head-hero': ['Mago', 7, null, 'Brujo'] }
    const result = normalizeData(data)
    expect(result.tokenUsedBy).toEqual({ 't5-head-hero': ['Mago', 'Brujo'] })
  })
})

describe('TOKENS catálogo', () => {
  it('cubre los 13 tiers esperados (T4-T16)', () => {
    const presentes = new Set(TOKENS.map(t => t.tier))
    for (const t of TOKEN_TIERS) expect(presentes.has(t)).toBe(true)
    expect(TOKEN_TIERS).toHaveLength(13)
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

  it('T12 tiene 15 entradas (5 slots × 3 grupos)', () => {
    expect(tokensByTier('T12')).toHaveLength(15)
  })

  it('T13 tiene 15 entradas (5 slots × 3 grupos)', () => {
    expect(tokensByTier('T13')).toHaveLength(15)
  })

  it('T14 tiene 15 entradas (5 slots × 3 grupos)', () => {
    expect(tokensByTier('T14')).toHaveLength(15)
  })

  it('T15 tiene 15 entradas (5 slots × 3 grupos)', () => {
    expect(tokensByTier('T15')).toHaveLength(15)
  })

  it('T16 tiene 15 entradas (5 slots × 3 grupos)', () => {
    expect(tokensByTier('T16')).toHaveLength(15)
  })

  it('catálogo total = 198', () => {
    expect(TOKENS).toHaveLength(198)
  })

  it('clases de Vanquisher en WotLK incluyen DK', () => {
    const t10v = tokensByTier('T10').find(t => t.grupo === 'vanquisher')!
    expect(t10v.clases).toEqual(['Pícaro', 'DK', 'Mago', 'Druida'])
  })

  it('clases de Hero en TBC no incluyen DK', () => {
    const t5h = tokensByTier('T5').find(t => t.grupo === 'hero' && t.slot === 'head')!
    expect(t5h.clases).toEqual(['Cazador', 'Mago', 'Brujo'])
  })

  it('T13 tiene dificultades rf/normal/heroic', () => {
    const t13 = tokensByTier('T13')[0]
    expect(t13.dificultades).toEqual(['rf', 'normal', 'heroic'])
  })

  it('T16 tiene dificultades rf/normal/heroic/mythic', () => {
    const t16 = tokensByTier('T16')[0]
    expect(t16.dificultades).toEqual(['rf', 'normal', 'heroic', 'mythic'])
  })

  it('T4 tiene dificultades vacías', () => {
    const t4 = tokensByTier('T4')[0]
    expect(t4.dificultades).toEqual([])
  })

  it('T13 ilvls = {rf:384, normal:397, heroic:410}', () => {
    const t13 = tokensByTier('T13')[0]
    expect(t13.ilvls).toEqual({ rf: 384, normal: 397, heroic: 410 })
  })

  it('tokenIdFor en T4 (sin dificultades) devuelve el id base', () => {
    const t4 = tokensByTier('T4')[0]
    expect(tokenIdFor(t4, undefined)).toBe(t4.id)
    expect(tokenIdFor(t4, 'rf')).toBe(t4.id) // rf no aplica a T4
  })

  it('tokenIdFor en T13 con "rf" añade el sufijo', () => {
    const t13 = tokensByTier('T13')[0]
    expect(tokenIdFor(t13, 'rf')).toBe(`${t13.id}-rf`)
    expect(tokenIdFor(t13, 'normal')).toBe(`${t13.id}-normal`)
  })

  it('defaultDifficulty = primera dificultad disponible', () => {
    const t16 = tokensByTier('T16')[0]
    expect(defaultDifficulty(t16)).toBe('rf')
    const t4 = tokensByTier('T4')[0]
    expect(defaultDifficulty(t4)).toBeUndefined()
  })
})