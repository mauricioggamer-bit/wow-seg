import { describe, it, expect } from 'vitest'
import type { Personaje } from '../../types'
import { computeRosterState } from '../roster-state'

function makePersonaje(overrides: Partial<Personaje> = {}): Personaje {
  return {
    nombre: 'Test',
    clase: 'Guerrero',
    nivel: 80,
    faccion: 'Horda',
    raza: 'Orco',
    reino: 'Stormscale',
    warband: 'Default',
    planeado_usar: true,
    tareas: [],
    profesiones: [],
    ...overrides,
  }
}

describe('computeRosterState', () => {
  it('counts zero level-90 chars correctly', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 85, planeado_usar: false }),
    ]
    const state = computeRosterState(roster, 0, 40)
    expect(state.count90).toBe(0)
    expect(state.warbandMentorBuff).toBe(0)
  })

  it('only counts planeado_usar characters for count90', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 90 }),
      makePersonaje({ nombre: 'B', nivel: 90, planeado_usar: false }),
      makePersonaje({ nombre: 'C', nivel: 70 }),
    ]
    const state = computeRosterState(roster, 5, 40)
    expect(state.count90).toBe(1)
    expect(state.warbandMentorBuff).toBe(5)
  })

  it('caps warbandMentorBuff at 25', () => {
    const roster = Array.from({ length: 10 }, (_, i) =>
      makePersonaje({ nombre: `Char${i}`, nivel: 90 }),
    )
    const state = computeRosterState(roster, 0, 40)
    expect(state.count90).toBe(10)
    expect(state.warbandMentorBuff).toBe(25)
  })

  it('computes diasRestantesEvento from provided date', () => {
    const roster = [makePersonaje({ nivel: 90 })]
    const june1 = new Date('2026-06-01T00:00:00Z')
    const aug11 = new Date('2026-08-11T00:00:00Z')
    const state = computeRosterState(roster, 0, 40, june1, aug11)
    expect(state.diasRestantesEvento).toBe(71)
  })

  it('returns 0 diasRestantesEvento if deadline already passed', () => {
    const roster = [makePersonaje({ nivel: 90 })]
    const sep1 = new Date('2026-09-01T00:00:00Z')
    const aug11 = new Date('2026-08-11T00:00:00Z')
    const state = computeRosterState(roster, 0, 40, sep1, aug11)
    expect(state.diasRestantesEvento).toBe(0)
  })

  it('stores horasConsumidas and horasDisponiblesSemana', () => {
    const roster = [makePersonaje({ nivel: 90 })]
    const state = computeRosterState(roster, 12, 40)
    expect(state.horasConsumidas).toBe(12)
    expect(state.horasDisponiblesSemana).toBe(40)
  })
})
