import { describe, it, expect } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import type { ObjectiveWeights } from '../objective-function'
import type { PatronSemanal } from '../../types'
import { SEED_DATA } from '../../data/seed'
import { generateNaiveStrategies } from '../strategy'
import { compareStrategies } from '../strategy-comparator'
import { optimizeStrategy } from '../strategy-optimizer'
import { runTemporalSimulation } from '../temporal-simulator'
import { computeObjectiveScore } from '../objective-function'

const patronSemanal: PatronSemanal = {
  lunes: 1.5,
  martes: 1.5,
  miercoles: 1.5,
  jueves: 1.5,
  viernes: 1.5,
  sabado: 5,
  domingo: 5,
}
const TOTAL_SEMANAL_REAL = 1.5 * 5 + 5 * 2 // 17.5h

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

const fechaInicio = new Date()
const fechaLimite = new Date('2026-08-11T00:00:00Z')
const HORAS_SEMANA = TOTAL_SEMANAL_REAL

function normalizeRealRoster(raw: typeof SEED_DATA.personajes): Personaje[] {
  return raw.map(p => ({
    ...p,
    profesiones: (p as any).profesiones ?? [],
    timewaysPct: (p as any).timewaysPct ?? 0,
    objetivoNivel: (p as any).objetivoNivel ?? 90,
    expansion_por_defecto: (p as any).expansion_por_defecto ?? null,
    parecidos: (p as any).parecidos ?? [],
    tipo: (p as any).tipo ?? 'funcional',
  }))
}

