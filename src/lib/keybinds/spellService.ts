import spellDb from '../data/spellDb.json'
import type { SpellInfo } from './types'

const CACHE_KEY = 'wow_spell_cache'
const ICON_CDN = 'https://wow.zamimg.com/images/wow/icons/medium'
const PROXY_URLS = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
]

interface DbEntry {
  name: string
  icon: string
}

type SpellDb = Record<string, DbEntry>

const db = spellDb as SpellDb
let cache: Record<number, SpellInfo> = {}

function loadCache(): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) cache = JSON.parse(raw)
  } catch { cache = {} }
}

function saveCache(): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch { /* empty */ }
}

loadCache()

export function getSpellInfo(spellId: number): SpellInfo {
  if (cache[spellId]) return cache[spellId]

  const entry = db[String(spellId)]
  if (entry) {
    const info: SpellInfo = {
      id: spellId,
      name: entry.name,
      iconUrl: entry.icon ? `${ICON_CDN}/${entry.icon}.jpg` : '',
    }
    cache[spellId] = info
    saveCache()
    return info
  }

  return {
    id: spellId,
    name: `#${spellId}`,
    iconUrl: '',
  }
}

export async function fetchSpellFromProxy(spellId: number): Promise<SpellInfo | null> {
  const cached = cache[spellId]
  if (cached && cached.name !== `#${spellId}`) return cached

  for (const proxy of PROXY_URLS) {
    try {
      const url = `${proxy}https://wowdb.com/api/spell/${spellId}`
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
      if (!res.ok) continue
      const text = await res.text()
      const match = text.match(/^\(({.*})\)$/s)
      const json = match ? JSON.parse(match[1]) : JSON.parse(text)
      const info: SpellInfo = {
        id: spellId,
        name: json.Name || `#${spellId}`,
        iconUrl: json.Icon ? `${ICON_CDN}/${json.Icon}.jpg` : '',
      }
      cache[spellId] = info
      saveCache()
      return info
    } catch { continue }
  }

  return null
}

export function prefetchSpellData(spellIds: number[]): Record<number, SpellInfo> {
  const result: Record<number, SpellInfo> = {}
  for (const id of spellIds) {
    result[id] = getSpellInfo(id)
  }
  return result
}

export function getMountInfo(mountId: number): SpellInfo {
  return getSpellInfo(mountId)
}

export function getSpellName(spellId: number): string {
  return getSpellInfo(spellId).name
}

export function getSpellIconUrl(spellId: number): string {
  return getSpellInfo(spellId).iconUrl
}

export function searchSpells(query: string, limit = 20): SpellInfo[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  const results: SpellInfo[] = []
  for (const [id, entry] of Object.entries(db)) {
    if (entry.name.toLowerCase().includes(q)) {
      results.push({
        id: parseInt(id),
        name: entry.name,
        iconUrl: entry.icon ? `${ICON_CDN}/${entry.icon}.jpg` : '',
      })
      if (results.length >= limit) break
    }
  }
  return results.sort((a, b) => a.name.localeCompare(b.name))
}
