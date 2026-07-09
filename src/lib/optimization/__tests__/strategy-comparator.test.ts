import { describe, it, expect } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import type { Strategy } from '../strategy'
import type { ObjectiveWeights } from '../objective-function'
import { compareStrategies } from '../strategy-comparator'

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

const defaultConfig: LevelingConfig = {
  xpMonstruos: 20000,
  duracionDungeon: 18,
  warbandMentor080: 30,
  warMode: false,
  warModeTarget: 'both',
  customBuffs: [],
}

const weights: ObjectiveWeights = {
  xpTotal: 20,
  personajesA90: 25,
  tiempoAhorradoFuturo: 20,
  coberturaProfesiones: 15,
  tiempoTotal: 20,
  usoVentanaEvento: 10,
}

describe('compareStrategies', () => {
  it('returns empty array for empty strategies', () => {
    const roster = [makePersonaje({ nombre: 'A', nivel: 70 })]
    const start = new Date('2026-07-05T00:00:00Z')
    const end = new Date('2026-07-06T00:00:00Z')
    const results = compareStrategies([], roster, defaultConfig, weights, 40, start, end)
    expect(results).toEqual([])
  })

  it('returns results sorted descending by score', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 85 }),
    ]
    const start = new Date('2026-07-05T00:00:00Z')
    const end = new Date('2026-08-11T00:00:00Z')

    const strategies: Strategy[] = [
      {
        nombre: 'First',
        decisiones: [
          { personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 },
          { personaje: roster[1], accion: 'subir-a-90', ordenPrioridad: 2 },
        ],
      },
      {
        nombre: 'Second',
        decisiones: [
          { personaje: roster[1], accion: 'subir-a-90', ordenPrioridad: 1 },
          { personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 2 },
        ],
      },
    ]

    const results = compareStrategies(strategies, roster, defaultConfig, weights, 40, start, end)
    expect(results.length).toBe(2)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('runs all strategies without error', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 85 }),
      makePersonaje({ nombre: 'C', nivel: 88 }),
    ]
    const start = new Date('2026-07-05T00:00:00Z')
    const end = new Date('2026-08-11T00:00:00Z')

    const strategies: Strategy[] = [
      {
        nombre: 'S1',
        decisiones: [
          { personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 },
          { personaje: roster[1], accion: 'subir-a-90', ordenPrioridad: 2 },
          { personaje: roster[2], accion: 'subir-a-90', ordenPrioridad: 3 },
        ],
      },
    ]

    const results = compareStrategies(strategies, roster, defaultConfig, weights, 40, start, end)
    expect(results.length).toBe(1)
    expect(results[0].score).toBeGreaterThanOrEqual(0)
    expect(results[0].score).toBeLessThanOrEqual(100)
  })
})
