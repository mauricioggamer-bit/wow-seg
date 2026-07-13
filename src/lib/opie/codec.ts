/**
 * Faithful re-implementation of the `local serialize, unserialize do ... end`
 * block found in OPie's CustomRings.lua (the same format used by the
 * in-game "New Ring… → Import snapshot" box). Ported from the working
 * prototype in opie-ring-editor.html — the numeric encoding logic is kept
 * verbatim (byte-compatible with the real addon), do not "clean it up".
 */

const ALPHABET = '01234qwertyuiopasdfghjklzxcvbnm5678QWERTYUIOPASDFGHJKLZXCVBNM9'
const sigN = ALPHABET.length // 62

const sigT: Record<number, string> = {} // index(0..61) -> char
const sigC: Record<string, number> = {} // char -> index
const sigB: Record<number, number> = {} // charCode -> index
for (let i = 0; i < sigN; i++) {
  const c = ALPHABET[i]
  sigT[i] = c
  sigC[c] = i
  sigB[c.charCodeAt(0)] = i
}

export const defaultSign = 'oetohH7'
const FIELD_NAMES = [
  'name', 'hotkey', 'offset', 'noOpportunisticCA', 'noPersistentCA',
  'internal', 'limit', 'id', 'skipSpecs', 'caption', 'icon', 'show',
]

function buildRT(): Map<number, unknown> {
  const rt = new Map<number, unknown>()
  rt.set(1, true)
  rt.set(2, false)
  FIELD_NAMES.forEach((name, idx) => rt.set(3 + idx, name))
  return rt
}
function buildRegMap(): Map<string, number> {
  const reg = new Map<string, number>()
  FIELD_NAMES.forEach((name, idx) => reg.set(name, 3 + idx))
  return reg
}

function nenc(v: number, b: number): string {
  let out = ''
  let val = v
  for (let i = 0; i < b; i++) {
    const v1 = val % sigN
    out = sigT[v1] + out
    val = (val - v1) / sigN
  }
  if (val !== 0) throw new Error('numeric overflow')
  return out
}
function ndec(pri: string, pos1: number, l: number): number {
  let r = 0
  for (let i = 0; i < l; i++) {
    r = r * sigN + sigB[pri.charCodeAt(pos1 - 1 + i)]
  }
  return r
}

const CENC_M = sigN - 1
function cenc(code: number): string {
  const hi = Math.floor(code / CENC_M)
  const lo = code % CENC_M
  return sigT[hi] + sigT[lo]
}
function cdec(cChar: string, lChar: string): string {
  return String.fromCharCode(sigC[cChar] * CENC_M + sigC[lChar])
}

function checksum(s: string): number {
  const MOD = 17592186044399
  let h = (134217689 * s.length) % MOD
  const p2 = sigN * sigN
  const p3 = sigN * sigN * sigN
  for (let i = 0; i < s.length; i += 4) {
    const a = sigC[s[i]]
    const b = (s[i + 1] !== undefined ? sigC[s[i + 1]] : 0) * sigN
    const c = (s[i + 2] !== undefined ? sigC[s[i + 2]] : 0) * p2
    const d = (s[i + 3] !== undefined ? sigC[s[i + 3]] : 0) * p3
    h = (h * 211 + a + b + c + d) % MOD
  }
  return h % 3298534883309
}

function frexp(value: number): [number, number] {
  if (value === 0 || !isFinite(value)) return [value, 0]
  const data = new DataView(new ArrayBuffer(8))
  data.setFloat64(0, value)
  let bits = (data.getUint32(0) >>> 20) & 0x7ff
  if (bits === 0) {
    data.setFloat64(0, value * Math.pow(2, 64))
    bits = ((data.getUint32(0) >>> 20) & 0x7ff) - 64
  }
  const exponent = bits - 1022
  const mantissa = value * Math.pow(2, -exponent)
  return [mantissa, exponent]
}

const PASSTHROUGH_RE = /[a-zA-Z5-8]/
function escapeStr(v: string): string {
  let out = ''
  for (let i = 0; i < v.length; i++) {
    const ch = v[i]
    const code = v.charCodeAt(i)
    if (code <= 255 && PASSTHROUGH_RE.test(ch)) out += ch
    else out += cenc(code & 0xff)
  }
  return out
}
function unescapeStr(raw: string): string {
  return raw.replace(/[0-4]./g, (m) => cdec(m[0], m[1]))
}

