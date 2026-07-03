const XP_ANCHORS: Record<number, number> = {
  10: 8490,
  11: 8150,
  12: 9210,
  13: 10335,
  14: 11510,
  15: 12745,
  16: 14035,
  17: 15385,
  18: 16790,
  19: 18250,
  20: 19770,
  21: 21345,
  22: 22975,
  23: 24665,
  24: 26410,
  25: 28210,
  26: 30070,
  27: 31985,
  28: 33960,
  29: 35985,
  30: 32075,
  41: 37450,
  50: 40435,
  57: 48775,
  70: 58645,
  80: 403725,
}

const DUNGEON_XP_ANCHORS: Record<number, number> = {
  30: 37500,
  41: 50400,
  50: 61350,
  57: 68850,
  70: 85650,
  80: 105900,
}

function interpolate(anchors: Record<number, number>, level: number, extrapolate = false): number {
  const keys = Object.keys(anchors).map(Number).sort((a, b) => a - b)
  if (level < keys[0]) return anchors[keys[0]]
  if (level >= keys[keys.length - 1]) {
    if (!extrapolate) return anchors[keys[keys.length - 1]]
    const lastKey = keys[keys.length - 1]
    const prevKey = keys[keys.length - 2]
    const step = (anchors[lastKey] - anchors[prevKey]) / (lastKey - prevKey)
    return Math.round(anchors[lastKey] + step * (level - lastKey))
  }
  for (let i = 0; i < keys.length - 1; i++) {
    if (level >= keys[i] && level < keys[i + 1]) {
      const t = (level - keys[i]) / (keys[i + 1] - keys[i])
      return Math.round(anchors[keys[i]] + t * (anchors[keys[i + 1]] - anchors[keys[i]]))
    }
  }
  return anchors[keys[keys.length - 1]]
}

function buildXpCurve(): Record<number, number> {
  const curve: Record<number, number> = {}
  const overrides = loadXpOverrides()
  for (let level = 10; level <= 90; level++) {
    if (overrides[level] !== undefined) {
      curve[level] = overrides[level]
    } else {
      curve[level] = interpolate(XP_ANCHORS, level, level > 80)
    }
  }
  return curve
}

const STORAGE_KEY_OVERRIDES = 'wowseg_xp_overrides'

function loadXpOverrides(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OVERRIDES)
    if (raw) return JSON.parse(raw)
  } catch { /* empty */ }
  return {}
}

export function saveXpOverrides(overrides: Record<number, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides))
  } catch { /* empty */ }
}

export function clearXpOverrides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_OVERRIDES)
  } catch { /* empty */ }
}

export function getXpOverrides(): Record<number, number> {
  return loadXpOverrides()
}

let xpCurve = buildXpCurve()

export function rebuildXpCurve(): void {
  xpCurve = buildXpCurve()
}

export const XP_CURVE = new Proxy({} as Record<number, number>, {
  get(_target, prop: string) {
    return xpCurve[Number(prop)]
  },
})

export const MAX_LEVEL = 90
export const DEFAULT_OBJETIVO_NIVEL = 90

export function getXpForLevel(level: number): number {
  return XP_CURVE[level] ?? 0
}

export function getDungeonXpForLevel(level: number): number {
  return interpolate(DUNGEON_XP_ANCHORS, level, level > 80)
}

export const DUNGEON_XP_TABLE: { level: number; xp: number }[] = (() => {
  const table: { level: number; xp: number }[] = []
  for (let l = 10; l <= 90; l++) {
    table.push({ level: l, xp: getDungeonXpForLevel(l) })
  }
  return table
})()

const MONSTER_XP_REF_LEVEL = 80

export function getMonsterXpForLevel(level: number, monsterXpAt80: number): number {
  if (monsterXpAt80 <= 0) return 0
  const rewardAt80 = getDungeonXpForLevel(MONSTER_XP_REF_LEVEL)
  if (rewardAt80 <= 0) return 0
  const rewardAtLevel = getDungeonXpForLevel(level)
  return Math.round(monsterXpAt80 * (rewardAtLevel / rewardAt80))
}