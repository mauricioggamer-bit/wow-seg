/**
 * XP_REQUIRED_PER_LEVEL — XP necesaria para subir de nivel (curva de Timewalking)
 *
 * Fuente: tabla oficial de WoW Timewalking (Col C).
 * Niveles 1-79: escalado de Timewalking (acelerado vs retail).
 * Niveles 80-89: Timewalking + 33.3% bonus (tramo final endurecido).
 * Nivel 90: 99,999,999 = nivel máximo, no se puede subir más.
 *
 * Antes estos valores eran anclas dispersas con interpolación lineal,
 * lo que producía drift en tramos sin ancla (31-40, 42-49, 51-56, 58-69).
 * Ahora son exactos nivel por nivel.
 */
const XP_REQUIRED_PER_LEVEL: Record<number, number> = {
  1: 250, 2: 655, 3: 1245, 4: 2025, 5: 2995,
  6: 4155, 7: 5505, 8: 7040, 9: 8770, 10: 10590,
  11: 11685, 12: 12795, 13: 13920, 14: 15055, 15: 16210,
  16: 17380, 17: 18560, 18: 19755, 19: 20970, 20: 22195,
  21: 23435, 22: 24690, 23: 25960, 24: 27245, 25: 28545,
  26: 29860, 27: 31190, 28: 32535, 29: 33890, 30: 32075,
  31: 32700, 32: 33295, 33: 33865, 34: 34410, 35: 34925,
  36: 35415, 37: 35875, 38: 36310, 39: 36720, 40: 37100,
  41: 37450, 42: 37780, 43: 38075, 44: 38350, 45: 38595,
  46: 38810, 47: 39000, 48: 39165, 49: 39300, 50: 40435,
  51: 41590, 52: 42750, 53: 43930, 54: 45120, 55: 46325,
  56: 47545, 57: 48775, 58: 50020, 59: 51280, 60: 52555,
  61: 53840, 62: 55140, 63: 56455, 64: 57780, 65: 59120,
  66: 60475, 67: 61845, 68: 63225, 69: 64620, 70: 58645,
  71: 60335, 72: 62045, 73: 63780, 74: 65540, 75: 67325,
  76: 69130, 77: 70965, 78: 72820, 79: 74700,
  80: 403725, 81: 423390, 82: 443395, 83: 463740, 84: 484430,
  85: 505455, 86: 526825, 87: 548535, 88: 570590, 89: 592980,
  90: 99999999,
}

/**
 * DUNGEON_REWARD_XP_TABLE — XP de recompensa por completar una dungeon de Timewalking
 *
 * Esta es la XP base que recibís al completar la dungeon (no incluye monstruos).
 * Valores reales (medidos) en niveles 30, 41, 50, 57, 70, 80, 89.
 * Valores extrapolados por fórmula de tramo (10-79 y 80-90) en el resto.
 * Antes eran 6 anclas dispersas con interpolación lineal — ahora tabla exacta.
 * El usuario puede sobreescribir valores exactos via DungeonXpModal.
 */
const DUNGEON_REWARD_XP_TABLE: Record<number, number> = {
  1: 2541, 2: 3739, 3: 4937, 4: 6135, 5: 7333,
  6: 8531, 7: 9729, 8: 10927, 9: 12125,
  10: 13323, 11: 14521, 12: 15718, 13: 16916, 14: 18113,
  15: 19311, 16: 20509, 17: 21706, 18: 22904, 19: 24101,
  20: 25299, 21: 26497, 22: 27694, 23: 28892, 24: 30089,
  25: 31287, 26: 32485, 27: 33682, 28: 34880, 29: 36077,
  30: 37500, 31: 38473, 32: 39670, 33: 40868, 34: 42065,
  35: 43263, 36: 44461, 37: 45658, 38: 46856, 39: 48053,
  40: 49251, 41: 50400, 42: 51646, 43: 52844, 44: 54041,
  45: 55239, 46: 56437, 47: 57634, 48: 58832, 49: 60029,
  50: 61350, 51: 62425, 52: 63622, 53: 64820, 54: 66017,
  55: 67215, 56: 68413, 57: 68850, 58: 70808, 59: 72005,
  60: 73203, 61: 74401, 62: 75598, 63: 76796, 64: 77993,
  65: 79191, 66: 80389, 67: 81586, 68: 82784, 69: 83981,
  70: 85650, 71: 86377, 72: 87574, 73: 88772, 74: 89969,
  75: 91167, 76: 92365, 77: 93562, 78: 94760, 79: 95957,
  80: 105900, 81: 107110, 82: 108321, 83: 109532, 84: 110743,
  85: 111954, 86: 113166, 87: 114377, 88: 115588, 89: 116800,
  90: 118010,
}

