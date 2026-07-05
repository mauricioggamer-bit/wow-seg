import type { SimulationState, SimulationStep, SimulationMetrics } from '../types'

export function computeMetrics(state: SimulationState, history: SimulationStep[]): SimulationMetrics {
  const totalXP = state.totalXP
  const totalTime = state.totalTime
  const totalDungeons = state.totalDungeons

  const dungeonsPerLevel: Record<number, number> = {}
  const xpPerLevel: Record<number, number> = {}

  for (const step of history) {
    const levelKey = step.levelAfter
    dungeonsPerLevel[levelKey] = (dungeonsPerLevel[levelKey] ?? 0) + 1
    xpPerLevel[levelKey] = (xpPerLevel[levelKey] ?? 0) + step.totalXP
  }

  return {
    totalXP,
    totalTime,
    totalDungeons,
    xpPerHour: totalTime > 0 ? Math.round(totalXP / (totalTime / 60)) : 0,
    xpPerDungeon: totalDungeons > 0 ? Math.round(totalXP / totalDungeons) : 0,
    averageDungeonTime: totalDungeons > 0 ? totalTime / totalDungeons : 0,
    dungeonsPerLevel,
    efficiency: _computeEfficiency(state, history),
    xpPerLevel,
  }
}

function _computeEfficiency(state: SimulationState, _history: SimulationStep[]): number {
  return 1
}
