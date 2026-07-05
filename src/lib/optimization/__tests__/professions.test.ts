import { describe, it, expect } from 'vitest'
import type { Personaje } from '../../types'
import {
  getMainCrafterThreshold,
  tieneMainCrafter,
  computeCoberturaProfesiones,
} from '../professions'

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

describe('getMainCrafterThreshold', () => {
  it('returns 100 by default', () => {
    expect(getMainCrafterThreshold()).toBe(100)
  })

  it('returns custom value when config provided', () => {
    expect(getMainCrafterThreshold({ maxLevel: 100, mainCrafterLevel: 50 })).toBe(50)
  })
})

describe('tieneMainCrafter', () => {
  it('returns false for empty roster', () => {
    expect(tieneMainCrafter([], 'herreria')).toBe(false)
  })

  it('returns false when no one has the profession', () => {
    const roster = [makePersonaje({ profesiones: [{ id: 'mineria', nivel: 100 }] })]
    expect(tieneMainCrafter(roster, 'herreria')).toBe(false)
  })

  it('returns true when a character has esMainCrafter=true', () => {
    const roster = [
      makePersonaje({
        profesiones: [{ id: 'herreria', nivel: 50, esMainCrafter: true }],
      }),
    ]
    expect(tieneMainCrafter(roster, 'herreria')).toBe(true)
  })

  it('returns true when a character has nivel >= threshold (100)', () => {
    const roster = [
      makePersonaje({
        profesiones: [{ id: 'alquimia', nivel: 100 }],
      }),
    ]
    expect(tieneMainCrafter(roster, 'alquimia')).toBe(true)
  })

  it('returns false when nivel < threshold and no esMainCrafter', () => {
    const roster = [
      makePersonaje({
        profesiones: [{ id: 'sastreria', nivel: 50 }],
      }),
    ]
    expect(tieneMainCrafter(roster, 'sastreria')).toBe(false)
  })
})

describe('computeCoberturaProfesiones', () => {
  it('returns 0 for empty roster', () => {
    expect(computeCoberturaProfesiones([], ['herreria', 'mineria'])).toBe(0)
  })

  it('counts covered professions across multiple characters', () => {
    const roster = [
      makePersonaje({
        nombre: 'CharA',
        profesiones: [
          { id: 'herreria', nivel: 100, esMainCrafter: true },
          { id: 'mineria', nivel: 100 },
        ],
      }),
      makePersonaje({
        nombre: 'CharB',
        profesiones: [{ id: 'alquimia', nivel: 100 }],
      }),
    ]
    const all = ['herreria', 'mineria', 'alquimia', 'sastreria']
    expect(computeCoberturaProfesiones(roster, all)).toBe(3)
  })
})
