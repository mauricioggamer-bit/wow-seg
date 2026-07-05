const STORAGE_KEY_XP = 'wowseg_xp_overrides'
const STORAGE_KEY_DUNGEON_XP = 'wowseg_dungeon_xp_overrides'

function loadOverrides(key: string): Record<number, number> {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* empty */ }
  return {}
}

function saveOverrides(key: string, overrides: Record<number, number>): void {
  try {
    localStorage.setItem(key, JSON.stringify(overrides))
  } catch { /* empty */ }
}

export function getXpOverrides(): Record<number, number> {
  return loadOverrides(STORAGE_KEY_XP)
}

export function saveXpOverrides(overrides: Record<number, number>): void {
  saveOverrides(STORAGE_KEY_XP, overrides)
}

export function clearXpOverrides(): void {
  try { localStorage.removeItem(STORAGE_KEY_XP) } catch { /* empty */ }
}

export function getDungeonXpOverrides(): Record<number, number> {
  return loadOverrides(STORAGE_KEY_DUNGEON_XP)
}

export function saveDungeonXpOverrides(overrides: Record<number, number>): void {
  saveOverrides(STORAGE_KEY_DUNGEON_XP, overrides)
}

export function clearDungeonXpOverrides(): void {
  try { localStorage.removeItem(STORAGE_KEY_DUNGEON_XP) } catch { /* empty */ }
}
