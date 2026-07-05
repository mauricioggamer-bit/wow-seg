export interface ObjectiveWeights {
  xpTotal: number
  personajesA90: number
  tiempoAhorradoFuturo: number
  coberturaProfesiones: number
  tiempoTotal: number
  usoVentanaEvento: number
}

import type { RosterState } from './roster-state'
import type { Personaje, LevelingConfig } from '../types'
import type { PatronSemanal } from './temporal-simulator'
import { getXpRemaining } from '../leveling/calculator'

export interface SimulationOutcome {
  xpTotal: number
  personajesA90: number
  tiempoTotalHoras: number
  profesionesCubiertas: Set<string>
  rosterStateFinal: RosterState
  personajesNombreA90: string[]
  tiempoAhorradoFuturo: number
}

export interface NormalizationCaps {
  maxXpTotal: number
  maxTiempoTotal: number
  maxPersonajesA90: number
  maxTiempoAhorradoFuturo: number
}

const MAX_PROFESSIONS = 11
const DEFAULT_MAX_DIAS_EVENTO = 37

function msPorSemana(): number {
  return 7 * 24 * 60 * 60 * 1000
}

function computediasHastaLimite(fechaInicio: Date, fechaLimite: Date): number {
  return Math.max(1, (fechaLimite.getTime() - fechaInicio.getTime()) / msPorSemana())
}

function sumXpRemainingTo90(roster: Personaje[]): number {
  let total = 0
  for (const p of roster) {
    if (!p.planeado_usar || p.nivel >= 90) continue
    total += getXpRemaining(p.nivel, 90)
  }
  return total
}

export function computeNormalizationCaps(
  roster: Personaje[],
  config: LevelingConfig,
  horasDisponiblesSemana: number,
  fechaInicio: Date,
  fechaLimite: Date,
  patronSemanal?: PatronSemanal,
): NormalizationCaps {
  const pendientes = roster.filter(p => p.planeado_usar && p.nivel < 90)
  const totalPendientes = pendientes.length
  const semanas = computediasHastaLimite(fechaInicio, fechaLimite)

  /*
   * maxTiempoTotal: total de horas disponibles según el patrón semanal.
   * Si se usa patronSemanal, se suma el patrón real multiplicado por
   * las semanas hasta el límite. Si no, se usa horasDisponiblesSemana * semanas.
   */
  const totalSemanal = patronSemanal
    ? patronSemanal.lunes + patronSemanal.martes + patronSemanal.miercoles
      + patronSemanal.jueves + patronSemanal.viernes + patronSemanal.sabado + patronSemanal.domingo
    : horasDisponiblesSemana
  const maxTiempoTotal = Math.max(Math.round(totalSemanal * semanas), 1)

  /*
   * maxXpTotal: XP total necesaria para llevar TODOS los pendientes a 90.
   * Usa getXpRemaining de calculator.ts para no reimplementar la lógica.
   */
  const maxXpTotal = totalPendientes > 0 ? sumXpRemainingTo90(roster) : 500_000_000

  /*
   * maxTiempoAhorradoFuturo: cota superior del ahorro de tiempo futuro.
   * Criterio: el tiempo ahorrado por Warband no puede exceder el tiempo
   * total disponible, ya que cada hora ahorrada es una hora que se
   * habría jugado. Usamos maxTiempoTotal como cota (generosa pero
   * acotada: el buff Warband max 25% ahorra ~20% del tiempo restante).
   */
  const maxTiempoAhorradoFuturo = Math.max(Math.round(maxTiempoTotal), 1)

  return {
    maxXpTotal,
    maxTiempoTotal,
    maxPersonajesA90: Math.max(totalPendientes, 1),
    maxTiempoAhorradoFuturo,
  }
}

export function computeObjectiveScore(
  outcome: SimulationOutcome,
  weights: ObjectiveWeights,
  totalPendientes: number,
  caps?: NormalizationCaps,
): number {
  const c = caps ?? {
    maxXpTotal: 500_000_000,
    maxTiempoTotal: 500,
    maxPersonajesA90: Math.max(totalPendientes, 1),
    maxTiempoAhorradoFuturo: 250,
  }

  const normXP = Math.min(outcome.xpTotal / c.maxXpTotal, 1)
  const normA90 = totalPendientes > 0 ? Math.min(outcome.personajesA90 / c.maxPersonajesA90, 1) : 0
  const normFutureSaved = Math.min(outcome.tiempoAhorradoFuturo / c.maxTiempoAhorradoFuturo, 1)
  const normProfession = Math.min(outcome.profesionesCubiertas.size / MAX_PROFESSIONS, 1)
  const normTimeRaw = Math.min(outcome.tiempoTotalHoras / c.maxTiempoTotal, 1)
  const normRemaining = 1 - Math.min(outcome.rosterStateFinal.diasRestantesEvento / DEFAULT_MAX_DIAS_EVENTO, 1)

  const total =
    weights.xpTotal * normXP +
    weights.personajesA90 * normA90 +
    weights.tiempoAhorradoFuturo * normFutureSaved +
    weights.coberturaProfesiones * normProfession -
    weights.tiempoTotal * normTimeRaw +
    weights.usoVentanaEvento * normRemaining

  return Math.min(Math.max(total, 0), 100)
}
