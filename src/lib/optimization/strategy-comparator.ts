import type { Personaje, LevelingConfig } from '../types'
import type { Strategy } from './strategy'
import type { ObjectiveWeights } from './objective-function'
import type { TemporalSimulationResult } from './temporal-simulator'
import { runTemporalSimulation } from './temporal-simulator'
import { computeObjectiveScore } from './objective-function'

export interface StrategyResult {
  strategy: Strategy
  result: TemporalSimulationResult
  score: number
}

export function compareStrategies(
  strategies: Strategy[],
  roster: Personaje[],
  config: LevelingConfig,
  weights: ObjectiveWeights,
  horasDisponiblesSemana: number,
  fechaInicio: Date,
  fechaLimite: Date,
): StrategyResult[] {
  const totalPendientes = roster.filter(p => p.planeado_usar && p.nivel < 90).length

  const results: StrategyResult[] = strategies.map(strategy => {
    const result = runTemporalSimulation(
      strategy,
      roster,
      config,
      horasDisponiblesSemana,
      fechaInicio,
      fechaLimite,
    )
    const score = computeObjectiveScore(result.outcome, weights, totalPendientes)
    return { strategy, result, score }
  })

  results.sort((a, b) => b.score - a.score)
  return results
}
