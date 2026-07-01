import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const defaultsSrc = readFileSync(resolve(ROOT, 'src/lib/data/keybindDefaults.ts'), 'utf8')
const startIdx = defaultsSrc.indexOf('export const DEFAULT_KEYBIND_STRINGS')
const objStart = defaultsSrc.indexOf('{', startIdx)
let depth = 0, endIdx = objStart
for (let i = objStart; i < defaultsSrc.length; i++) {
  if (defaultsSrc[i] === '{') depth++
  else if (defaultsSrc[i] === '}') { depth--; if (depth === 0) { endIdx = i; break } }
}
const DEFAULT_KEYBIND_STRINGS = eval('(' + defaultsSrc.slice(objStart, endIdx + 1) + ')')

function safeAtob(str) { try { return atob(str) } catch { return atob(str + '='.repeat((4 - str.length % 4) % 4)) } }

const spellIds = new Set()
const mountIds = new Set()
for (const base64 of Object.values(DEFAULT_KEYBIND_STRINGS)) {
  const raw = safeAtob(base64)
  const entries = raw.split('|').filter(Boolean)
  for (const entry of entries) {
    if (entry.startsWith('0,_header,')) continue
    if (entry.includes('#5') || entry.includes('#4')) continue
    const parts = entry.split(',')
    const t = parts[1]
    if (t === 'spell') spellIds.add(parseInt(parts[2]))
    else if (t === 'summonmount') mountIds.add(parseInt(parts[2]))
  }
}

const allIds = [...new Set([...spellIds, ...mountIds])]
console.log(`Found ${spellIds.size} spell IDs + ${mountIds.size} mount IDs = ${allIds.length} total`)

async function fetchSpell(id, retries = 2) {
  const url = `https://wowdb.com/api/spell/${id}`
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const match = text.match(/^\(({.*})\)$/s)
      const json = match ? JSON.parse(match[1]) : JSON.parse(text)
      return {
        name: json.Name || `#${id}`,
        icon: json.Icon || '',
      }
    } catch (e) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      console.error(`  FAIL ${id}: ${e.message}`)
      return null
    }
  }
}

const results = {}
let done = 0
let failed = 0
const BATCH = 50

for (let i = 0; i < allIds.length; i++) {
  const id = allIds[i]
  const data = await fetchSpell(id)
  if (data) {
    results[id] = data
  } else {
    failed++
  }
  done++
  if (done % BATCH === 0 || done === allIds.length) {
    console.log(`  ${done}/${allIds.length} (${failed} failed)`)
  }
  if (i < allIds.length - 1) {
    await new Promise(r => setTimeout(r, 100))
  }
}

const jsonPath = resolve(ROOT, 'src/lib/data/spellDb.json')
const output = {}
for (const id of Object.keys(results).sort((a, b) => parseInt(a) - parseInt(b))) {
  output[id] = results[id]
}
writeFileSync(jsonPath, JSON.stringify(output, null, 0))

console.log(`\nWritten ${Object.keys(output).length} entries to spellDb.json`)
console.log(`Failed: ${failed}`)
if (failed > 0) {
  const missing = allIds.filter(id => !results[id])
  console.log('Missing IDs:', missing.join(', '))
}
