import type { Personaje, LevelingConfig } from '../types'
import type { Strategy } from './strategy'
import type { ObjectiveWeights } from './objective-function'
import type { TemporalSimulationResult, PatronSemanal } from './temporal-simulator'
import { generateNaiveStrategies } from './strategy'
import { compareStrategies } from './strategy-comparator'
import { runTemporalSimulation } from './temporal-simulator'
import { computeObjectiveScore, computeNormalizationCaps } from './objective-function'
import { generateNeighbors } from './neighbor-moves'
import { createSeededRng } from './seeded-rng'

const DEFAULT_MAX_ITERATIONS = 200
const DEFAULT_NEIGHBORS_PER_ITERATION = 10
const DEFAULT_NO_IMPROVEMENT_LIMIT = 30
const DEFAULT_SEED = 42

export interface OptimizeOptions {
  seedStrategy?: Strategy
  maxIterations?: number
  neighborsPerIteration?: number
  noImprovementLimit?: number
  seed?: number
  patronSemanal?: PatronSemanal
}

export interface OptimizeResult {
  bestStrategy: Strategy
  bestScore: number
  bestResult: TemporalSimulationResult
  iteracionesRealizadas: number
  historialScores: number[]
}

export function optimizeStrategy(
  roster: Personaje[],
  config: LevelingConfig,
  weights: ObjectiveWeights,
  horasDisponiblesSemana: number,
  fechaInicio: Date,
  fechaLimite: Date,
  options?: OptimizeOptions,
): OptimizeResult {
  const maxIterations = options?.maxIterations ?? DEFAULT_MAX_ITERATIONS
  const neighborsPerIteration = options?.neighborsPerIteration ?? DEFAULT_NEIGHBORS_PER_ITERATION
  const noImprovementLimit = options?.noImprovementLimit ?? DEFAULT_NO_IMPROVEMENT_LIMIT
  const seed = options?.seed ?? DEFAULT_SEED
  const rng = createSeededRng(seed)

  const totalPendientes = roster.filter(p => p.planeado_usar && p.nivel < 90).length
  const patronSemanal = options?.patronSemanal
  const caps = computeNormalizationCaps(roster, config, horasDisponiblesSemana, fechaInicio, fechaLimite, patronSemanal)

  let currentStrategy: Strategy
  if (options?.seedStrategy) {
    currentStrategy = options.seedStrategy
  } else {
    const naive = generateNaiveStrategies(roster, config)
    if (naive.length === 0) {
      const emptyStrategy: Strategy = { nombre: 'Vacio', decisiones: [] }
      const emptyResult = runTemporalSimulation(
        emptyStrategy, roster, config, horasDisponiblesSemana, fechaInicio, fechaLimite, 1.0, patronSemanal,
      )
      const emptyScore = computeObjectiveScore(emptyResult.outcome, weights, totalPendientes, caps)
      return {
        bestStrategy: emptyStrategy,
        bestScore: emptyScore,
        bestResult: emptyResult,
        iteracionesRealizadas: 0,
        historialScores: [emptyScore],
      }
    }
    const ranked = compareStrategies(
      naive, roster, config, weights, horasDisponiblesSemana, fechaInicio, fechaLimite, patronSemanal,
    )
    currentStrategy = ranked[0].strategy
  }

  let currentResult = runTemporalSimulation(
    currentStrategy, roster, config, horasDisponiblesSemana, fechaInicio, fechaLimite, 1.0, patronSemanal,
  )
  let currentScore = computeObjectiveScore(currentResult.outcome, weights, totalPendientes, caps)

  let bestStrategy = currentStrategy
  let bestScore = currentScore
  let bestResult = currentResult
  const historialScores: number[] = [bestScore]

  let noImprovementCount = 0

  function computeActiveWindow(result: TemporalSimulationResult): number {
    const active = new Set<string>()
    for (const day of result.dias) {
      if (day.personajeActivo) active.add(day.personajeActivo)
    }
    return Math.max(1, active.size)
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    const activeWindow = computeActiveWindow(currentResult)
    const neighbors = generateNeighbors(currentStrategy, rng, neighborsPerIteration, activeWindow)
    if (neighbors.length === 0) break

    let bestNeighborStrategy: Strategy | null = null
    let bestNeighborScore = -Infinity
    let bestNeighborResult: TemporalSimulationResult | null = null

    for (const neighbor of neighbors) {
      const result = runTemporalSimulation(
        neighbor, roster, config, horasDisponiblesSemana, fechaInicio, fechaLimite, 1.0, patronSemanal,
      )
      const score = computeObjectiveScore(result.outcome, weights, totalPendientes, caps)

      if (score > bestNeighborScore) {
        bestNeighborScore = score
        bestNeighborStrategy = neighbor
        bestNeighborResult = result
      }
    }

    if (bestNeighborStrategy && bestNeighborScore > currentScore) {
      currentStrategy = bestNeighborStrategy
      currentScore = bestNeighborScore
      currentResult = bestNeighborResult!
      noImprovementCount = 0

      if (currentScore > bestScore) {
        bestScore = currentScore
        bestStrategy = currentStrategy
        bestResult = currentResult
      }
    } else {
      noImprovementCount++
    }

    historialScores.push(bestScore)

    if (noImprovementCount >= noImprovementLimit) break
  }

  return {
    bestStrategy,
    bestScore,
    bestResult,
    iteracionesRealizadas: Math.min(historialScores.length - 1, maxIterations),
    historialScores,
  }
}