/* ---- XP_CURVE builder (lookup directo, sin interpolación) ---- */

function buildXpCurve(): Record<number, number> {
  const curve: Record<number, number> = {}
  const overrides = loadXpOverrides()
  for (let level = 1; level <= 90; level++) {
    if (overrides[level] !== undefined) {
      curve[level] = overrides[level]
    } else {
      curve[level] = XP_REQUIRED_PER_LEVEL[level] ?? 0
    }
  }
  return curve
}

/* ---- XP overrides (usuario edita XP necesaria por nivel) ---- */

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

/* ---- Dungeon XP overrides (usuario edita XP de recompensa por dungeon) ---- */

const STORAGE_KEY_DUNGEON_OVERRIDES = 'wowseg_dungeon_xp_overrides'

function loadDungeonXpOverrides(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DUNGEON_OVERRIDES)
    if (raw) return JSON.parse(raw)
  } catch { /* empty */ }
  return {}
}

export function saveDungeonXpOverrides(overrides: Record<number, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY_DUNGEON_OVERRIDES, JSON.stringify(overrides))
  } catch { /* empty */ }
}

export function clearDungeonXpOverrides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DUNGEON_OVERRIDES)
  } catch { /* empty */ }
}

export function getDungeonXpOverrides(): Record<number, number> {
  return loadDungeonXpOverrides()
}

let dungeonXpOverrides = loadDungeonXpOverrides()

export function rebuildDungeonXpCurve(): void {
  dungeonXpOverrides = loadDungeonXpOverrides()
}

/* ---- XP_CURVE proxy (reactive lookup) ---- */

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

/**
 * getDungeonXpForLevel — XP de recompensa por completar una dungeon de Timewalking
 *
 * No incluye XP de monstruos (ver getMonsterXpForLevel).
 * Consulta overrides del usuario primero; si no hay, lookup directo en la tabla exacta.
 */
export function getDungeonXpForLevel(level: number): number {
  if (dungeonXpOverrides[level] !== undefined) return dungeonXpOverrides[level]
  return DUNGEON_REWARD_XP_TABLE[level] ?? 0
}

export const DUNGEON_XP_TABLE: { level: number; xp: number }[] = (() => {
  const table: { level: number; xp: number }[] = []
  for (let l = 1; l <= 90; l++) {
    table.push({ level: l, xp: getDungeonXpForLevel(l) })
  }
  return table
})()

/**
 * getMonsterXpForLevel — XP total de monstruos derrotados en una dungeon
 *
 * Escala proporcionalmente a la recompensa de dungeon del mismo nivel.
 * El valor base se configura en xpMonstruos @80 (LevelingConfig) y se escala.
 */
const MONSTER_XP_REF_LEVEL = 80

export function getMonsterXpForLevel(level: number, monsterXpAt80: number): number {
  if (monsterXpAt80 <= 0) return 0
  const rewardAt80 = getDungeonXpForLevel(MONSTER_XP_REF_LEVEL)
  if (rewardAt80 <= 0) return 0
  const rewardAtLevel = getDungeonXpForLevel(level)
  return Math.round(monsterXpAt80 * (rewardAtLevel / rewardAt80))
}