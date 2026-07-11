import type { LevelingConfig } from '../types'
import { WoWRetailModel } from './game-model/wow-retail'
import { createContext, createLevelState } from './context'
import type { SimulationScenario } from './types'
import { getXpForLevel } from '../constants/experience'

const defaultScenario: SimulationScenario = {
  expansion: 'retail',
  version: '11.0.2',
  activeEvent: null,
  dungeonDuration: 18,
  globalBuffs: [],
  maxLevel: 90,
  ignoreDone: false,
}

export function getDungeonXpAtLevel(
  level: number,
  config: LevelingConfig,
  count90 = 0,
  timewaysPct = 0,
): number {
  const model = new WoWRetailModel()
  const ctx = createContext(
    { nombre: '', clase: '', nivel: level, xp: 0, objetivo: 90, timewaysPct },
    defaultScenario,
    config,
    count90,
  )
  const state = createLevelState(level, ctx)
  return model.calculateDungeonXp(state, ctx).totalXP
}

export function getBuffPercentages(
  level: number,
  config: LevelingConfig,
  count90 = 0,
  timewaysPct = 0,
): { rewardPct: number; monsterPct: number } {
  const model = new WoWRetailModel()
  const ctx = createContext(
    { nombre: '', clase: '', nivel: level, xp: 0, objetivo: 90, timewaysPct },
    defaultScenario,
    config,
    count90,
  )
  const state = createLevelState(level, ctx)
  const buffs = model.getActiveBuffs(state, ctx)
  let rewardPct = 0
  let monsterPct = 0
  for (const b of buffs) {
    if (b.source === 'reward' || b.source === 'both') rewardPct += b.pct
    if (b.source === 'monsters' || b.source === 'both') monsterPct += b.pct
  }
  return { rewardPct, monsterPct }
}

export function getXpRequired(level: number): number {
  return getXpForLevel(level)
}
