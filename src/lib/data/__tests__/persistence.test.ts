import { describe, it, expect } from 'vitest'
import { normalizeData } from '../persistence'
import type { WowData } from '../../types'

function minimalData(opieRings: unknown): WowData {
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
    opieRings: opieRings as WowData['opieRings'],
  }
}

describe('normalizeData: opieRings healing', () => {
  it('re-infers type/arg for slices stuck as { type: "", extra: { id } } from before the mapper fix', () => {
    const data = minimalData([
      {
        id: 'r1',
        name: 'Legacy Ring',
        slices: [
          { type: '', extra: { id: 315584 } }, // numeric id -> spell
          { type: '', extra: { id: '!CAST!/cast {{spell:50977}}' } }, // string id -> imptext
          { type: 'toy', arg: 12345 }, // already-correct slice, untouched
        ],
      },
    ])

    const result = normalizeData(data)
    const [spellSlice, imptextSlice, toySlice] = result.opieRings![0].slices

    expect(spellSlice).toMatchObject({ type: 'spell', arg: 315584 })
    expect(spellSlice.extra).toBeUndefined()

    expect(imptextSlice).toMatchObject({ type: 'imptext', arg: '!CAST!/cast {{spell:50977}}' })
    expect(imptextSlice.extra).toBeUndefined()

    expect(toySlice).toMatchObject({ type: 'toy', arg: 12345 })
  })

  it('preserves other extra fields alongside a healed id', () => {
    const data = minimalData([
      {
        id: 'r1',
        name: 'Legacy Ring',
        slices: [{ type: '', extra: { id: 5761, someOtherField: 'keep-me' } }],
      },
    ])

    const result = normalizeData(data)
    const slice = result.opieRings![0].slices[0]
    expect(slice).toMatchObject({ type: 'spell', arg: 5761 })
    expect(slice.extra).toEqual({ someOtherField: 'keep-me' })
  })
})
