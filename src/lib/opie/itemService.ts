import itemDb from '../data/itemDb.json'
import type { SpellInfo } from '../keybinds/types'

const CACHE_KEY = 'opie_item_cache'
const ICON_CDN = 'https://wow.zamimg.com/images/wow/icons/medium'

interface DbEntry {
  name: string
  icon: string
}

type ItemDb = Record<string, DbEntry>

const db = itemDb as ItemDb
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

export function getItemInfo(itemId: number): SpellInfo {
  if (cache[itemId]) return cache[itemId]

  const entry = db[String(itemId)]
  if (entry) {
    const info: SpellInfo = {
      id: itemId,
      name: entry.name,
      iconUrl: entry.icon ? `${ICON_CDN}/${entry.icon}.jpg` : '',
    }
    cache[itemId] = info
    saveCache()
    return info
  }

  return {
    id: itemId,
    name: `#${itemId}`,
    iconUrl: '',
  }
}

export function searchItems(query: string, limit = 20): SpellInfo[] {
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
