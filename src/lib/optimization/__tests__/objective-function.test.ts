import { describe, it, expect } from 'vitest'
import { computeObjectiveScore } from '../objective-function'
import type { SimulationOutcome, ObjectiveWeights } from '../objective-function'
import type { RosterState } from '../roster-state'

function roster(overrides: Partial<RosterState> = {}): RosterState {
  return {
    count90: 0,
    warbandMentorBuff: 0,
    horasConsumidas: 0,
    horasDisponiblesSemana: 40,
    fechaActual: new Date('2026-07-05T00:00:00Z'),
    fechaLimiteEvento: new Date('2026-08-11T00:00:00Z'),
    diasRestantesEvento: 37,
    ...overrides,
  }
}

function baseOutcome(): SimulationOutcome {
  return {
    xpTotal: 0,
    personajesA90: 0,
    tiempoTotalHoras: 0,
    profesionesCubiertas: new Set(),
    rosterStateFinal: roster(),
    personajesNombreA90: [],
    tiempoAhorradoFuturo: 0,
  }
}

describe('computeObjectiveScore', () => {
  const defaultWeights: ObjectiveWeights = {
    xpTotal: 20,
    personajesA90: 25,
    tiempoAhorradoFuturo: 20,
    coberturaProfesiones: 15,
    tiempoTotal: 20,
  }
  const totalPendientes = 10

  it('returns 0 for zero outcome (max time, no progress)', () => {
    const outcome: SimulationOutcome = {
      ...baseOutcome(),
      xpTotal: 0,
      tiempoTotalHoras: 500,
    }
    const score = computeObjectiveScore(outcome, defaultWeights, totalPendientes)
    expect(score).toBeCloseTo(0, 0)
  })

  it('returns high score for ideal outcome', () => {
    const outcome: SimulationOutcome = {
      ...baseOutcome(),
      xpTotal: 999999,
      personajesA90: 10,
      tiempoTotalHoras: 0,
      profesionesCubiertas: new Set(['herreria', 'mineria', 'alquimia', 'sastreria', 'peleteria', 'joyeria', 'ingenieria', 'inscripcion', 'encantamiento', 'herboristeria', 'desuello']),
      rosterStateFinal: roster({ count90: 10, warbandMentorBuff: 25, diasRestantesEvento: 0 }),
    }
    const score = computeObjectiveScore(outcome, defaultWeights, totalPendientes)
    expect(score).toBeGreaterThanOrEqual(35)
  })

  it('caps score at 100', () => {
    const outcome: SimulationOutcome = {
      ...baseOutcome(),
      xpTotal: 500_000_000,
      personajesA90: totalPendientes,
      tiempoTotalHoras: 0,
      profesionesCubiertas: new Set(['herreria', 'mineria', 'alquimia', 'sastreria', 'peleteria', 'joyeria', 'ingenieria', 'inscripcion', 'encantamiento', 'herboristeria', 'desuello']),
      tiempoAhorradoFuturo: 200,
      rosterStateFinal: roster({ count90: totalPendientes, warbandMentorBuff: 25, diasRestantesEvento: 0 }),
    }
    // max possible with defaultWeights = 20+25+20+15 = 80 (tiempoTotal=0)
    expect(computeObjectiveScore(outcome, defaultWeights, totalPendientes)).toBe(80)
  })

  it('handles worst-case time (edge case)', () => {
    const outcome: SimulationOutcome = {
      ...baseOutcome(),
      xpTotal: 0,
      tiempoTotalHoras: -100,
      rosterStateFinal: roster({ diasRestantesEvento: 37 }),
    }
    const score = computeObjectiveScore(outcome, defaultWeights, totalPendientes)
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('scales proportionally with different weights', () => {
    const outcome: SimulationOutcome = {
      ...baseOutcome(),
      xpTotal: 500000,
      personajesA90: 2,
      tiempoTotalHoras: 100,
      profesionesCubiertas: new Set(['herreria', 'mineria']),
      rosterStateFinal: roster({ count90: 2, warbandMentorBuff: 10, diasRestantesEvento: 20 }),
    }
    const highXPWeight: ObjectiveWeights = { xpTotal: 100, personajesA90: 0, tiempoAhorradoFuturo: 0, coberturaProfesiones: 0, tiempoTotal: 0 }
    const highA90Weight: ObjectiveWeights = { xpTotal: 0, personajesA90: 100, tiempoAhorradoFuturo: 0, coberturaProfesiones: 0, tiempoTotal: 0 }

    const xpScore = computeObjectiveScore(outcome, highXPWeight, totalPendientes)
    const a90Score = computeObjectiveScore(outcome, highA90Weight, totalPendientes)

    expect(xpScore).toBeGreaterThan(0)
    expect(a90Score).toBeGreaterThan(0)
    expect(xpScore + a90Score).toBeLessThanOrEqual(100)
  })
})
