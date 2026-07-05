import { DUNGEON_REWARD_XP_TABLE } from './dungeon-reward'

export const MONSTER_XP_REF_LEVEL = 80

export function getMonsterXpForLevel(level: number, monsterXpAt80: number): number {
  if (monsterXpAt80 <= 0) return 0
  const rewardAt80 = DUNGEON_REWARD_XP_TABLE[MONSTER_XP_REF_LEVEL]
  if (rewardAt80 <= 0) return 0
  const rewardAtLevel = DUNGEON_REWARD_XP_TABLE[level] ?? 0
  return Math.round(monsterXpAt80 * (rewardAtLevel / rewardAt80))
}
