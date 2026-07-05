import type { SimulationState, SimulationContext, DungeonXpBreakdown, ActiveBuff } from '../types'

export interface LevelUpEffects {
  addBuffs: ActiveBuff[]
  removeBuffIds: string[]
}

export interface GameModel {
  getMaxLevel(): number
  getXpRequired(level: number): number
  calculateDungeonXp(state: SimulationState, ctx: SimulationContext): DungeonXpBreakdown
  getActiveBuffs(state: SimulationState, ctx: SimulationContext): ActiveBuff[]
  evaluateLevelUp(state: SimulationState, ctx: SimulationContext): LevelUpEffects
  checkBreakpoints(state: SimulationState, ctx: SimulationContext): string[]
}
