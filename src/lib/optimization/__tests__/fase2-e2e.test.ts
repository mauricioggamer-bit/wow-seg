import { describe, it, expect } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import type { ObjectiveWeights } from '../objective-function'
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

describe('Fase 2 — End to End', () => {
  it('generates strategies, runs simulation, and ranks them', () => {
    const roster: Personaje[] = [
      makePersonaje({
        nombre: 'Thrall',
        clase: 'Chamán',
        nivel: 89,
        profesiones: [{ id: 'herreria', completadas: [], esMainCrafter: true }],
      }),
      makePersonaje({
        nombre: 'Sylvanas',
        clase: 'Cazadora',
        nivel: 82,
        profesiones: [{ id: 'alquimia', completadas: [] }],
      }),
      makePersonaje({
        nombre: 'Jaina',
        clase: 'Maga',
        nivel: 70,
        profesiones: [{ id: 'sastreria', completadas: [], esMainCrafter: true }],
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
        profesiones: [{ id: 'desuello', completadas: [] }],
      }),
    ]

    const strategies = generateNaiveStrategies(roster, config)
    expect(strategies.length).toBe(3)

    const fechaInicio = new Date('2026-07-05T00:00:00Z')
    const fechaLimite = new Date('2026-08-11T00:00:00Z')

    const results = compareStrategies(strategies, roster, config, weights, 40, fechaInicio, fechaLimite)

    expect(results.length).toBe(3)
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(r.result.outcome.rosterStateFinal).toBeDefined()
      expect(r.result.outcome.profesionesCubiertas).toBeInstanceOf(Set)
      expect(r.result.outcome.tiempoTotalHoras).toBeGreaterThanOrEqual(0)
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('muestra ranking completo de estrategias naive con datos reales', () => {
    const roster: Personaje[] = [
      makePersonaje({
        nombre: 'Thrall',
        clase: 'Chamán',
        nivel: 89,
        profesiones: [{ id: 'herreria', completadas: [], esMainCrafter: true }],
      }),
      makePersonaje({
        nombre: 'Sylvanas',
        clase: 'Cazadora',
        nivel: 82,
        profesiones: [{ id: 'alquimia', completadas: [] }],
      }),
      makePersonaje({
        nombre: 'Jaina',
        clase: 'Maga',
        nivel: 70,
        profesiones: [{ id: 'sastreria', completadas: [], esMainCrafter: true }],
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
        profesiones: [{ id: 'desuello', completadas: [] }],
      }),
    ]

    const strategies = generateNaiveStrategies(roster, config)
    const fechaInicio = new Date('2026-07-05T00:00:00Z')
    const fechaLimite = new Date('2026-08-11T00:00:00Z')
    const results = compareStrategies(strategies, roster, config, weights, 168, fechaInicio, fechaLimite)

    const logDias = (result: typeof results[0]['result'], label: string) => {
      let d = `\n--- Días: ${label} ---\n`
      let prevCount90 = 0
      for (let i = 0; i < result.dias.length && i < 40; i++) {
        const dia = result.dias[i]
        const personajesEndOfDay = roster.map(p => {
          const levelsGained = (dia.nivelesGanados[p.nombre] ?? 0)
          return { nombre: p.nombre, nivel: p.nivel + (result.outcome.xpTotal > 0 ? 1 : 0) }
        })
        d += `Día ${i + 1} (${dia.fecha.toISOString().slice(0, 10)}): `
        d += `activo=${dia.personajeActivo ?? '(ninguno)'} `
        d += `horas=${dia.horasUsadas.toFixed(1)}h xp=${Math.round(dia.xpGanada).toLocaleString()} `
        const nivs = Object.entries(dia.nivelesGanados)
          .filter(([_, c]) => c > 0)
          .map(([n, c]) => `${n}+${c}`)
        if (nivs.length > 0) d += `niveles=[${nivs.join(',')}] `
        d += '\n'
      }
      if (result.dias.length > 40) {
        d += `... (${result.dias.length - 40} días más)\n`
      }
      console.log(d)
    }

    let output = '\n=== RANKING DE ESTRATEGIAS ===\n'
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      const orden = r.result.dias.length > 0 ? r.strategy.decisiones.map(d => d.personaje.nombre).join(' → ') : '(sin progreso)'
      output += `\n#${i + 1} ${r.strategy.nombre} — Score: ${r.score.toFixed(2)}`
      output += `\n   Tiempo: ${r.result.outcome.tiempoTotalHoras.toFixed(1)}h / ${r.result.dias.length} días`
      output += `\n   XP total: ${r.result.outcome.xpTotal.toLocaleString()}`
      output += `\n   Personajes a 90: ${r.result.outcome.personajesA90}`
      output += `\n   Profesiones cubiertas: ${r.result.outcome.profesionesCubiertas.size}/11`
      output += `\n   Buff final: ${r.result.outcome.rosterStateFinal.warbandMentorBuff}%`
      output += `\n   count90 final: ${r.result.outcome.rosterStateFinal.count90}`
      output += `\n   Orden: ${orden}\n`

      logDias(r.result, r.strategy.nombre)
    }
    console.log(output)

    const alguienLlegaA90 = results.some(r => r.result.outcome.personajesA90 > 0)
    expect(alguienLlegaA90).toBe(true)

    const scoresUnicos = new Set(results.map(r => r.score))
    expect(scoresUnicos.size).toBeGreaterThan(1)

    expect(results.length).toBe(3)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
    expect(results[0].result.outcome.personajesA90).toBeGreaterThan(0)
  })
})