function venc(v: unknown, t: string[], reg: Map<string, number>): string[] {
  if (typeof v === 'string' && reg.has(v)) {
    t.push(sigT[1] + sigT[reg.get(v) as number])
    return t
  }
  if (Array.isArray(v)) {
    const vRec = v as unknown as Record<string, unknown>
    const n = Math.min(sigN - 1, v.length)
    for (let i = n; i >= 1; i--) venc(v[i - 1] === undefined ? null : v[i - 1], t, reg)
    t.push(sigT[3] + sigT[n])
    for (const key of Object.keys(vRec)) {
      if (/^\d+$/.test(key)) {
        const luaIdx = Number(key) + 1
        if (luaIdx >= 1 && luaIdx <= n) continue
        venc(vRec[key], t, reg)
        venc(luaIdx, t, reg)
        t.push(sigT[4])
      } else if (key !== 'length' && vRec[key] !== undefined) {
        venc(vRec[key], t, reg)
        venc(key, t, reg)
        t.push(sigT[4])
      }
    }
    return t
  }
  if (typeof v === 'number') {
    if (Number.isInteger(v) && v >= -1000000 && v < 13776336) {
      t.push(sigT[5] + nenc(v + 1000000, 4))
    } else {
      let [f, e] = frexp(v)
      if (e < -1070) { f = f / 2; e = e + 1 }
      const opChar = f < 0 ? sigT[14] : sigT[13]
      const mant = Math.round(f * Math.pow(2, 53) * (f < 0 ? -1 : 1))
      t.push(opChar + nenc(e + 1499, 2) + nenc(mant, 9))
    }
    return t
  }
  if (typeof v === 'string') {
    t.push(sigT[6] + escapeStr(v) + '9')
    return t
  }
  if (v === true) { t.push(sigT[1] + sigT[1]); return t }
  if (v === false) { t.push(sigT[1] + sigT[2]); return t }
  t.push(sigT[1] + sigT[0])
  return t
}

function tenc(t: string[]): string[] {
  const fm = new Map<string, string>()
  for (let i = 3; i <= sigN - 1; i++) fm.set(sigT[1] + sigT[i], sigT[2] + sigT[i])
  const u = new Map<string, number | string>()
  const ua: string[] = []
  let fc = sigN - 3
  for (let i = 0; i < t.length; i++) {
    const k = t[i]
    if (fm.has(k)) { fc -= 1; fm.delete(k) }
    else if (u.has(k)) {
      const val = u.get(k)
      if (typeof val === 'number') u.set(k, val + 1)
    } else if (k.length >= 4) {
      ua.push(k)
      u.set(k, 1)
    }
  }
  ua.sort((a, b) => (b.length - 2) * ((u.get(b) as number) - 1) - (a.length - 2) * ((u.get(a) as number) - 1))
  for (let i = fc; i < ua.length; i++) u.delete(ua[i])
  const fmEntries = Array.from(fm.entries())
  let fmIdx = 0
  let r: string | undefined = fmEntries.length ? fmEntries[0][0] : undefined
  let s: string | undefined = fmEntries.length ? fmEntries[0][1] : undefined
  for (let i = 0; i < t.length; i++) {
    const uk = u.get(t[i])
    if (uk === undefined) {
      // unchanged
    } else if (typeof uk === 'string') {
      t[i] = uk
    } else if (r !== undefined && uk > 1) {
      u.set(t[i], r)
      t[i] = t[i] + s
      fmIdx += 1
      if (fmIdx < fmEntries.length) { r = fmEntries[fmIdx][0]; s = fmEntries[fmIdx][1] }
      else { r = undefined; s = undefined }
    }
  }
  return t
}

export function serializeRing(tbl: unknown, sign?: string): string {
  sign = sign || defaultSign
  const reg = buildRegMap()
  const payload = tenc(venc(tbl, [], reg)).join('')
  const body = sign + nenc(checksum(sign + payload), 7) + payload
  return body.replace(/(.{7})/g, '$1 ').replace(/ $/, '.')
}

