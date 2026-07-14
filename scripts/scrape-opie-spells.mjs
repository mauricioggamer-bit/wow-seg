import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const jsonPath = resolve(ROOT, 'src/lib/data/spellDb.json')

// Additional spell/mount IDs seen in imported OPie rings that weren't part
// of the original keybind-derived spellDb.json (scripts/scrape-spells.mjs
// rebuilds that file from scratch from keybindDefaults.ts, so it can't be
// used to top up ids from other sources — this script merges instead).
const SEED_IDS = [
  407, 460, 974, 1126, 1459, 2823, 3408, 5761, 6673, 21562, 33757, 52127,
  150544, 192106, 315584, 318038, 364342, 381637, 381664, 408233, 431280,
  433568, 433583, 436854, 460905, 474750,
]

function idsFromArgv() {
  const path = process.argv[2]
  if (!path) return []
  const raw = JSON.parse(readFileSync(path, 'utf8'))
  const list = Array.isArray(raw) ? raw : (raw.data?.opieRings ?? raw.opieRings ?? [])
  const ids = new Set()
  for (const entry of list) {
    if (typeof entry === 'number') { ids.add(entry); continue }
    const slices = entry.slices ?? (Array.isArray(entry) ? entry : [])
    for (const s of slices) {
      if ((s.type === 'spell' || s.type === 'mount') && s.arg !== undefined) {
        const id = Number(s.arg)
        if (!isNaN(id)) ids.add(id)
      }
    }
  }
  return [...ids]
}

const allIds = [...new Set([...SEED_IDS, ...idsFromArgv()])]
console.log(`Scraping ${allIds.length} spell/mount IDs`)

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
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      console.error(`  FAIL ${id}: ${e.message}`)
      return null
    }
  }
}

const existing = existsSync(jsonPath) ? JSON.parse(readFileSync(jsonPath, 'utf8')) : {}
const results = { ...existing }
let done = 0
let failed = 0

for (const id of allIds) {
  if (results[id]) { done++; continue } // already scraped, skip re-fetch
  const data = await fetchSpell(id)
  if (data) results[id] = data
  else failed++
  done++
  console.log(`  ${done}/${allIds.length} (${failed} failed)`)
  await new Promise((r) => setTimeout(r, 100))
}

const output = {}
for (const id of Object.keys(results).sort((a, b) => parseInt(a) - parseInt(b))) {
  output[id] = results[id]
}
writeFileSync(jsonPath, JSON.stringify(output, null, 0))

console.log(`\nWritten ${Object.keys(output).length} entries to spellDb.json`)
console.log(`Failed: ${failed}`)
