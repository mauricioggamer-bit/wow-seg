import { describe, it, expect, vi } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import type { ObjectiveWeights, SimulationOutcome } from '../objective-function'
import type { Strategy } from '../strategy'
import { optimizeStrategy } from '../strategy-optimizer'
import { createSeededRng } from '../seeded-rng'
import { generateNaiveStrategies } from '../strategy'
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
    mision_principal: null,
    planeado_usar: true,
    tareas: [],
    profesiones: [],
    ...overrides,
  }
}

const config: LevelingConfig = {
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

const fechaInicio = new Date('2026-07-05T00:00:00Z')
const fechaLimite = new Date('2026-08-11T00:00:00Z')

describe('optimizeStrategy', () => {
  it('bestScore is >= seed strategy score (no worsen guarantee)', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 89 }),
      makePersonaje({ nombre: 'B', nivel: 82 }),
      makePersonaje({ nombre: 'C', nivel: 70 }),
      makePersonaje({ nombre: 'D', nivel: 60 }),
      makePersonaje({ nombre: 'E', nivel: 55 }),
    ]

    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { maxIterations: 50, neighborsPerIteration: 8, seed: 42 },
    )

    const naive = generateNaiveStrategies(roster, config)
    const ranked = compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
    expect(result.bestScore).toBeGreaterThanOrEqual(ranked[0].score)
    expect(result.iteracionesRealizadas).toBeGreaterThanOrEqual(0)
    expect(result.historialScores.length).toBeGreaterThanOrEqual(1)
  })

  it('is deterministic with same seed', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 88 }),
      makePersonaje({ nombre: 'B', nivel: 75 }),
      makePersonaje({ nombre: 'C', nivel: 65 }),
      makePersonaje({ nombre: 'D', nivel: 50 }),
    ]

    const r1 = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { maxIterations: 20, neighborsPerIteration: 5, seed: 42 },
    )
    const r2 = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { maxIterations: 20, neighborsPerIteration: 5, seed: 42 },
    )

    expect(r1.bestScore).toBe(r2.bestScore)
    expect(r1.bestStrategy.decisiones.map(d => d.personaje.nombre)).toEqual(
      r2.bestStrategy.decisiones.map(d => d.personaje.nombre),
    )
    expect(r1.bestStrategy.decisiones.map(d => d.accion)).toEqual(
      r2.bestStrategy.decisiones.map(d => d.accion),
    )
    expect(r1.historialScores).toEqual(r2.historialScores)
    expect(r1.iteracionesRealizadas).toBe(r2.iteracionesRealizadas)
  })

  it('handles empty roster', () => {
    const result = optimizeStrategy(
      [], config, weights, 168, fechaInicio, fechaLimite,
    )
    expect(result.bestScore).toBeGreaterThanOrEqual(0)
    expect(result.bestStrategy.decisiones.length).toBe(0)
    expect(result.iteracionesRealizadas).toBe(0)
  })

  it('handles single-character roster', () => {
    const roster = [makePersonaje({ nombre: 'Solo', nivel: 70 })]
    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { maxIterations: 20, neighborsPerIteration: 5, seed: 42 },
    )
    expect(result.bestScore).toBeGreaterThanOrEqual(0)
    expect(result.bestStrategy.decisiones.length).toBe(1)
  })

  it('returns seed unchanged when maxIterations=0', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 80 }),
      makePersonaje({ nombre: 'B', nivel: 70 }),
    ]

    const seedStrategy: Strategy = {
      nombre: 'CustomSeed',
      decisiones: [
        { personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 },
        { personaje: roster[1], accion: 'saltear', ordenPrioridad: 2 },
      ],
    }

    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { seedStrategy, maxIterations: 0, seed: 42 },
    )

    expect(result.bestStrategy.decisiones[0].personaje.nombre).toBe('A')
    expect(result.bestStrategy.decisiones[1].accion).toBe('saltear')
    expect(result.iteracionesRealizadas).toBe(0)
    expect(result.historialScores.length).toBe(1)
  })

  it('handles seedStrategy with empty decisions', () => {
    const roster = [makePersonaje({ nombre: 'A', nivel: 80 })]
    const seedStrategy: Strategy = { nombre: 'Empty', decisiones: [] }

    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { seedStrategy, seed: 42 },
    )
    expect(result.bestScore).toBeGreaterThanOrEqual(0)
    expect(result.bestStrategy.decisiones).toEqual([])
  })

  it('handles all-90 roster (no pending characters)', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 90, planeado_usar: true }),
      makePersonaje({ nombre: 'B', nivel: 90, planeado_usar: true }),
    ]

    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { seed: 42 },
    )
    expect(result.bestScore).toBeGreaterThanOrEqual(0)
    expect(result.bestStrategy.decisiones.length).toBe(0)
    expect(result.iteracionesRealizadas).toBe(0)
  })

  it('handles non-planeado_usar roster (no pending)', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70, planeado_usar: false }),
      makePersonaje({ nombre: 'B', nivel: 50, planeado_usar: false }),
    ]

    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { seed: 42 },
    )
    expect(result.bestScore).toBeGreaterThanOrEqual(0)
    expect(result.bestStrategy.decisiones.length).toBe(0)
  })

  it('uses custom seedStrategy when provided', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 80 }),
      makePersonaje({ nombre: 'B', nivel: 85 }),
    ]

    const seedStrategy: Strategy = {
      nombre: 'Custom',
      decisiones: [
        { personaje: roster[1], accion: 'subir-a-90', ordenPrioridad: 1 },
        { personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 2 },
      ],
    }

    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { seedStrategy, maxIterations: 10, neighborsPerIteration: 4, seed: 42 },
    )

    expect(result.bestStrategy.nombre).toBe('Custom')
  })

  it('never produces a bestScore worse than the initial seed', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 88 }),
      makePersonaje({ nombre: 'B', nivel: 82 }),
      makePersonaje({ nombre: 'C', nivel: 71 }),
      makePersonaje({ nombre: 'D', nivel: 45 }),
    ]

    for (let s = 0; s < 5; s++) {
      const result = optimizeStrategy(
        roster, config, weights, 168, fechaInicio, fechaLimite,
        { maxIterations: 30, neighborsPerIteration: 5, seed: s * 100 + 42 },
      )
      const naive = generateNaiveStrategies(roster, config)
      const ranked = compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
      expect(result.bestScore).toBeGreaterThanOrEqual(ranked[0].score)
    }
  })

  it('shows improvement over naive strategies with 5-char roster', () => {
    const roster: Personaje[] = [
      makePersonaje({
        nombre: 'Thrall',
        clase: 'Chamán',
        nivel: 89,
        profesiones: [{ id: 'herreria', nivel: 100, esMainCrafter: true }],
      }),
      makePersonaje({
        nombre: 'Sylvanas',
        clase: 'Cazadora',
        nivel: 82,
        profesiones: [{ id: 'alquimia', nivel: 75 }],
      }),
      makePersonaje({
        nombre: 'Jaina',
        clase: 'Maga',
        nivel: 70,
        profesiones: [{ id: 'sastreria', nivel: 100, esMainCrafter: true }],
      }),
      makePersonaje({
        nombre: 'Garrosh',
        clase: 'Guerrero',
        nivel: 55,
      }),
      makePersonaje({
        nombre: 'Valeera',
        clase: 'Pícara',
        nivel: 60,
        profesiones: [{ id: 'desuello', nivel: 60 }],
      }),
    ]

    const naive = generateNaiveStrategies(roster, config)
    const ranked = compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
    const seedScore = ranked[0].score
    const seedOrder = ranked[0].strategy.decisiones.map(d => `${d.personaje.nombre}(${d.accion})`).join(' → ')

    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { maxIterations: 100, neighborsPerIteration: 10, seed: 42, noImprovementLimit: 20 },
    )

    const finalOrder = result.bestStrategy.decisiones.map(d => `${d.personaje.nombre}(${d.accion})`).join(' → ')

    expect(result.bestScore).toBeGreaterThanOrEqual(seedScore)

    if (result.bestScore > seedScore) {
      expect(finalOrder).not.toBe(seedOrder)
    }
  })
})
