import type { SimulationContext, SimulationState, SimulationResult, SimulationStep, SimulationHooks, EventLogEntry } from '../types'
import type { GameModel } from '../game-model/types'
import { TypedEventBus } from '../event-bus'
import { defaultHooks } from '../hooks'
import { computeMetrics } from './metrics'
import { computeWarnings } from './warnings'

export function simulateCharacter(
  context: SimulationContext,
  initialState: SimulationState,
  gameModel: GameModel,
  eventBus = new TypedEventBus(),
  hooks: SimulationHooks = defaultHooks,
): SimulationResult {
  const state: SimulationState = {
    level: initialState.level,
    xp: initialState.xp,
    totalTime: initialState.totalTime,
    totalDungeons: initialState.totalDungeons,
    totalXP: initialState.totalXP,
    activeBuffs: [],
    breakpointsUnlocked: [...initialState.breakpointsUnlocked],
  }

  const history: SimulationStep[] = []
  const generatedEvents: EventLogEntry[] = []
  const objetivo = context.character.objetivo
  const maxLevel = gameModel.getMaxLevel()

  state.activeBuffs = gameModel.getActiveBuffs(state, context)

  while (state.level < objetivo) {
    hooks.beforeDungeon?.(state, context)

    const levelBefore = state.level
    const xpBefore = state.xp

    const breakdown = gameModel.calculateDungeonXp(state, context)
    if (breakdown.totalXP <= 0) break
    state.xp += breakdown.totalXP
    state.totalDungeons++
    state.totalTime += context.scenario.dungeonDuration
    state.totalXP += breakdown.totalXP

    const stepEvents: string[] = []

    while (state.xp >= gameModel.getXpRequired(state.level) && state.level < maxLevel) {
      state.xp -= gameModel.getXpRequired(state.level)
      state.level++

      const effects = gameModel.evaluateLevelUp(state, context)
      state.activeBuffs = [
        ...state.activeBuffs.filter(b => !effects.removeBuffIds.includes(b.id)),
        ...effects.addBuffs,
      ]
      state.activeBuffs = gameModel.getActiveBuffs(state, context)

      eventBus.emit('level-up', { level: state.level, state })
      stepEvents.push('level-up')
      hooks.afterLevelUp?.(state, context)
    }

    const breakpoints = gameModel.checkBreakpoints(state, context)
    for (const bp of breakpoints) {
      if (!state.breakpointsUnlocked.includes(bp)) {
        state.breakpointsUnlocked.push(bp)
        eventBus.emit('breakpoint-unlocked', { breakpoint: bp, state })
        stepEvents.push('breakpoint-unlocked')
      }
    }

    const rewardTotal = breakdown.baseRewardXP + breakdown.rewardModifiers.reduce((s, m) => s + m.contribution, 0)
    const monsterTotal = breakdown.baseMonsterXP + breakdown.monsterModifiers.reduce((s, m) => s + m.contribution, 0)

    const step: SimulationStep = {
      dungeonNumber: state.totalDungeons,
      levelBefore,
      levelAfter: state.level,
      xpBefore,
      xpAfter: state.xp,
      rewardXP: rewardTotal,
      monsterXP: monsterTotal,
      totalXP: breakdown.totalXP,
      modifiers: [...breakdown.rewardModifiers, ...breakdown.monsterModifiers],
      activeBuffs: [...state.activeBuffs],
      cumulativeTime: state.totalTime / 60,
      cumulativeDungeons: state.totalDungeons,
      cumulativeXP: state.totalXP,
      breakpointsUnlocked: [...state.breakpointsUnlocked],
      eventsGenerated: stepEvents,
    }

    history.push(step)
    eventBus.emit('dungeon-completed', { step, state })
    hooks.afterDungeon?.(state, step, context)

    if (state.level >= objetivo) break
  }

  eventBus.emit('target-reached', { state })

  const result: SimulationResult = {
    context,
    finalState: state,
    history,
    metrics: computeMetrics(state, history),
    warnings: computeWarnings(context),
    generatedEvents,
  }

  eventBus.emit('simulation-finished', { result })
  hooks.afterSimulation?.(result)

  return result
}
