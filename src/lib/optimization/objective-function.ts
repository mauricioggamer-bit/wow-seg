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
import type { PatronSemanal } from '../types'
import { getXpRemaining, getEffectiveXpPerDungeon } from '../leveling/calculator'
import { getXpForLevel } from '../constants/experience'

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

/*
 * Heurística de calibración para maxXpTotal: estima cuánto XP es alcanzable
 * dentro de maxTiempoTotal horas asignando greedy las horas a los personajes
 * con mayor XP/hora primero. NO es una simulación — ignora la retroalimentación
 * de Warband y no simula level-ups dinámicos. Es una cota gruesa para que el
 * denominador del score refleje el presupuesto real de tiempo, no el XP total
 * teórico de todo el roster.
 */
function computeAchievableXp(
  roster: Personaje[],
  config: LevelingConfig,
  maxTiempoTotal: number,
  maxTimewaysPct: number,
  count90: number,
): number {
  const pendientes = roster.filter(p => p.planeado_usar && p.nivel < 90)
  if (pendientes.length === 0) return 500_000_000
  if (maxTiempoTotal <= 0) return 1

  const maxLevel = 90

  const candidates = pendientes.map(p => {
    const xpPerDungeon = getEffectiveXpPerDungeon(config, p.nivel, count90, maxTimewaysPct)
    const hoursPerDungeon = config.duracionDungeon / 60
    const xpPerHour = hoursPerDungeon > 0 ? xpPerDungeon / hoursPerDungeon : 0
    const xpTo90 = getXpRemaining(p.nivel, maxLevel)
    const hoursTo90 = xpPerHour > 0 ? xpTo90 / xpPerHour : Infinity
    return { xpPerHour, hoursTo90 }
  })

  candidates.sort((a, b) => b.xpPerHour - a.xpPerHour)

  let remainingHours = maxTiempoTotal
  let totalXp = 0
  for (const c of candidates) {
    if (remainingHours <= 0 || c.xpPerHour <= 0) break
    const hoursForThisChar = Math.min(remainingHours, c.hoursTo90)
    totalXp += hoursForThisChar * c.xpPerHour
    remainingHours -= hoursForThisChar
  }

  return Math.max(Math.round(totalXp), 1)
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
   * maxXpTotal: XP máximo alcanzable dentro de maxTiempoTotal horas,
   * asignando greedy las horas a los personajes con mayor XP/hora primero.
   * Es una heurística de calibración, NO una simulación.
   */
  const maxTimewaysPct = Math.max(0, ...pendientes.map(p => p.timewaysPct ?? 0))
  const count90Roster = roster.filter(p => p.planeado_usar && p.nivel >= 90).length
  const maxXpTotal = totalPendientes > 0
    ? computeAchievableXp(roster, config, maxTiempoTotal, maxTimewaysPct, count90Roster)
    : 500_000_000

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

export interface ScoreBreakdown {
  xpTotalNorm: number
  personajesA90Norm: number
  tiempoAhorradoFuturoNorm: number
  coberturaProfesionesNorm: number
  tiempoTotalNorm: number
  usoVentanaEventoNorm: number
  contribucionPonderada: {
    xpTotal: number
    personajesA90: number
    tiempoAhorradoFuturo: number
    coberturaProfesiones: number
    tiempoTotal: number
    usoVentanaEvento: number
  }
}

export function computeObjectiveScore(
  outcome: SimulationOutcome,
  weights: ObjectiveWeights,
  totalPendientes: number,
  caps?: NormalizationCaps,
): { score: number; breakdown: ScoreBreakdown } {
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

  return {
    score: Math.min(Math.max(total, 0), 100),
    breakdown: {
      xpTotalNorm: normXP,
      personajesA90Norm: normA90,
      tiempoAhorradoFuturoNorm: normFutureSaved,
      coberturaProfesionesNorm: normProfession,
      tiempoTotalNorm: normTimeRaw,
      usoVentanaEventoNorm: normRemaining,
      contribucionPonderada: {
        xpTotal: weights.xpTotal * normXP,
        personajesA90: weights.personajesA90 * normA90,
        tiempoAhorradoFuturo: weights.tiempoAhorradoFuturo * normFutureSaved,
        coberturaProfesiones: weights.coberturaProfesiones * normProfession,
        tiempoTotal: -(weights.tiempoTotal * normTimeRaw),
        usoVentanaEvento: weights.usoVentanaEvento * normRemaining,
      },
    },
  }
}
