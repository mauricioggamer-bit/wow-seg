import { describe, it, expect } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import { calculateStrategicValue } from '../strategicValue'

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
  it('keeps class/race/tags/task value when objetivoNivel is reached, but zeroes leveling components', () => {
    const personaje = makePersonaje({
      nivel: 40,
      objetivoNivel: 40,
      tagsEstrategicos: [{ id: 't1', texto: 'Farmeo', puntos: 7 }],
      tareas: [{
        id: 'tarea1', nombre: 'Tarea', esPrincipal: false, tipo: 'weekly', cooldown: 'weekly',
        tiempo_min: 10, prioridad: 1, recompensa: '', hecho: false, ultimo_completado: null, puntos: 5,
      }],
    })
    const roster = [personaje]

    const result = calculateStrategicValue(personaje, config, roster, 0)

    expect(result.classValue).toBeGreaterThan(0)
    expect(result.raceValue).toBeGreaterThan(0)
    expect(result.tagsValue).toBe(7)
    expect(result.taskValue).toBe(5)

    expect(result.warbandImpact).toBe(0)
    expect(result.closenessTo90).toBe(0)
    expect(result.closenessToObjective).toBe(0)
    expect(result.futureXpIncrease).toBe(0)
    expect(result.remainingWeight).toBe(0)
    expect(result.bonusSub90).toBe(0)
    expect(result.bonus8089).toBe(0)

    expect(result.totalScore).toBeGreaterThan(0)
  })

  it('still scores leveling components normally when objetivoNivel is not yet reached', () => {
    const personaje = makePersonaje({ nivel: 80, objetivoNivel: 90 })
    const beneficiary = makePersonaje({ nombre: 'Other', nivel: 85 })
    const roster = [personaje, beneficiary]

    const result = calculateStrategicValue(personaje, config, roster, 0)

    expect(result.bonus8089).toBe(1)
    expect(result.warbandImpact).toBeGreaterThan(0)
  })
})
