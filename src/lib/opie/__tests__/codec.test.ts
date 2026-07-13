import { describe, it, expect } from 'vitest'
import { serializeRing, unserializeRing } from '../codec'
import { decodeRingString, encodeRing, splitInputStrings } from '../mapper'
import type { OpieRing } from '../types'

const SAMPLE_RING_STRING =
  `oetohH7 dy93BGr q4itwws pecset9 2T32q4i tq1T32q 4it41T3 2q4it32 V1T3234 wMaster 06Ring0 B06Spec s91341V w18scv9 4.`

describe('OPie codec', () => {
  it('decodes the known-good sample string from the prototype without error', () => {
    const result = unserializeRing(SAMPLE_RING_STRING)
    expect('error' in result).toBe(false)
  })

  it('round-trips a hand-built ring through serialize -> unserialize', () => {
    const ring = ['spell', 133]
    const arr: unknown[] & Record<string, unknown> = [ring] as unknown as unknown[] & Record<string, unknown>
    arr.name = 'Test Ring'
    arr.hotkey = 'CTRL-1'

    const str = serializeRing(arr)
    expect(str.startsWith('oetohH7')).toBe(true)

    const decoded = unserializeRing(str)
    expect('value' in decoded).toBe(true)
    if ('value' in decoded) {
      const value = decoded.value as unknown[] & Record<string, unknown>
      expect(value.name).toBe('Test Ring')
      expect(value.hotkey).toBe('CTRL-1')
      expect(value[0]).toEqual(['spell', 133])
    }
  })
})

describe('OPie mapper', () => {
  it('decodes a raw string into a plain-object OpieRing safe for JSON.stringify', () => {
    let idCounter = 0
    const result = decodeRingString(SAMPLE_RING_STRING, () => `ring-${idCounter++}`)
    expect('ring' in result).toBe(true)
    if ('ring' in result) {
      // Simulate persistence: must survive a JSON round-trip (unlike the raw codec array).
      const persisted = JSON.parse(JSON.stringify(result.ring)) as OpieRing
      expect(persisted.name).toBeTruthy()
      expect(Array.isArray(persisted.slices)).toBe(true)
    }
  })

  it('encodeRing self-verifies and produces a string decodeRingString can read back', () => {
    const ring: OpieRing = {
      id: 'r1',
      name: 'Mi Anillo',
      hotkey: 'CTRL-2',
      slices: [
        { type: 'spell', arg: 133 },
        { type: 'ring', arg: 'Otro Anillo' },
        { type: '' },
      ],
    }

    const encoded = encodeRing(ring)
    expect('value' in encoded).toBe(true)
    if (!('value' in encoded)) return

    let idCounter = 0
    const decoded = decodeRingString(encoded.value, () => `ring-${idCounter++}`)
    expect('ring' in decoded).toBe(true)
    if ('ring' in decoded) {
      expect(decoded.ring.name).toBe('Mi Anillo')
      expect(decoded.ring.hotkey).toBe('CTRL-2')
      expect(decoded.ring.slices).toHaveLength(3)
      expect(decoded.ring.slices[0]).toMatchObject({ type: 'spell', arg: 133 })
      expect(decoded.ring.slices[1]).toMatchObject({ type: 'ring', arg: 'Otro Anillo' })
    }
  })

  it('splitInputStrings splits multiple pasted ring strings', () => {
    const one = encodeRing({ id: 'a', name: 'A', slices: [{ type: 'spell', arg: 1 }] })
    const two = encodeRing({ id: 'b', name: 'B', slices: [{ type: 'spell', arg: 2 }] })
    if (!('value' in one) || !('value' in two)) throw new Error('encode failed')

    const pasted = one.value + '\n' + two.value
    const parts = splitInputStrings(pasted)
    expect(parts).toHaveLength(2)
    expect(parts[0].startsWith('oetohH7')).toBe(true)
    expect(parts[1].startsWith('oetohH7')).toBe(true)
  })
})
