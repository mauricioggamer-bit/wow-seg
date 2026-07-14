/**
 * Conversion layer between the OPie codec's raw Lua-table-shaped value
 * (a JS array with extra non-index string properties, mirroring a Lua
 * table's array+hash parts) and plain-object OpieRing/OpieSlice types.
 *
 * This exists because JSON.stringify silently drops non-index properties
 * on arrays — persisting the codec's raw shape straight into WowData would
 * lose ring names/hotkeys/etc. on reload.
 */
import { defaultSign, serializeRing, unserializeRing } from './codec'
import type { OpieRing, OpieSlice, SliceActionType } from './types'

type RawTable = Record<string, unknown> & unknown[]

const RING_KNOWN_KEYS = [
  'name', 'hotkey', 'limit', 'internal', 'embed', 'onOpen',
  'noOpportunisticCA', 'noPersistentCA', 'skipSpecs',
]

function toOpieSlice(raw: unknown): OpieSlice {
  if (!raw || typeof raw !== 'object') return { type: '' }
  const arr = raw as RawTable
  const type = (arr[0] ?? '') as SliceActionType
  const arg = arr[1] as string | number | undefined
  const flags = arr[2] as number | undefined
  const slice: OpieSlice = { type }
  if (arg !== undefined) slice.arg = arg
  if (typeof flags === 'number') slice.flags = flags

  const extra: Record<string, unknown> = {}
  for (const key of Object.keys(arr)) {
    if (/^\d+$/.test(key)) continue // positions 0/1/2 already handled above
    if (key === 'icon') slice.icon = arr.icon as string | number
    else if (key === 'show') slice.show = arr.show as string
    else if (key === 'c') slice.color = arr.c as string
    else if (key === 'embed') slice.embed = arr.embed as boolean
    else if (key === 'rotationMode') slice.rotationMode = arr.rotationMode as string
    else if (key === 'fastClick') slice.fastClick = arr.fastClick as boolean
    else extra[key] = arr[key]
  }
  if (Object.keys(extra).length) slice.extra = extra
  return slice
}

function toRawSlice(slice: OpieSlice): unknown {
  const arr: RawTable = [] as unknown as RawTable
  if (slice.type) arr[0] = slice.type
  if (slice.arg !== undefined) arr[1] = slice.arg
  if (slice.flags !== undefined) arr[2] = slice.flags
  if (slice.icon !== undefined) arr.icon = slice.icon
  if (slice.show !== undefined) arr.show = slice.show
  if (slice.color !== undefined) arr.c = slice.color
  if (slice.embed !== undefined) arr.embed = slice.embed
  if (slice.rotationMode !== undefined) arr.rotationMode = slice.rotationMode
  if (slice.fastClick !== undefined) arr.fastClick = slice.fastClick
  if (slice.extra) Object.assign(arr, slice.extra)
  return arr
}

function toOpieRing(raw: unknown, id: string): OpieRing {
  const arr = (Array.isArray(raw) ? raw : []) as RawTable
  const slices: OpieSlice[] = []
  for (let i = 0; i < arr.length; i++) slices.push(toOpieSlice(arr[i]))

  const ring: OpieRing = {
    id,
    name: typeof arr.name === 'string' ? (arr.name as string) : `Anillo ${id}`,
    slices,
  }
  if (arr.hotkey !== undefined) ring.hotkey = arr.hotkey as string
  if (arr.limit !== undefined) ring.limit = arr.limit as string
  if (arr.internal !== undefined) ring.internal = arr.internal as boolean
  if (arr.embed !== undefined) ring.embed = arr.embed as boolean
  if (arr.onOpen !== undefined) ring.onOpen = arr.onOpen as number
  if (arr.noOpportunisticCA !== undefined) ring.noOpportunisticCA = arr.noOpportunisticCA as boolean
  if (arr.noPersistentCA !== undefined) ring.noPersistentCA = arr.noPersistentCA as boolean
  if (arr.skipSpecs !== undefined) ring.skipSpecs = arr.skipSpecs as string[]

  const extra: Record<string, unknown> = {}
  for (const key of Object.keys(arr)) {
    if (/^\d+$/.test(key)) continue
    if (RING_KNOWN_KEYS.includes(key)) continue
    extra[key] = arr[key]
  }
  if (Object.keys(extra).length) ring.extra = extra
  return ring
}

function toRawRing(ring: OpieRing): unknown {
  const arr = ring.slices.map(toRawSlice) as RawTable
  arr.name = ring.name
  if (ring.hotkey !== undefined) arr.hotkey = ring.hotkey
  if (ring.limit !== undefined) arr.limit = ring.limit
  if (ring.internal !== undefined) arr.internal = ring.internal
  if (ring.embed !== undefined) arr.embed = ring.embed
  if (ring.onOpen !== undefined) arr.onOpen = ring.onOpen
  if (ring.noOpportunisticCA !== undefined) arr.noOpportunisticCA = ring.noOpportunisticCA
  if (ring.noPersistentCA !== undefined) arr.noPersistentCA = ring.noPersistentCA
  if (ring.skipSpecs !== undefined) arr.skipSpecs = ring.skipSpecs
  if (ring.extra) Object.assign(arr, ring.extra)
  return arr
}

/**
 * Decodes a ring snapshot string. A single string can describe more than one
 * ring: OPie's "share ring" can bundle other named rings it nests into inline
 * (the `_bundle` table — see `GetRingSnapshot`/`GetSnapshotRing` in
 * CustomRings.lua). We unpack every bundled ring into its own `OpieRing` so
 * they all show up as separate, editable entries instead of being buried as
 * opaque data on the root ring.
 */
export function decodeRingString(raw: string, newId: () => string): { rings: OpieRing[] } | { error: string } {
  const result = unserializeRing(raw)
  if ('error' in result) return { error: result.error }
  if (!Array.isArray(result.value)) {
    return { error: 'Formato inesperado: el string no representa un anillo (se esperaba una lista de slices).' }
  }
  const root = result.value as RawTable
  const rings: OpieRing[] = []

  const bundle = root._bundle
  if (bundle && typeof bundle === 'object') {
    for (const key of Object.keys(bundle as Record<string, unknown>)) {
      const entry = (bundle as Record<string, unknown>)[key]
      if (!entry || typeof entry !== 'object') continue // `0` = self-reference marker, nothing extra to unpack
      rings.push(toOpieRing(entry, newId()))
    }
  }

  const rootRing = toOpieRing(root, newId())
  if (rootRing.extra) {
    delete rootRing.extra['_bundle'] // already unpacked above, don't duplicate/stale-copy it
    if (Object.keys(rootRing.extra).length === 0) delete rootRing.extra
  }
  rings.unshift(rootRing)

  return { rings }
}

export function encodeRing(ring: OpieRing, sign?: string): { value: string } | { error: string } {
  try {
    const raw = toRawRing(ring)
    const str = serializeRing(raw, sign)
    const verify = unserializeRing(str)
    if ('error' in verify) return { error: `Verificación de round-trip falló: ${verify.error}` }
    return { value: str }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export function splitInputStrings(text: string): string[] {
  const cleaned = text.replace(/\s+/g, '')
  const parts = cleaned.split(defaultSign).filter((p) => p.length > 0)
  return parts.map((p) => defaultSign + p)
}
