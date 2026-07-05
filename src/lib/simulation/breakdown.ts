import type { SimulationResult } from './types'
import type { GameModel } from './game-model/types'
import type { LevelBreakdownEntry } from '../types'
import { createLevelState } from './context'

export function buildBreakdown(
  result: SimulationResult,
  gameModel: GameModel,
  objetivo: number,
): LevelBreakdownEntry[] {
  const startLevel = result.context.character.nivel
  if (startLevel >= objetivo) return []
  const maxLevel = Math.min(objetivo, gameModel.getMaxLevel())
  const entries: LevelBreakdownEntry[] = []
  const dungeonsPerLevel: Record<number, number> = {}

  for (const step of result.history) {
    dungeonsPerLevel[step.levelBefore] = (dungeonsPerLevel[step.levelBefore] ?? 0) + 1
  }

  let cumDungeons = 0
  let cumTimeHours = 0
  for (let l = startLevel; l < maxLevel; l++) {
    const dungs = dungeonsPerLevel[l] ?? 0
    const synState = createLevelState(l, result.context)
    const xpDung = gameModel.calculateDungeonXp(synState, result.context).totalXP
    const xpNeeded = gameModel.getXpRequired(l)
    cumDungeons += dungs
    cumTimeHours += (dungs * result.context.scenario.dungeonDuration) / 60
    entries.push({
      level: l,
      xpNeeded,
      xpPerDungeon: xpDung,
      dungeons: dungs,
      cumulativeDungeons: cumDungeons,
      cumulativeTime: cumTimeHours,
    })
  }
  return entries
}
