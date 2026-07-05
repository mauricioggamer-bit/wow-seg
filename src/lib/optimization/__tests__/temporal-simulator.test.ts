import { describe, it, expect } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import type { Strategy } from '../strategy'
import { runTemporalSimulation } from '../temporal-simulator'

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

const defaultConfig: LevelingConfig = {
  xpMonstruos: 20000,
  duracionDungeon: 18,
  warbandMentor080: 30,
  warMode: false,
  warModeTarget: 'both',
  customBuffs: [],
}

const defaultWeights = {
  xpTotal: 20,
  personajesA90: 25,
  tiempoAhorradoFuturo: 20,
  coberturaProfesiones: 15,
  tiempoTotal: 20,
  usoVentanaEvento: 10,
}

describe('runTemporalSimulation', () => {
  it('returns empty dias for 0 days (fechaInicio == fechaLimite)', () => {
    const date = new Date('2026-07-05T00:00:00Z')
    const roster = [makePersonaje({ nombre: 'A', nivel: 70 })]
    const strategy: Strategy = {
      nombre: 'Test',
      decisiones: [{ personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 }],
    }
    const result = runTemporalSimulation(strategy, roster, defaultConfig, 40, date, date)
    expect(result.dias.length).toBe(0)
    expect(result.outcome.tiempoTotalHoras).toBe(0)
  })

  it('returns no progress for 0 hours available', () => {
    const start = new Date('2026-07-05T00:00:00Z')
    const end = new Date('2026-07-06T00:00:00Z')
    const roster = [makePersonaje({ nombre: 'A', nivel: 70 })]
    const strategy: Strategy = {
      nombre: 'Test',
      decisiones: [{ personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 }],
    }
    const result = runTemporalSimulation(strategy, roster, defaultConfig, 0, start, end)
    expect(result.dias.length).toBe(1)
    expect(result.outcome.tiempoTotalHoras).toBe(0)
    expect(result.outcome.xpTotal).toBe(0)
  })

  it('handles all-saltear strategy', () => {
    const start = new Date('2026-07-05T00:00:00Z')
    const end = new Date('2026-07-06T00:00:00Z')
    const roster = [makePersonaje({ nombre: 'A', nivel: 70 })]
    const strategy: Strategy = {
      nombre: 'AllSkip',
      decisiones: [{ personaje: roster[0], accion: 'saltear', ordenPrioridad: 1 }],
    }
    const result = runTemporalSimulation(strategy, roster, defaultConfig, 40, start, end)
    expect(result.outcome.tiempoTotalHoras).toBe(0)
    expect(result.outcome.xpTotal).toBe(0)
  })

  it('handles empty roster', () => {
    const start = new Date('2026-07-05T00:00:00Z')
    const end = new Date('2026-07-06T00:00:00Z')
    const strategy: Strategy = {
      nombre: 'Empty',
      decisiones: [],
    }
    const result = runTemporalSimulation(strategy, [], defaultConfig, 40, start, end)
    expect(result.dias.length).toBe(0)
  })

  it('produces progress over multiple days', () => {
    const start = new Date('2026-07-05T00:00:00Z')
    const end = new Date('2026-07-12T00:00:00Z')
    const roster = [makePersonaje({ nombre: 'A', nivel: 80 })]
    const strategy: Strategy = {
      nombre: 'Test',
      decisiones: [{ personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 }],
    }
    const result = runTemporalSimulation(strategy, roster, defaultConfig, 40, start, end)
    expect(result.dias.length).toBeGreaterThan(0)
    expect(result.outcome.xpTotal).toBeGreaterThan(0)
    expect(result.outcome.tiempoTotalHoras).toBeGreaterThan(0)
    expect(result.outcome.personajesA90).toBe(0)
  })

  it('is deterministic: same inputs produce same output', () => {
    const start = new Date('2026-07-05T00:00:00Z')
    const end = new Date('2026-07-07T00:00:00Z')
    const roster = [makePersonaje({ nombre: 'A', nivel: 80 })]
    const strategy: Strategy = {
      nombre: 'Test',
      decisiones: [{ personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 }],
    }
    const r1 = runTemporalSimulation(strategy, roster, defaultConfig, 40, start, end)
    const r2 = runTemporalSimulation(strategy, roster, defaultConfig, 40, start, end)
    expect(r1.dias.length).toBe(r2.dias.length)
    expect(r1.outcome.xpTotal).toBe(r2.outcome.xpTotal)
    expect(r1.outcome.tiempoTotalHoras).toBe(r2.outcome.tiempoTotalHoras)
  })

  it('produces correct SimulationOutcome structure', () => {
    const start = new Date('2026-07-05T00:00:00Z')
    const end = new Date('2026-07-08T00:00:00Z')
    const roster = [makePersonaje({ nombre: 'A', nivel: 80 })]
    const strategy: Strategy = {
      nombre: 'Test',
      decisiones: [{ personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 }],
    }
    const result = runTemporalSimulation(strategy, roster, defaultConfig, 40, start, end)
    const o = result.outcome
    expect(o).toHaveProperty('xpTotal')
    expect(o).toHaveProperty('personajesA90')
    expect(o).toHaveProperty('tiempoTotalHoras')
    expect(o).toHaveProperty('profesionesCubiertas')
    expect(o).toHaveProperty('rosterStateFinal')
    expect(o).toHaveProperty('personajesNombreA90')
    expect(o).toHaveProperty('tiempoAhorradoFuturo')
    expect(o.profesionesCubiertas).toBeInstanceOf(Set)
  })
})
