export interface ObjectiveWeights {
  xpTotal: number
  personajesA90: number
  tiempoAhorradoFuturo: number
  coberturaProfesiones: number
  tiempoTotal: number
}

import type { RosterState } from './roster-state'

export interface SimulationOutcome {
  xpTotal: number
  personajesA90: number
  tiempoTotalHoras: number
  profesionesCubiertas: Set<string>
  rosterStateFinal: RosterState
  personajesNombreA90: string[]
  tiempoAhorradoFuturo: number
}

const MAX_TIME = 500
const MAX_PROFESSIONS = 11
const MAX_FUTURE_SAVED = 200
const MAX_XP_REFERENCE = 500_000_000

export function computeObjectiveScore(
  outcome: SimulationOutcome,
  weights: ObjectiveWeights,
  totalPendientes: number,
): number {
  const normXP = Math.min(outcome.xpTotal / MAX_XP_REFERENCE, 1)
  const normA90 = totalPendientes > 0 ? Math.min(outcome.personajesA90 / totalPendientes, 1) : 0
  const normFutureSaved = Math.min(outcome.tiempoAhorradoFuturo / MAX_FUTURE_SAVED, 1)
  const normProfession = Math.min(outcome.profesionesCubiertas.size / MAX_PROFESSIONS, 1)
  const normTimeRaw = Math.min(outcome.tiempoTotalHoras / MAX_TIME, 1)

  const total =
    weights.xpTotal * normXP +
    weights.personajesA90 * normA90 +
    weights.tiempoAhorradoFuturo * normFutureSaved +
    weights.coberturaProfesiones * normProfession -
    weights.tiempoTotal * normTimeRaw

  return Math.min(Math.max(total, 0), 100)
}
