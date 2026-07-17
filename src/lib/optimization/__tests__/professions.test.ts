import { describe, it, expect } from 'vitest'
import type { Personaje } from '../../types'
import {
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
    planeado_usar: true,
    tareas: [],
    profesiones: [],
    ...overrides,
  }
}

describe('tieneMainCrafter', () => {
  it('returns false for empty roster', () => {
    expect(tieneMainCrafter([], 'herreria')).toBe(false)
  })

  it('returns false when no one has the profession', () => {
    const roster = [makePersonaje({ profesiones: [{ id: 'mineria', completadas: ['tww'] }] })]
    expect(tieneMainCrafter(roster, 'herreria')).toBe(false)
  })

  it('returns true when a character has esMainCrafter=true', () => {
    const roster = [
      makePersonaje({
        profesiones: [{ id: 'herreria', completadas: [], esMainCrafter: true }],
      }),
    ]
    expect(tieneMainCrafter(roster, 'herreria')).toBe(true)
  })

  it('returns true when a character has completadas expansions', () => {
    const roster = [
      makePersonaje({
        profesiones: [{ id: 'alquimia', completadas: ['tww'] }],
      }),
    ]
    expect(tieneMainCrafter(roster, 'alquimia')).toBe(true)
  })

  it('returns false when completadas empty and no esMainCrafter', () => {
    const roster = [
      makePersonaje({
        profesiones: [{ id: 'sastreria', completadas: [] }],
      }),
    ]
    expect(tieneMainCrafter(roster, 'sastreria')).toBe(false)
  })

  it('returns true when a character has rol=main', () => {
    const roster = [
      makePersonaje({
        profesiones: [{ id: 'joyeria', completadas: [], rol: '1ro' }],
      }),
    ]
    expect(tieneMainCrafter(roster, 'joyeria')).toBe(true)
  })

  it('returns false when rol=cd even with completadas', () => {
    const roster = [
      makePersonaje({
        profesiones: [{ id: 'encantamiento', completadas: ['tww'], rol: '2do' }],
      }),
    ]
    expect(tieneMainCrafter(roster, 'encantamiento')).toBe(false)
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
          { id: 'herreria', completadas: [], esMainCrafter: true },
          { id: 'mineria', completadas: ['tww'] },
        ],
      }),
      makePersonaje({
        nombre: 'CharB',
        profesiones: [{ id: 'alquimia', completadas: ['tww'] }],
      }),
    ]
    const all = ['herreria', 'mineria', 'alquimia', 'sastreria']
    expect(computeCoberturaProfesiones(roster, all)).toBe(3)
  })
})
