import type { SimulationState, SimulationContext, DungeonXpBreakdown, ActiveBuff, ModifierContribution } from '../types'
import { getXpForLevel, getDungeonXpForLevel, getMonsterXpForLevel } from '../../constants/experience'
import type { GameModel, LevelUpEffects } from './types'

export class WoWRetailModel implements GameModel {
  getMaxLevel(): number {
    return 90
  }

  getXpRequired(level: number): number {
    return getXpForLevel(level)
  }

  getActiveBuffs(state: SimulationState, ctx: SimulationContext): ActiveBuff[] {
    const buffs: ActiveBuff[] = []
    const level = state.level
    const maxLevel = this.getMaxLevel()
    const { config, character, rosterCount90 } = ctx

    if (character.timewaysPct > 0) {
      buffs.push({ id: 'timeways', name: 'Timeways', pct: character.timewaysPct, source: 'both' })
    }

    if (level < 80 && config.warbandMentor080 > 0) {
      buffs.push({ id: 'warband-080', name: 'Warband 0-80', pct: config.warbandMentor080, source: 'both' })
    }

    if (level >= 80 && level < maxLevel) {
      const mentorPct = Math.min(rosterCount90 * 5, 25)
      if (mentorPct > 0) {
        buffs.push({ id: 'warband-8090', name: 'Warband 80-90', pct: mentorPct, source: 'both' })
      }
    }

    if (config.warMode) {
      const target = config.warModeTarget ?? 'both'
      buffs.push({ id: 'war-mode', name: 'War Mode', pct: 15, source: target })
    }

    for (const cb of config.customBuffs) {
      buffs.push({ id: cb.id, name: cb.name, pct: cb.percentage, source: cb.target })
    }

    return buffs
  }

  calculateDungeonXp(state: SimulationState, ctx: SimulationContext): DungeonXpBreakdown {
    const level = state.level
    const baseReward = getDungeonXpForLevel(level)
    const baseMonster = getMonsterXpForLevel(level, ctx.config.xpMonstruos)
    const buffs = this.getActiveBuffs(state, ctx)

    const rewardModifiers = this._applyModifiers(baseReward, buffs, 'reward')
    const monsterModifiers = this._applyModifiers(baseMonster, buffs, 'monsters')

    const rewardTotal = baseReward + rewardModifiers.reduce((s, m) => s + m.contribution, 0)
    const monsterTotal = baseMonster + monsterModifiers.reduce((s, m) => s + m.contribution, 0)

    return {
      baseRewardXP: baseReward,
      baseMonsterXP: baseMonster,
      totalBaseXP: baseReward + baseMonster,
      rewardModifiers,
      monsterModifiers,
      totalXP: rewardTotal + monsterTotal,
    }
  }

  evaluateLevelUp(_state: SimulationState, _ctx: SimulationContext): LevelUpEffects {
    return { addBuffs: [], removeBuffIds: [] }
  }

  checkBreakpoints(state: SimulationState, _ctx: SimulationContext): string[] {
    const breakpoints: string[] = []
    if (state.level >= 80 && !state.breakpointsUnlocked.includes('warband-80')) {
      breakpoints.push('warband-80')
    }
    return breakpoints
  }

  private _applyModifiers(
    base: number,
    buffs: ActiveBuff[],
    target: 'reward' | 'monsters',
  ): ModifierContribution[] {
    const modifiers: ModifierContribution[] = []
    let running = base

    for (const buff of buffs) {
      if (buff.source !== target && buff.source !== 'both') continue
      const contribution = Math.round(base * buff.pct / 100)
      running += contribution
      modifiers.push({
        id: buff.id,
        name: buff.name,
        pct: buff.pct,
        contribution,
        runningTotal: running,
      })
    }

    return modifiers
  }
}