describe('Roster real — Fase 4', () => {
  it('carga, analiza y optimiza el roster real', () => {
    const rawRoster = SEED_DATA.personajes
    const roster = normalizeRealRoster(rawRoster)

    const total = roster.length
    const planeadoUsar = roster.filter(p => p.planeado_usar)
    const pending = roster.filter(p => p.planeado_usar && p.nivel < 90)
    const already90 = roster.filter(p => p.planeado_usar && p.nivel >= 90)
    const nonPlaneado = roster.filter(p => !p.planeado_usar)

    console.log(`\n╔══════════════════════════════════════════╗`)
    console.log(`║     ROSTER REAL — ANÁLISIS INICIAL      ║`)
    console.log(`╚══════════════════════════════════════════╝`)
    console.log(`  Total personajes:        ${total}`)
    console.log(`  planeado_usar = true:    ${planeadoUsar.length}`)
    console.log(`  Ya nivel 90:             ${already90.length} (${already90.map(p => p.nombre).join(', ')})`)
    console.log(`  Pendientes (< 90):       ${pending.length}`)
    console.log(`  planeado_usar = false:   ${nonPlaneado.length}`)
    console.log(`  Rango niveles pendientes: ${Math.min(...pending.map(p => p.nivel))}–${Math.max(...pending.map(p => p.nivel))}`)
    console.log(`  Patrón semanal: ${patronSemanal.lunes}/${patronSemanal.martes}/${patronSemanal.miercoles}/${patronSemanal.jueves}/${patronSemanal.viernes}/${patronSemanal.sabado}/${patronSemanal.domingo}h/día (total ${TOTAL_SEMANAL_REAL}h/sem)`)

    if (pending.length === 0) {
      console.log('\n  ¡Todos los personajes ya están en 90! No hay nada que optimizar.')
      return
    }

    const naive = generateNaiveStrategies(roster, config)
    const ranked = compareStrategies(naive, roster, config, weights, HORAS_SEMANA, fechaInicio, fechaLimite, patronSemanal)
    const seedResult = ranked[0]

    const ordenNaive = seedResult.strategy.decisiones.slice(0, 10).map((d, i) =>
      `    [${i + 1}] ${d.personaje.nombre} (lvl ${d.personaje.nivel})`
    ).join('\n')

    console.log(`\n╔══════════════════════════════════════════╗`)
    console.log(`║     MEJOR ESTRATEGIA NAIVE (ROI)        ║`)
    console.log(`╚══════════════════════════════════════════╝`)
    console.log(`  Score:                   ${seedResult.score.toFixed(4)}`)
    console.log(`  XP total:                ${seedResult.result.outcome.xpTotal.toLocaleString()}`)
    console.log(`  Tiempo total:            ${seedResult.result.outcome.tiempoTotalHoras.toFixed(1)}h`)
    console.log(`  Personajes a 90:         ${seedResult.result.outcome.personajesA90}`)
    console.log(`  Profesiones cubiertas:   ${seedResult.result.outcome.profesionesCubiertas.size}/11`)
    console.log(`  Buff Warband final:      ${seedResult.result.outcome.rosterStateFinal.warbandMentorBuff}%`)
    console.log(`\n  Top-10 orden naive:`)
    console.log(ordenNaive)

    // ─── DIAGNÓSTICO: ¿swap cambia el resultado? ─────────────────────────
    const swappedDecisions = [...seedResult.strategy.decisiones]
    const tmp = swappedDecisions[0]
    swappedDecisions[0] = swappedDecisions[7]
    swappedDecisions[7] = tmp
    const swappedStrategy = { nombre: 'Swap0-7', decisiones: swappedDecisions.map((d, i) => ({ ...d, ordenPrioridad: i + 1 })) }
    const resSwap = runTemporalSimulation(swappedStrategy, roster, config, HORAS_SEMANA, fechaInicio, fechaLimite, 1.0, patronSemanal)
    const totalPend = roster.filter(p => p.planeado_usar && p.nivel < 90).length
    // Usa auto-cálculo de caps (no pasar explícitos)
    const scoreSwap = computeObjectiveScore(resSwap.outcome, weights, totalPend)
    console.log(`\n  Diagnóstico swap [1]Mawgul(84) ↔ [8]Pogara(59):`)
    console.log(`    Score original:  ${seedResult.score.toFixed(4)}`)
    console.log(`    Score swapped:   ${scoreSwap.toFixed(4)}`)
    console.log(`    XP orig: ${seedResult.result.outcome.xpTotal.toFixed(1)}  swap: ${resSwap.outcome.xpTotal.toFixed(1)}`)
    console.log(`    A90 orig: ${seedResult.result.outcome.personajesA90}  swap: ${resSwap.outcome.personajesA90}`)
    console.log(`    horas orig: ${seedResult.result.outcome.tiempoTotalHoras.toFixed(1)}  swap: ${resSwap.outcome.tiempoTotalHoras.toFixed(1)}`)

    for (let i = 0; i < Math.min(seedResult.result.dias.length, 14); i++) {
      const dROI = seedResult.result.dias[i]
      const dSwap = resSwap.dias[i]
      const nivROI = dROI.personajeActivo ?? '(ninguno)'
      const nivSwap = dSwap.personajeActivo ?? '(ninguno)'
      console.log(`  Día ${i + 1}: ROI=${nivROI}(h=${dROI.horasUsadas.toFixed(1)})  Swap=${nivSwap}(h=${dSwap.horasUsadas.toFixed(1)})`)
    }

    // ─── OPTIMIZACIÓN ────────────────────────────────────────────────────
    console.log(`\n╔══════════════════════════════════════════╗`)
    console.log(`║     OPTIMIZACIÓN HILL-CLIMBING          ║`)
    console.log(`╚══════════════════════════════════════════╝`)
    console.log(`  Parámetros: maxIterations=200, neighborsPerIteration=10, seed=42`)
    console.log(`  Fecha inicio: ${fechaInicio.toISOString().slice(0, 10)}`)
    console.log(`  Fecha límite: ${fechaLimite.toISOString().slice(0, 10)} (Turbulent Timeways V)`)
    console.log(`  horas/semana: ${HORAS_SEMANA}`)

    const startTime = performance.now()
    const optResult = optimizeStrategy(
      roster, config, weights, HORAS_SEMANA, fechaInicio, fechaLimite,
      { maxIterations: 200, neighborsPerIteration: 10, seed: 42, noImprovementLimit: 30, patronSemanal },
    )
    const elapsed = performance.now() - startTime

    const deltaScore = optResult.bestScore - seedResult.score
    const deltaA90 = optResult.bestResult.outcome.personajesA90 - seedResult.result.outcome.personajesA90

    console.log(`\n  RESULTADOS:`)
    console.log(`  Score final:             ${optResult.bestScore.toFixed(4)}`)
    console.log(`  Delta score vs naive:    ${deltaScore >= 0 ? '+' : ''}${deltaScore.toFixed(4)}`)
    console.log(`  Delta personajes a 90:   ${deltaA90 >= 0 ? '+' : ''}${deltaA90}`)
    console.log(`  Iteraciones reales:      ${optResult.iteracionesRealizadas}`)
    console.log(`  Tiempo de ejecución:     ${elapsed.toFixed(0)}ms`)
    console.log(`  XP total final:          ${optResult.bestResult.outcome.xpTotal.toLocaleString()}`)
    console.log(`  Personajes a 90 final:   ${optResult.bestResult.outcome.personajesA90}`)
    console.log(`  Tiempo total final:      ${optResult.bestResult.outcome.tiempoTotalHoras.toFixed(1)}h`)
    console.log(`  Profesiones cubiertas:   ${optResult.bestResult.outcome.profesionesCubiertas.size}/11`)

    console.log(`\n  Top-10 orden optimizado:`)
    const ordenOpt = optResult.bestStrategy.decisiones.slice(0, 10)
    for (let i = 0; i < ordenOpt.length; i++) {
      const d = ordenOpt[i]
      const naiveIdx = seedResult.strategy.decisiones.findIndex(
        nd => nd.personaje.nombre === d.personaje.nombre,
      )
      const posChanged = naiveIdx !== i
      const marca = posChanged ? `  ← antes pos ${naiveIdx + 1}` : ''
      console.log(`    [${i + 1}] ${d.personaje.nombre} (lvl ${d.personaje.nivel})${marca}`)
    }

    const seedDias = seedResult.result.dias.length
    const optDias = optResult.bestResult.dias.length
    console.log(`\n  Días simulados (naive):  ${seedDias}`)
    console.log(`  Días simulados (opt):    ${optDias}`)

    console.log(`\n  Historial de scores del optimizador:`)
    console.log(`    [${optResult.historialScores.map(s => s.toFixed(2)).join(', ')}]`)

    if (deltaScore > 0.01) {
      console.log(`\n  ✓ MEJORA ENCONTRADA: +${deltaScore.toFixed(4)} puntos de score`)
    } else if (deltaScore < -0.01) {
      console.log(`\n  ⚠ REGRESIÓN: -${Math.abs(deltaScore).toFixed(4)} (esto no debería pasar)`)
    } else {
      console.log(`\n  = El optimizador empató con la mejor naive (no encontró mejora adicional)`)
    }

    expect(optResult.bestScore).toBeGreaterThanOrEqual(seedResult.score - 0.001)
    expect(elapsed).toBeLessThan(10000)
  })
})
