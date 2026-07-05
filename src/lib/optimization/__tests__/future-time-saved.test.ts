import { describe, it, expect } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import type { RosterState } from '../roster-state'
import { computeFutureTimeSaved } from '../future-time-saved'

const defaultConfig: LevelingConfig = {
  xpMonstruos: 20000,
  duracionDungeon: 18,
  warbandMentor080: 30,
  warMode: false,
  warModeTarget: 'both',
  customBuffs: [],
}

function makePersonaje(overrides: Partial<Personaje> = {}): Personaje {
  return {
    nombre: 'Test',
    clase: 'Guerrero',
    nivel: 80,
    faccion: 'Horda',
    raza: 'Orco',
    reino: 'Stormscale',
    warband: 'Default',
    mision_principal: null,
    planeado_usar: true,
    tareas: [],
    profesiones: [],
    ...overrides,
  }
}

function makeRosterState(overrides: Partial<RosterState> = {}): RosterState {
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

describe('computeFutureTimeSaved', () => {
  it('returns 0 when character is already 90', () => {
    const char = makePersonaje({ nombre: 'Maxed', nivel: 90 })
    const state = makeRosterState({ count90: 5, warbandMentorBuff: 25 })
    const saved = computeFutureTimeSaved(char, state, [], defaultConfig)
    expect(saved).toBe(0)
  })

  it('returns 0 when no 80-89 beneficiaries exist', () => {
    const char = makePersonaje({ nombre: 'Leveler', nivel: 70 })
    const state = makeRosterState({ count90: 0, warbandMentorBuff: 0 })
    const resto = [makePersonaje({ nombre: 'Other', nivel: 70 })]
    const saved = computeFutureTimeSaved(char, state, resto, defaultConfig)
    expect(saved).toBe(0)
  })

  it('returns 0 when warband buff is already capped at 25%', () => {
    const char = makePersonaje({ nombre: 'Leveler', nivel: 85 })
    const state = makeRosterState({ count90: 5, warbandMentorBuff: 25 })
    const resto = [makePersonaje({ nombre: 'Other', nivel: 85 })]
    const saved = computeFutureTimeSaved(char, state, resto, defaultConfig)
    expect(saved).toBe(0)
  })

  it('returns positive time saved for 80-89 beneficiaries', () => {
    const highMonsterConfig: LevelingConfig = {
      ...defaultConfig,
      xpMonstruos: 80000,
    }
    const char = makePersonaje({ nombre: 'Leveler', nivel: 80 })
    const state = makeRosterState({ count90: 0, warbandMentorBuff: 0 })
    const resto = [
      makePersonaje({ nombre: 'Beneficiary', nivel: 80 }),
    ]
    const saved = computeFutureTimeSaved(char, state, resto, highMonsterConfig)
    expect(saved).toBeGreaterThan(0)
  })

  it('excludes non-planeado_usar characters', () => {
    const char = makePersonaje({ nombre: 'Leveler', nivel: 85 })
    const state = makeRosterState({ count90: 0, warbandMentorBuff: 0 })
    const resto = [
      makePersonaje({ nombre: 'NotPlanned', nivel: 85, planeado_usar: false }),
    ]
    const saved = computeFutureTimeSaved(char, state, resto, defaultConfig)
    expect(saved).toBe(0)
  })

  it('excludes characters below 80 and at 90', () => {
    const char = makePersonaje({ nombre: 'Leveler', nivel: 85 })
    const state = makeRosterState({ count90: 0, warbandMentorBuff: 0 })
    const resto = [
      makePersonaje({ nombre: 'Low', nivel: 70 }),
      makePersonaje({ nombre: 'Already90', nivel: 90 }),
    ]
    const saved = computeFutureTimeSaved(char, state, resto, defaultConfig)
    expect(saved).toBe(0)
  })

  it('sums savings across multiple 80-89 beneficiaries', () => {
    const char = makePersonaje({ nombre: 'Leveler', nivel: 85 })
    const state = makeRosterState({ count90: 0, warbandMentorBuff: 0 })
    const resto = [
      makePersonaje({ nombre: 'BenA', nivel: 85 }),
      makePersonaje({ nombre: 'BenB', nivel: 82 }),
      makePersonaje({ nombre: 'BenC', nivel: 88 }),
    ]
    const saved = computeFutureTimeSaved(char, state, resto, defaultConfig)
    expect(saved).toBeGreaterThan(0)
    const singleSaved = computeFutureTimeSaved(
      char,
      state,
      [makePersonaje({ nombre: 'Single', nivel: 85 })],
      defaultConfig,
    )
    expect(saved).toBeGreaterThan(singleSaved)
  })

  it('is deterministic (same inputs = same output)', () => {
    const char = makePersonaje({ nombre: 'Leveler', nivel: 85 })
    const state = makeRosterState({ count90: 1, warbandMentorBuff: 5 })
    const resto = [
      makePersonaje({ nombre: 'Ben', nivel: 85 }),
      makePersonaje({ nombre: 'Ben2', nivel: 80 }),
    ]
    const first = computeFutureTimeSaved(char, state, resto, defaultConfig)
    const second = computeFutureTimeSaved(char, state, resto, defaultConfig)
    expect(first).toBe(second)
  })
})