function makeOps(ctx: { s: unknown[]; pri: string; rt: Map<number, unknown>; r: Map<number, unknown> }) {
  const { s, pri, rt, r } = ctx
  function regGet(idx: number): unknown { return r.has(idx) ? r.get(idx) : rt.get(idx) }
  function regSet(idx: number, val: unknown): void { r.set(idx, val) }
  const ops: Record<string, (d: number, pos: number) => [number, number]> = {}
  ops[sigT[1]] = (d, pos) => { s[d + 1] = regGet(sigB[pri.charCodeAt(pos - 1)]); return [d + 1, pos + 1] }
  ops[sigT[2]] = (d, pos) => { regSet(sigB[pri.charCodeAt(pos - 1)], s[d]); return [d, pos + 1] }
  ops[sigT[3]] = (d, pos) => {
    const n = sigB[pri.charCodeAt(pos - 1)]
    const arr: unknown[] = []
    for (let i = 1; i <= n; i++) arr[i - 1] = s[d - i + 1]
    s[d - n + 1] = arr
    return [d + 1 - n, pos + 1]
  }
  ops[sigT[4]] = (d, pos) => {
    const table = s[d - 2] as Record<string | number, unknown>
    const key = s[d] as string | number
    const val = s[d - 1]
    if (typeof key === 'number' && Number.isInteger(key) && key >= 1) (table as unknown as unknown[])[key - 1] = val
    else table[key] = val
    return [d - 2, pos]
  }
  ops[sigT[5]] = (d, pos) => { s[d + 1] = ndec(pri, pos, 4) - 1000000; return [d + 1, pos + 4] }
  ops[sigT[6]] = (d, pos) => {
    const idx0 = pri.indexOf('9', pos - 1)
    const raw = pri.slice(pos - 1, idx0)
    s[d + 1] = unescapeStr(raw)
    return [d + 1, idx0 + 2]
  }
  ops[sigT[7]] = (d, pos) => { s[d - 1] = (s[d - 1] as number) + (s[d] as number); return [d - 1, pos] }
  ops[sigT[8]] = (d, pos) => { s[d - 1] = (s[d - 1] as number) * (s[d] as number); return [d - 1, pos] }
  ops[sigT[9]] = (d, pos) => { s[d - 1] = (s[d - 1] as number) / (s[d] as number); return [d - 1, pos] }
  ops[sigT[10]] = (d, pos) => { s[d - 1] = (s[d - 1] as number) - (s[d] as number); return [d - 1, pos] }
  ops[sigT[11]] = (d, pos) => { s[d - 1] = Math.pow(s[d - 1] as number, s[d] as number); return [d - 1, pos] }
  ops[sigT[12]] = (d, pos) => { s[d - 1] = (s[d - 1] as number) * Math.pow(2, s[d] as number); return [d - 1, pos] }
  ops[sigT[13]] = (d, pos) => {
    s[d + 1] = Math.pow(2, ndec(pri, pos, 2) - 1500) * (ndec(pri, pos + 2, 9) * Math.pow(2, -52))
    return [d + 1, pos + 11]
  }
  ops[sigT[14]] = (d, pos) => {
    s[d + 1] = -Math.pow(2, ndec(pri, pos, 2) - 1500) * (ndec(pri, pos + 2, 9) * Math.pow(2, -52))
    return [d + 1, pos + 11]
  }
  ops[sigT[15]] = (d, pos) => { s[d - 1] = regGet(s[d] as number); return [d - 1, pos] }
  ops[sigT[16]] = (d, pos) => { regSet(s[d] as number, s[d - 1]); return [d - 1, pos] }
  return ops
}

export type UnserializeResult = { value: unknown } | { error: string }

export function unserializeRing(input: string): UnserializeResult {
  const cleaned = input.replace(/[^a-zA-Z0-9.]/g, '')
  const m = cleaned.match(new RegExp('^(.{' + defaultSign.length + '})(.{7})([^.]+)'))
  if (!m) return { error: "No se encontró un string OPie válido (debe empezar con 'oetohH7')." }
  const [, ssign, hchars, pri] = m
  if (ssign !== defaultSign) return { error: 'Firma desconocida: ' + ssign }
  const expected = nenc(checksum(ssign + pri), 7)
  if (expected !== hchars) return { error: 'Checksum inválido — el string está corrupto o incompleto.' }
  const rt = buildRT()
  const ctx = { s: [] as unknown[], pri, rt, r: new Map<number, unknown>() }
  const ops = makeOps(ctx)
  let depth = 0
  let pos = 1
  const len = pri.length
  try {
    while (pos <= len) {
      const opChar = pri[pos - 1]
      const fn = ops[opChar]
      if (!fn) return { error: "Opcode desconocido '" + opChar + "' en posición " + pos }
      ;[depth, pos] = fn(depth, pos + 1)
    }
  } catch (e) {
    return { error: 'Error decodificando: ' + (e as Error).message }
  }
  if (depth !== 1) return { error: 'Estructura inválida tras decodificar (depth=' + depth + ').' }
  return { value: ctx.s[1] }
}
