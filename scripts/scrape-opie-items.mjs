import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const jsonPath = resolve(ROOT, 'src/lib/data/itemDb.json')

// IDs seen so far in rings imported from the game (item + toy slices share
// the item namespace in WoW). Extend this list — or pass a JSON file of
// {type, arg} slices / plain ids as argv[2] — whenever new rings reference
// ids not yet in itemDb.json.
const SEED_IDS = [
  6948, 64488, 235016, 236687, 54452, 93672, 142542, 165669, 165670, 250411,
  166746, 166747, 246565, 163045, 168907, 172179, 182773, 184353, 180290,
  183716, 188952, 190196, 190237, 193588, 245970, 200630, 206195, 208704,
  209035, 212337, 228940, 210455,
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
      if ((s.type === 'item' || s.type === 'toy') && s.arg !== undefined) {
        const id = Number(s.arg)
        if (!isNaN(id)) ids.add(id)
      }
    }
  }
  return [...ids]
}

const allIds = [...new Set([...SEED_IDS, ...idsFromArgv()])]
console.log(`Scraping ${allIds.length} item IDs`)

async function fetchItem(id, retries = 2) {
  const url = `https://www.wowdb.com/api/item/${id}`
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
  const data = await fetchItem(id)
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

console.log(`\nWritten ${Object.keys(output).length} entries to itemDb.json`)
console.log(`Failed: ${failed}`)
