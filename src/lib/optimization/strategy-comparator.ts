import type { Personaje, LevelingConfig } from '../types'
import type { Strategy } from './strategy'
import type { ObjectiveWeights } from './objective-function'
import type { TemporalSimulationResult, PatronSemanal } from './temporal-simulator'
import { runTemporalSimulation } from './temporal-simulator'
import { computeObjectiveScore, computeNormalizationCaps } from './objective-function'

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
  patronSemanal?: PatronSemanal,
): StrategyResult[] {
  const totalPendientes = roster.filter(p => p.planeado_usar && p.nivel < 90).length
  const caps = computeNormalizationCaps(roster, config, horasDisponiblesSemana, fechaInicio, fechaLimite, patronSemanal)

  const results: StrategyResult[] = strategies.map(strategy => {
    const result = runTemporalSimulation(
      strategy,
      roster,
      config,
      horasDisponiblesSemana,
      fechaInicio,
      fechaLimite,
      1.0,
      patronSemanal,
    )
    const score = computeObjectiveScore(result.outcome, weights, totalPendientes, caps)
    return { strategy, result, score }
  })

  results.sort((a, b) => b.score - a.score)
  return results
}
