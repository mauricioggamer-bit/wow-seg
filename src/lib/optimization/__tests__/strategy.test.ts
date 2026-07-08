import { describe, it, expect } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import { generateNaiveStrategies } from '../strategy'

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

describe('generateNaiveStrategies', () => {
  it('returns 3 strategies for a normal roster', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 85 }),
      makePersonaje({ nombre: 'C', nivel: 88 }),
    ]
    const strategies = generateNaiveStrategies(roster, defaultConfig)
    expect(strategies.length).toBe(3)
    expect(strategies[0].nombre).toBe('ROI')
    expect(strategies[1].nombre).toBe('Ascendente por nivel')
    expect(strategies[2].nombre).toBe('Profesiones')
  })

  it('returns empty array for empty roster', () => {
    expect(generateNaiveStrategies([])).toEqual([])
  })

  it('returns empty array when everyone is already 90', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 90 }),
      makePersonaje({ nombre: 'B', nivel: 90 }),
    ]
    expect(generateNaiveStrategies(roster)).toEqual([])
  })

  it('returns empty array when all are non-planeado_usar', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70, planeado_usar: false }),
    ]
    expect(generateNaiveStrategies(roster)).toEqual([])
  })

  it('generates strategy with all subir-a-90 decisions', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 85 }),
    ]
    const strategies = generateNaiveStrategies(roster, defaultConfig)
    for (const s of strategies) {
      expect(s.decisiones.length).toBe(2)
      for (const d of s.decisiones) {
        expect(d.accion).toBe('subir-a-90')
        expect(d.ordenPrioridad).toBeGreaterThan(0)
      }
    }
  })

  it('generates distinct orderings across strategies', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70, profesiones: [{ id: 'herreria', completadas: [], esMainCrafter: true }] }),
      makePersonaje({ nombre: 'B', nivel: 85 }),
      makePersonaje({ nombre: 'C', nivel: 88 }),
    ]
    const strategies = generateNaiveStrategies(roster, defaultConfig)
    const orders = strategies.map(s => s.decisiones.map(d => d.personaje.nombre))
    const uniqueOrders = new Set(orders.map(o => o.join(',')))
    expect(uniqueOrders.size).toBeGreaterThanOrEqual(2)
  })

  it('places main crafter first in Profesiones strategy', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 85, profesiones: [{ id: 'herreria', completadas: [], esMainCrafter: true }] }),
      makePersonaje({ nombre: 'C', nivel: 88 }),
    ]
    const strategies = generateNaiveStrategies(roster, defaultConfig)
    const profStrategy = strategies.find(s => s.nombre === 'Profesiones')!
    expect(profStrategy.decisiones[0].personaje.nombre).toBe('B')
  })
})
