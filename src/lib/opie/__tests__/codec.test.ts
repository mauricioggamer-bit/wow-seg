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
    expect('rings' in result).toBe(true)
    if ('rings' in result) {
      expect(result.rings).toHaveLength(1)
      // Simulate persistence: must survive a JSON round-trip (unlike the raw codec array).
      const persisted = JSON.parse(JSON.stringify(result.rings[0])) as OpieRing
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
    expect('rings' in decoded).toBe(true)
    if ('rings' in decoded) {
      expect(decoded.rings).toHaveLength(1)
      const [r] = decoded.rings
      expect(r.name).toBe('Mi Anillo')
      expect(r.hotkey).toBe('CTRL-2')
      expect(r.slices).toHaveLength(3)
      expect(r.slices[0]).toMatchObject({ type: 'spell', arg: 133 })
      expect(r.slices[1]).toMatchObject({ type: 'ring', arg: 'Otro Anillo' })
    }
  })

  it('unpacks bundled rings from a multi-ring snapshot into separate OpieRing entries', () => {
    // "Master Ring" nesting 8 other named rings via OPie's `_bundle` snapshot
    // packaging — a real string exported from the addon.
    const BUNDLE_STRING = `oetohH7 Am9Dkbd wMacros 92Twrin g92V32w rRingBu ffs92R1 V3212we mbed92P 4wcycle 9wrotat ionMode 92u4wer RingToy s92w1V3 2wgWorm holes92 s1V32wR ingTrav el92X1V 32121P4 wrRingS pecs92q 1V32121 P4wComm onTrade s91V321 21P4wRi ngMount s92Z1V3 2121P43 rq4it32 iw18scv 94wMast er06Rin g913430 q4itwws pecset9 2o32q4i tq1o32q 4it41o3 21i1o32 34wMast er06Rin g0B06Sp ecs9134 1q4qq4X nwtoy92 k32qqtO R1k32qq qlJ1k32 qq46Q1k 32qq4vp 1k32qq3 FD1k32q q2j01k3 2qqprf1 k32qq05 c1k32q4 9Tl1k32 q49RP1k 32q49fY 1k32q4N Bi1k32q 4N2B1k3 2q4Mwn1 k32q4NI 91k32q4 CBe1k32 q4Cqj1k 32q4Z8G 1k32qqp dX1k32q 4X651k3 2q4X6m1 k32qqad Vwitem9 2m32q4X ar1k32q 4Xae1k3 2q4Gpw1 k32q4W5 Z1k32q4 cgf1k32 qquPQ1k 32qqudR 1k32q4b Vy1k32q 4oNw1m3 236wMas ter06Ri ng0B06H earthst ones913 4111r4w arthsto nes92D4 q4GOq1k 32q4WsH 1k321iq 4FM9291 k3330qw r291y43 0qw0jy1 y4qq3GB 1k32qqq 1L1k32q 4X711k3 2q4KBE1 k32qq0K j1k323y wMaster 06Ring0 B06Toys 91341w4 30q4izS 1y430q4 hV51y43 0qq6ZI1 y430q4d SH1y430 q4i6Q1y 430q4oZ U1y430q 4xOG1y4 30w1msp ec0B0H6 0K1606h ide0N91 p4qq0e6 1y430qq Cjv1y43 0qqPV61 y430qw0 Bg1y430 qw0B41y 430qwuY f1y430q 4ivi1y4 30q4o20 1y430qq GcC1y43 0q4iZQ1 y430qqG cn1y430 q4oTN1y 430w1ms pec0B0H 50V1606 hide0N9 1p4qq6a w1y430w 1mknown 1691p4w 07USE07 0Duse06 2121spe ll0B0K6 0H850K2 32391y4 3jwMast er06Rin g0B06Bu ffs9134 1R4wDMF 9wmacro 92F3231 1T13411 1r4111P 41iwonO pen941T 4qqseJ1 k32wTP0 6Home91 F3230qw 1G41y4w 1mlevel 0B0H0F1 691p419 1m32w1m in0Bbro ken06is les0Dar gus0Dbf a1691p4 qqwK21m 321D1V3 2wshuff le91u4q 4FRi1k3 2q4YCs1 k32wMag eTravel 91V32q4 DSd1k32 30w07CA ST070Dc ast0621 21spell 0B50F0V 7723230 N062121 spell0B 0G0V0J7 50J2323 0N06212 1spell0 B0G0H68 0V0H232 30N0621 21spell 0B0G0V0 J750V23 230N062 121spel l0B5562 32391y4 wmythpo rt9wopi e0Sext9 32w1mmy thport1 691p43i wMaster 06Ring0 B06Trav el91341 X430q4J gy1y4q4 iaEwmou nt92O32 q4isb1O 3233wMa ster06R ing0B06 Mounts9 1341Z4q 4Vrr1k3 2q4C3S1 k32q48J A1k32q4 zZd1k32 q4C3A1k 32q4JE2 1k32q4U fv1k32q qeXr1k3 23rwMas ter06Ri ng0B06W ormhole s91341s 4w18bun dle94.`

    let idCounter = 0
    const result = decodeRingString(BUNDLE_STRING, () => `ring-${idCounter++}`)
    expect('rings' in result).toBe(true)
    if (!('rings' in result)) return

    const names = result.rings.map((r) => r.name).sort()
    expect(names).toEqual([
      'Macros',
      'Master Ring',
      'Master Ring: Buffs',
      'Master Ring: Hearthstones',
      'Master Ring: Mounts',
      'Master Ring: Specs',
      'Master Ring: Toys',
      'Master Ring: Travel',
      'Master Ring: Wormholes',
    ])
    const hearthstones = result.rings.find((r) => r.name === 'Master Ring: Hearthstones')
    expect(hearthstones?.slices).toHaveLength(32)
    const root = result.rings.find((r) => r.name === 'Master Ring')
    expect(root?.extra?._bundle).toBeUndefined() // unpacked, not duplicated as raw data

    // Root's "ring" slices reference bundle keys (e.g. "RingMounts"), not the
    // bundled ring's real display name — those must be rewritten so nested
    // rings actually resolve to something the app knows about. ("CommonTrades"
    // has no matching _bundle entry — that target ring wasn't included in
    // this snapshot at all, e.g. because it isn't a `.save`d ring — so it's
    // left as-is; there's nothing to resolve it to.)
    const mountsSlice = root!.slices.find((s) => s.arg === 'RingMounts' || s.arg === 'Master Ring: Mounts')
    expect(mountsSlice?.arg).toBe('Master Ring: Mounts')
    const unresolvable = root!.slices.find((s) => s.type === 'ring' && s.arg === 'CommonTrades')
    expect(unresolvable).toBeDefined()

    // "Master Ring: Travel" nests "Master Ring: Hearthstones" too, via a
    // bundle key that decodes as a truncated "arthstones" — must also be
    // rewritten to the real name, not left dangling.
    const travel = result.rings.find((r) => r.name === 'Master Ring: Travel')
    const travelRingArgs = travel?.slices.filter((s) => s.type === 'ring').map((s) => s.arg)
    expect(travelRingArgs).toContain('Master Ring: Hearthstones')
  })

  it('infers type from a bare `id` field (OPie\'s SLICE_ACTIONID_TYPE shorthand)', () => {
    // Real "Master Ring: Toys" export — two of its slices have no explicit
    // [type, id] pair, only a bare numeric `id` (Lua: SLICE_ACTIONID_TYPE
    // maps a numeric id to "spell"). Before this fix these decoded to
    // `{ type: '' }` with the id silently stuck in `extra`, showing up as
    // an empty, unpickable row in the editor.
    const TOYS_STRING = `oetohH7 QWNJA8r q4GOqwt oy92T32 q4WsH1T 32q4it3 2Vq4FM9 1T3330q wr291y4 30qw0jy 1y4qq3G B1T32qq q1L1T32 q4X711T 32q4KBE 1T32qq0 Kj1T323 ywMaste r06Ring 0B06Toy s91341V w18scv9 4.`
    let idCounter = 0
    const result = decodeRingString(TOYS_STRING, () => `ring-${idCounter++}`)
    expect('rings' in result).toBe(true)
    if (!('rings' in result)) return
    const ring = result.rings[0]
    expect(ring.name).toBe('Master Ring: Toys')
    const inferredSpellSlices = ring.slices.filter((s) => s.type === 'spell')
    expect(inferredSpellSlices.length).toBeGreaterThanOrEqual(2)
    expect(inferredSpellSlices.map((s) => s.arg)).toEqual(expect.arrayContaining([431280, 460905]))
    // Must not also be duplicated as raw extra data.
    for (const s of inferredSpellSlices) expect(s.extra?.id).toBeUndefined()
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

describe('slice type round-tripping', () => {
  function roundTrip(ring: OpieRing) {
    const encoded = encodeRing(ring)
    expect('value' in encoded).toBe(true)
    if (!('value' in encoded)) throw new Error('encode failed')
    let idCounter = 0
    const decoded = decodeRingString(encoded.value, () => `ring-${idCounter++}`)
    expect('rings' in decoded).toBe(true)
    if (!('rings' in decoded)) throw new Error('decode failed')
    return decoded.rings[0]
  }

  const cases: { type: OpieRing['slices'][number]['type']; arg: string | number; flags?: number }[] = [
    { type: 'item', arg: 12345, flags: 5 },
    { type: 'macro', arg: 'MyMacroName' },
    { type: 'toy', arg: 98765 },
    { type: 'mount', arg: 55554 },
    { type: 'extrabutton', arg: 1 },
    { type: 'opie.databroker.launcher', arg: 'SomeAddon', flags: 8 },
    { type: 'quest', arg: 12345 },
    { type: 'specset', arg: 1 },
    { type: 'raidmark', arg: 3 },
    { type: 'worldmark', arg: 0 },
    { type: 'peq', arg: 'trinket1' },
    { type: 'uipanel', arg: 'spellbook' },
    { type: 'housing', arg: 'match' },
  ]

  for (const c of cases) {
    it(`round-trips a "${c.type}" slice`, () => {
      const ring: OpieRing = {
        id: 'r1',
        name: `Test ${c.type}`,
        slices: [{ type: c.type, arg: c.arg, flags: c.flags }],
      }
      const decoded = roundTrip(ring)
      expect(decoded.slices).toHaveLength(1)
      expect(decoded.slices[0].type).toBe(c.type)
      expect(decoded.slices[0].arg).toBe(c.arg)
      if (c.flags !== undefined) expect(decoded.slices[0].flags).toBe(c.flags)
    })
  }

  it('round-trips label/show/color/fastClick/rotationMode together on a ring-type slice', () => {
    const ring: OpieRing = {
      id: 'r1',
      name: 'Test combo',
      slices: [
        {
          type: 'ring',
          arg: 'Otro Anillo',
          label: 'Custom',
          show: '[combat] hide',
          color: 'FF0000',
          fastClick: true,
          rotationMode: 'jump',
        },
      ],
    }
    const decoded = roundTrip(ring)
    expect(decoded.slices[0]).toMatchObject({
      type: 'ring',
      arg: 'Otro Anillo',
      label: 'Custom',
      show: '[combat] hide',
      color: 'FF0000',
      fastClick: true,
      rotationMode: 'jump',
    })
  })

  it('round-trips ring-level offset (rotation)', () => {
    const ring: OpieRing = {
      id: 'r1',
      name: 'Test offset',
      offset: 195,
      slices: [{ type: 'spell', arg: 133 }],
    }
    const decoded = roundTrip(ring)
    expect(decoded.offset).toBe(195)
  })
})
