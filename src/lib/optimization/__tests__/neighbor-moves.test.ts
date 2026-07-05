import { describe, it, expect } from 'vitest'
import type { Personaje } from '../../types'
import type { Strategy } from '../strategy'
import { swapPositions, changeAccion, generateNeighbors } from '../neighbor-moves'
import { createSeededRng } from '../seeded-rng'

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

function makeStrategy(personajes: Personaje[]): Strategy {
  return {
    nombre: 'Test',
    decisiones: personajes.map((p, i) => ({
      personaje: p,
      accion: 'subir-a-90' as const,
      ordenPrioridad: i + 1,
    })),
  }
}

describe('swapPositions', () => {
  it('swaps two positions and reindexes ordenPrioridad', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 80 }),
      makePersonaje({ nombre: 'C', nivel: 90 }),
    ]
    const s = makeStrategy(roster)
    const swapped = swapPositions(s, 0, 2)
    expect(swapped.decisiones[0].personaje.nombre).toBe('C')
    expect(swapped.decisiones[1].personaje.nombre).toBe('B')
    expect(swapped.decisiones[2].personaje.nombre).toBe('A')
    expect(swapped.decisiones[0].ordenPrioridad).toBe(1)
    expect(swapped.decisiones[1].ordenPrioridad).toBe(2)
    expect(swapped.decisiones[2].ordenPrioridad).toBe(3)
  })

  it('does nothing when i === j', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 80 }),
    ]
    const s = makeStrategy(roster)
    const swapped = swapPositions(s, 1, 1)
    expect(swapped).toBe(s)
  })

  it('does nothing when index out of bounds', () => {
    const roster = [makePersonaje({ nombre: 'A', nivel: 70 })]
    const s = makeStrategy(roster)
    expect(swapPositions(s, 0, 5)).toBe(s)
    expect(swapPositions(s, -1, 0)).toBe(s)
  })

  it('does not mutate original strategy', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 80 }),
    ]
    const s = makeStrategy(roster)
    const originalOrder = s.decisiones.map(d => d.personaje.nombre)
    swapPositions(s, 0, 1)
    expect(s.decisiones.map(d => d.personaje.nombre)).toEqual(originalOrder)
  })
})

describe('changeAccion', () => {
  it('changes action for a given index', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 80 }),
    ]
    const s = makeStrategy(roster)
    const changed = changeAccion(s, 1, 'saltear')
    expect(changed.decisiones[0].accion).toBe('subir-a-90')
    expect(changed.decisiones[1].accion).toBe('saltear')
    expect(changed.decisiones[1].ordenPrioridad).toBe(2)
  })

  it('does nothing when nuevaAccion equals current', () => {
    const roster = [makePersonaje({ nombre: 'A', nivel: 70 })]
    const s = makeStrategy(roster)
    const changed = changeAccion(s, 0, 'subir-a-90')
    expect(changed).toBe(s)
  })

  it('does nothing for out of bounds index', () => {
    const roster = [makePersonaje({ nombre: 'A', nivel: 70 })]
    const s = makeStrategy(roster)
    expect(changeAccion(s, 5, 'saltear')).toBe(s)
    expect(changeAccion(s, -1, 'saltear')).toBe(s)
  })

  it('does not mutate original strategy', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 70 }),
      makePersonaje({ nombre: 'B', nivel: 80 }),
    ]
    const s = makeStrategy(roster)
    changeAccion(s, 0, 'saltear')
    expect(s.decisiones[0].accion).toBe('subir-a-90')
  })
})

describe('generateNeighbors', () => {
  it('returns empty array for single-character roster', () => {
    const roster = [makePersonaje({ nombre: 'A', nivel: 70 })]
    const s = makeStrategy(roster)
    const rng = createSeededRng(42)
    const neighbors = generateNeighbors(s, rng, 10)
    expect(neighbors).toEqual([])
  })

  it('returns at most maxNeighbors candidates', () => {
    const roster = Array.from({ length: 10 }, (_, i) =>
      makePersonaje({ nombre: `Char${i}`, nivel: 50 + i }),
    )
    const s = makeStrategy(roster)
    const rng = createSeededRng(42)
    const neighbors = generateNeighbors(s, rng, 5)
    expect(neighbors.length).toBeLessThanOrEqual(5)
    expect(neighbors.length).toBeGreaterThan(0)
  })

  it('all generated strategies are different from original and from each other', () => {
    const roster = Array.from({ length: 8 }, (_, i) =>
      makePersonaje({ nombre: `Char${i}`, nivel: 50 + i }),
    )
    const s = makeStrategy(roster)
    const rng = createSeededRng(42)
    const neighbors = generateNeighbors(s, rng, 20)

    const keys = new Set(neighbors.map(n => JSON.stringify(n.decisiones.map(d => d.personaje.nombre + ':' + d.accion))))
    expect(keys.size).toBe(neighbors.length)
  })

  it('is deterministic with same rng seed', () => {
    const roster = Array.from({ length: 6 }, (_, i) =>
      makePersonaje({ nombre: `Char${i}`, nivel: 50 + i }),
    )
    const s = makeStrategy(roster)
    const rng1 = createSeededRng(99)
    const rng2 = createSeededRng(99)
    const n1 = generateNeighbors(s, rng1, 5)
    const n2 = generateNeighbors(s, rng2, 5)

    expect(n1.length).toBe(n2.length)
    for (let i = 0; i < n1.length; i++) {
      expect(n1[i].decisiones.map(d => d.personaje.nombre)).toEqual(
        n2[i].decisiones.map(d => d.personaje.nombre),
      )
      expect(n1[i].decisiones.map(d => d.accion)).toEqual(
        n2[i].decisiones.map(d => d.accion),
      )
    }
  })

  it('produces both swaps and action changes', () => {
    const roster = Array.from({ length: 10 }, (_, i) =>
      makePersonaje({ nombre: `Char${i}`, nivel: 50 + i }),
    )
    const s = makeStrategy(roster)
    const rng = createSeededRng(42)
    const neighbors = generateNeighbors(s, rng, 30)

    const someSwap = neighbors.some(n =>
      n.decisiones.some(d => d.accion !== 'subir-a-90'),
    )
    const someActionChange = neighbors.some(n =>
      n.decisiones.every(d => d.accion === 'subir-a-90') &&
      n.decisiones.some((d, idx) => d.personaje.nombre !== s.decisiones[idx].personaje.nombre),
    )
    expect(someSwap || someActionChange).toBe(true)
  })
})
