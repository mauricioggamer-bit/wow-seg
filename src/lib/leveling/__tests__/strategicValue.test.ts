import { describe, it, expect } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import { calculateStrategicValue } from '../strategicValue'
import { dataStore } from '../../stores/data'

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

const config: LevelingConfig = {
  xpMonstruos: 20000,
  duracionDungeon: 18,
  warbandMentor080: 30,
  warMode: false,
  warModeTarget: 'both',
  customBuffs: [],
}

describe('calculateStrategicValue', () => {
  it('keeps ventaja/task value when objetivoNivel is reached, but zeroes leveling components', () => {
    dataStore.addIndex({ id: 'idx_farmeo_test', name: 'Farmeo Test', description: '', entityTypes: ['personaje'] })
    try {
      const personaje = makePersonaje({
        nombre: 'TagTestChar',
        nivel: 40,
        objetivoNivel: 40,
        tareas: [{
          id: 'tarea1', nombre: 'Tarea', esPrincipal: false, tipo: 'weekly', cooldown: 'weekly',
          tiempo_min: 10, prioridad: 1, recompensa: '', hecho: false, ultimo_completado: null, puntos: 5,
        }],
      })
      dataStore.setStrategicValue('personaje', personaje.nombre, 'idx_farmeo_test', 7)
      const roster = [personaje]

      const result = calculateStrategicValue(personaje, config, roster, 0)

      expect(result.indexValues['idx_farmeo_test']).toBe(7)
      expect(result.taskValue).toBe(5)

      expect(result.warbandImpact).toBe(0)
      expect(result.proximityToMaxLevel).toBe(0)
      expect(result.closenessToObjective).toBe(0)
      expect(result.futureXpIncrease).toBe(0)
      expect(result.remainingWeight).toBe(0)
      expect(result.bonusSub90).toBe(0)
      expect(result.bonus8089).toBe(0)

      expect(result.totalScore).toBeGreaterThan(0)
    } finally {
      dataStore.deleteIndex('idx_farmeo_test')
    }
  })

  it('still scores leveling components normally when objetivoNivel is not yet reached', () => {
    const personaje = makePersonaje({ nivel: 80, objetivoNivel: 90 })
    const beneficiary = makePersonaje({ nombre: 'Other', nivel: 85 })
    const roster = [personaje, beneficiary]

    const result = calculateStrategicValue(personaje, config, roster, 0)

    expect(result.bonus8089).toBe(1)
    expect(result.warbandImpact).toBeGreaterThan(0)
  })

  it('class and race have no base value: default to 0 with no overrides set', () => {
    const personaje = makePersonaje({ clase: 'Mago', raza: 'Gnome' })
    const roster = [personaje]

    const result = calculateStrategicValue(personaje, config, roster, 0)

    expect(result.classValue).toBe(0)
    expect(result.raceValue).toBe(0)
    expect(result.indexValues['general']).toBeUndefined()
  })

  it('counts a class "general" override exactly once in totalScore (no double counting)', () => {
    dataStore.setStrategicValue('class', 'Guerrero', 'general', 5)
    try {
      const personaje = makePersonaje({ clase: 'Guerrero', raza: 'Orco', nivel: 40, objetivoNivel: 40 })
      const roster = [personaje]

      const result = calculateStrategicValue(personaje, config, roster, 0)

      expect(result.classValue).toBe(5)
      expect(result.totalScore).toBe(14)
      expect(result.rawTotalScore).toBe(5)
      expect(result.maxPosible).toBe(35)
    } finally {
      dataStore.resetStrategicValue('class', 'Guerrero', 'general')
    }
  })

  it('a newly created advantage starts at 0 for every class/race until explicitly set', () => {
    const ok = dataStore.addIndex({ id: 'idx_movilidad_test', name: 'Movilidad Test', description: '' })
    expect(ok).toBe(true)
    try {
      const personaje = makePersonaje({ clase: 'Druida', raza: 'Tauren' })
      const roster = [personaje]

      const result = calculateStrategicValue(personaje, config, roster, 0)

      expect(result.indexValues['idx_movilidad_test']).toBeUndefined()
    } finally {
      dataStore.deleteIndex('idx_movilidad_test')
    }
  })
})
