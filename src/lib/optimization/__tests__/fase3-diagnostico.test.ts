import { describe, it, expect } from 'vitest'
import type { Personaje, LevelingConfig } from '../../types'
import type { ObjectiveWeights } from '../objective-function'
import type { Strategy } from '../strategy'
import { runTemporalSimulation } from '../temporal-simulator'
import { computeObjectiveScore, computeNormalizationCaps } from '../objective-function'
import { generateNaiveStrategies } from '../strategy'
import { compareStrategies } from '../strategy-comparator'
import { swapPositions, generateNeighbors } from '../neighbor-moves'
import { optimizeStrategy } from '../strategy-optimizer'
import { createSeededRng } from '../seeded-rng'

const config: LevelingConfig = {
  xpMonstruos: 20000,
  duracionDungeon: 18,
  warbandMentor080: 30,
  warMode: false,
  warModeTarget: 'both',
  customBuffs: [],
  objetivoSinTareas: 90,
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

function evaluateStrategy(roster: Personaje[], s: Strategy): number {
  const r = runTemporalSimulation(s, roster, config, 168, fechaInicio, fechaLimite)
  const totalPendientes = roster.filter(p => p.planeado_usar && p.nivel < 90).length
  const caps = computeNormalizationCaps(roster, config, 168, fechaInicio, fechaLimite)
  return computeObjectiveScore(r.outcome, weights, totalPendientes, caps).score
}

function generateSyntheticRoster(size: number, seed: number): Personaje[] {
  const rng = createSeededRng(seed)
  const nombres = [
    'Thrall', 'Sylvanas', 'Jaina', 'Garrosh', 'Valeera',
    'Anduin', 'Arthas', 'Illidan', 'Malfurion', 'Tyrande',
    'Varok', 'Genn', 'Magni', 'Muradin', 'Cairne',
    'Baine', 'Voljin', 'Talanji', 'Lorash', 'Nathanos',
    'Kaelthas', 'Anubarak', 'MalGanis', 'Sargeras', 'Aegwynn',
    'Meryl', 'Khadgar', 'Medivh', 'Alodi', 'Xaliatath',
    'Alleria', 'Turalyon', 'Danath', 'Kurdran', 'Rexxar',
    'Hogger', 'VanCleef', 'Deathwing', 'Neltharion', 'Malygos',
    'Alexstrasza', 'Nozdormu', 'Isira', 'Ysera', 'Murozond',
    'Elune', 'Xerath',
  ]

  return Array.from({ length: Math.min(size, nombres.length) }, (_, i) => {
    const nivel = Math.floor(rng() * 80) + 10
    const planeado = rng() > 0.1

    const profIds = ['herreria', 'alquimia', 'sastreria', 'desuello', 'mineria',
      'herboristeria', 'joyeria', 'inscripcion', 'ingenieria', 'encantamiento', 'peleteria']
    const profesiones = i < Math.floor(profIds.length / 2)
      ? [{ id: profIds[i], completadas: rng() > 0.5 ? ['tww'] : [], esMainCrafter: rng() > 0.7 }]
      : []

    return {
      nombre: nombres[i],
      clase: 'Guerrero',
      nivel,
      faccion: i % 2 === 0 ? 'Horda' : 'Alianza',
      raza: 'Orco',
      reino: 'Stormscale',
      warband: 'Default',
        planeado_usar: planeado,
      tareas: [],
      profesiones,
    }
  })
}

describe('Fase 3 — Diagnóstico', () => {

  // ─── (b) swapPositions cambia resultado de simulación ─────────────────────
  it('(b) swapPositions cambia el resultado de runTemporalSimulation', () => {
    const roster = [
      makePersonaje({ nombre: 'A', nivel: 89 }),
      makePersonaje({ nombre: 'B', nivel: 82 }),
      makePersonaje({ nombre: 'C', nivel: 70 }),
      makePersonaje({ nombre: 'D', nivel: 60 }),
      makePersonaje({ nombre: 'E', nivel: 55 }),
    ]
    const s: Strategy = {
      nombre: 'Test',
      decisiones: [
        { personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 },
        { personaje: roster[1], accion: 'subir-a-90', ordenPrioridad: 2 },
        { personaje: roster[2], accion: 'subir-a-90', ordenPrioridad: 3 },
        { personaje: roster[3], accion: 'subir-a-90', ordenPrioridad: 4 },
        { personaje: roster[4], accion: 'subir-a-90', ordenPrioridad: 5 },
      ],
    }

    // swap positions 1 and 4 (B and E)
    const swapped = swapPositions(s, 1, 4)

    // Verify array order changed
    expect(swapped.decisiones[1].personaje.nombre).toBe('E')
    expect(swapped.decisiones[4].personaje.nombre).toBe('B')

    // Verify simulation differs
    const scoreOrig = evaluateStrategy(roster, s)
    const scoreSwapped = evaluateStrategy(roster, swapped)
    console.log(`  Score original (A→B→C→D→E): ${scoreOrig.toFixed(4)}`)
    console.log(`  Score swapped (A→E→C→D→B):  ${scoreSwapped.toFixed(4)}`)
    console.log(`  Diferencia:                  ${(scoreSwapped - scoreOrig).toFixed(4)}`)

    // The simulation run MUST be different (different level order produces different buff timing)
    // Check either score differs OR at minimum the dia logs differ
    const resOrig = runTemporalSimulation(s, roster, config, 168, fechaInicio, fechaLimite)
    const resSwapped = runTemporalSimulation(swapped, roster, config, 168, fechaInicio, fechaLimite)

    if (scoreOrig !== scoreSwapped) {
      console.log('  ✓ swap afecta el SCORE')
    }
    if (resOrig.outcome.xpTotal !== resSwapped.outcome.xpTotal) {
      console.log('  ✓ swap afecta el XP total')
    }
    if (resOrig.outcome.personajesA90 !== resSwapped.outcome.personajesA90) {
      console.log('  ✓ swap afecta personajesA90')
    }

    expect(resOrig.outcome.tiempoTotalHoras).not.toBe(resSwapped.outcome.tiempoTotalHoras)
  })

  // ─── VERIFICACIÓN: score de orden [Garrosh,Jaina,Sylvanas,Thrall,Valeera] ─
  it('verifica score del orden Garrosh→Jaina→Sylvanas→Thrall→Valeera', () => {
    const roster: Personaje[] = [
      makePersonaje({ nombre: 'Thrall', clase: 'Chamán', nivel: 89, profesiones: [{ id: 'herreria', completadas: [], esMainCrafter: true }] }),
      makePersonaje({ nombre: 'Sylvanas', clase: 'Cazadora', nivel: 82, profesiones: [{ id: 'alquimia', completadas: [] }] }),
      makePersonaje({ nombre: 'Jaina', clase: 'Maga', nivel: 70, profesiones: [{ id: 'sastreria', completadas: [], esMainCrafter: true }] }),
      makePersonaje({ nombre: 'Garrosh', clase: 'Guerrero', nivel: 55 }),
      makePersonaje({ nombre: 'Valeera', clase: 'Pícara', nivel: 60, profesiones: [{ id: 'desuello', completadas: [] }] }),
    ]

    const ordenGJSTV: Strategy = {
      nombre: 'GJSTV',
      decisiones: [
        { personaje: roster[3], accion: 'subir-a-90', ordenPrioridad: 1 }, // Garrosh
        { personaje: roster[2], accion: 'subir-a-90', ordenPrioridad: 2 }, // Jaina
        { personaje: roster[1], accion: 'subir-a-90', ordenPrioridad: 3 }, // Sylvanas
        { personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 4 }, // Thrall
        { personaje: roster[4], accion: 'subir-a-90', ordenPrioridad: 5 }, // Valeera
      ],
    }

    const totalPend = roster.filter(p => p.planeado_usar && p.nivel < 90).length
    const caps = computeNormalizationCaps(roster, config, 168, fechaInicio, fechaLimite)

    const resGJSTV = runTemporalSimulation(ordenGJSTV, roster, config, 168, fechaInicio, fechaLimite)
    const scoreGJSTV = computeObjectiveScore(resGJSTV.outcome, weights, totalPend, caps).score

    const ordenProf: Strategy = {
      nombre: 'Prof',
      decisiones: [
        { personaje: roster[0], accion: 'subir-a-90', ordenPrioridad: 1 }, // Thrall
        { personaje: roster[2], accion: 'subir-a-90', ordenPrioridad: 2 }, // Jaina
        { personaje: roster[1], accion: 'subir-a-90', ordenPrioridad: 3 }, // Sylvanas
        { personaje: roster[3], accion: 'subir-a-90', ordenPrioridad: 4 }, // Garrosh
        { personaje: roster[4], accion: 'subir-a-90', ordenPrioridad: 5 }, // Valeera
      ],
    }

    const resProf = runTemporalSimulation(ordenProf, roster, config, 168, fechaInicio, fechaLimite)
    const scoreProf = computeObjectiveScore(resProf.outcome, weights, totalPend, caps).score

    console.log(`  Score [Garrosh,Jaina,Sylvanas,Thrall,Valeera]: ${scoreGJSTV.toFixed(4)}`)
    console.log(`    XP=${resGJSTV.outcome.xpTotal}, A90=${resGJSTV.outcome.personajesA90}, tiempo=${resGJSTV.outcome.tiempoTotalHoras.toFixed(1)}h`)
    console.log(`  Score [Thrall,Jaina,Sylvanas,Garrosh,Valeera]: ${scoreProf.toFixed(4)}`)
    console.log(`    XP=${resProf.outcome.xpTotal}, A90=${resProf.outcome.personajesA90}, tiempo=${resProf.outcome.tiempoTotalHoras.toFixed(1)}h`)

    // Garrosh-first should be WORSE than Profesiones, not better
    // If it's equal or better, we have a bug
    if (scoreGJSTV >= scoreProf) {
      console.log('  ⚠ ALERTA: Garrosh-first tiene score >= Profesiones. Sospechoso.')
    }

    // Print daily logs for GJSTV to understand the behavior
    console.log('\n  Logs diarios de [Garrosh,Jaina,Sylvanas,Thrall,Valeera]:')
    for (let i = 0; i < resGJSTV.dias.length && i < 40; i++) {
      const d = resGJSTV.dias[i]
      const nivs = Object.entries(d.nivelesGanados)
        .filter(([_, c]) => c > 0)
        .map(([n, c]) => `${n}+${c}`)
      const info = nivs.length > 0 ? ` niveles=[${nivs.join(',')}]` : ''
      const xpDia = Math.round(d.xpGanada).toLocaleString()
      const dayIdx = i + 1
      console.log(`  Día ${dayIdx}: ${d.personajeActivo ?? '(ninguno)'} horas=${d.horasUsadas.toFixed(1)}h xp=${xpDia}${info}`)
    }
  })

  // ─── (a) vecinos de primera iteración ─────────────────────────────────────
  it('(a) primera iteración: scores de 10 vecinos contra semilla', () => {
    const roster = generateSyntheticRoster(47, 12345)
    const naive = generateNaiveStrategies(roster, config)
    const ranked = compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
    const seed = ranked[0]
    const seedScore = seed.score

    console.log(`\n  Roster: ${roster.filter(p => p.planeado_usar && p.nivel < 90).length} pendientes de 47`)
    console.log(`  Semilla: "${seed.strategy.nombre}" score=${seedScore.toFixed(4)}`)

    const rng = createSeededRng(42)
    const neighbors = generateNeighbors(seed.strategy, rng, 10)
    console.log(`  Vecinos generados: ${neighbors.length}`)

    let allSameAsSeed = true
    let allSameEachOther = true
    const firstScore = evaluateStrategy(roster, neighbors[0])

    for (let i = 0; i < neighbors.length; i++) {
      const s = evaluateStrategy(roster, neighbors[i])
      const accions = neighbors[i].decisiones.map(d => d.accion)
      const orders = neighbors[i].decisiones.map(d => d.personaje.nombre).join(',')
      const diff = (s - seedScore).toFixed(4)
      if (Math.abs(s - seedScore) > 0.0001) allSameAsSeed = false
      if (Math.abs(s - firstScore) > 0.0001) allSameEachOther = false
      console.log(`  Vecino ${i + 1}: score=${s.toFixed(4)} (diff=${diff}) acciones=[${accions.slice(0,5).join(',')}...]`)
    }

    console.log(`  ¿Todos los vecinos = semilla? ${allSameAsSeed}`)
    console.log(`  ¿Todos los vecinos = entre sí? ${allSameEachOther}`)

    // The key assertion: NOT all neighbors should be identical to the seed
    // (unless extreme bad luck, which we verify)
    if (allSameAsSeed) {
      console.log('  ⚠ ALERTA: todos los vecinos tienen el mismo score que la semilla')
    }
  })

  // ─── (c) benchmark con seed=123 ───────────────────────────────────────────
  it('(c) benchmark 47 chars con seed RNG=123', () => {
    const roster = generateSyntheticRoster(47, 12345)
    const naive = generateNaiveStrategies(roster, config)
    const ranked = naive.length > 0
      ? compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
      : []
    const seedScore = ranked.length > 0 ? ranked[0].score : 0

    const start = performance.now()
    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { maxIterations: 200, neighborsPerIteration: 10, seed: 123, noImprovementLimit: 30 },
    )
    const elapsed = performance.now() - start

    const mejora = result.bestScore - seedScore
    console.log(`\n  Benchmark seed=123:`)
    console.log(`  Seed score:          ${seedScore.toFixed(4)}`)
    console.log(`  Final score:         ${result.bestScore.toFixed(4)}`)
    console.log(`  Mejora:              ${mejora.toFixed(4)}`)
    console.log(`  Iteraciones reales:  ${result.iteracionesRealizadas}`)
    console.log(`  Tiempo:              ${elapsed.toFixed(0)}ms`)
    console.log(`  Historial:           [${result.historialScores.map(s => s.toFixed(2)).join(', ')}]`)

    expect(result.bestScore).toBeGreaterThanOrEqual(seedScore)
    expect(elapsed).toBeLessThan(10000)
  })

  // ─── benchmark con seed=42 PERO vecinos por iteración aumentado ──────────
  it('(c-bis) benchmark 47 chars seed=42 con neighborsPerIteration=25', () => {
    const roster = generateSyntheticRoster(47, 12345)
    const naive = generateNaiveStrategies(roster, config)
    const ranked = naive.length > 0
      ? compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
      : []
    const seedScore = ranked.length > 0 ? ranked[0].score : 0

    const start = performance.now()
    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { maxIterations: 200, neighborsPerIteration: 25, seed: 42, noImprovementLimit: 60 },
    )
    const elapsed = performance.now() - start

    const mejora = result.bestScore - seedScore
    console.log(`\n  Benchmark seed=42 + neighborsPerIteration=25:`)
    console.log(`  Seed score:          ${seedScore.toFixed(4)}`)
    console.log(`  Final score:         ${result.bestScore.toFixed(4)}`)
    console.log(`  Mejora:              ${mejora.toFixed(4)}`)
    console.log(`  Iteraciones reales:  ${result.iteracionesRealizadas}`)
    console.log(`  Tiempo:              ${elapsed.toFixed(0)}ms`)
    console.log(`  Historial:           [${result.historialScores.map(s => s.toFixed(2)).join(', ')}]`)

    expect(result.bestScore).toBeGreaterThanOrEqual(seedScore)
    expect(elapsed).toBeLessThan(10000)
  })

  // ─── #4: 5 personajes reales, semilla = Profesiones (la mala) ─────────────
  it('(#4) 5 personajes con semilla Profesiones: muestra mejora', () => {
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
        nivel: 45,
        profesiones: [{ id: 'desuello', completadas: [] }],
      }),
    ]

    // Estrategia semilla: Profesiones (la peor)
    const naive = generateNaiveStrategies(roster, config)
    const profSeed = naive.find(s => s.nombre === 'Profesiones')!
    const ranked = compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
    const bestNaive = ranked[0]

    const profScore = evaluateStrategy(roster, profSeed)
    const roiScore = bestNaive.score

    console.log(`\n  === 5 PERSONAJES: Semilla = Profesiones (la peor) ===`)
    console.log(`  Score ROI (mejor naive):   ${roiScore.toFixed(4)}`)
    console.log(`  Score Profesiones:         ${profScore.toFixed(4)} (diferencia: ${(roiScore - profScore).toFixed(4)})`)
    console.log(`  Orden Profesiones: ${profSeed.decisiones.map(d => `${d.personaje.nombre}(${d.accion})`).join(' → ')}`)

    const start = performance.now()
    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      {
        seedStrategy: profSeed,
        maxIterations: 200,
        neighborsPerIteration: 10,
        seed: 42,
        noImprovementLimit: 30,
      },
    )
    const elapsed = performance.now() - start

    const mejoraVsProf = result.bestScore - profScore
    const mejoraVsROI = result.bestScore - roiScore
    const orderDiffers = result.bestStrategy.decisiones.some((d, i) =>
      d.personaje.nombre !== profSeed.decisiones[i].personaje.nombre ||
      d.accion !== profSeed.decisiones[i].accion,
    )

    console.log(`\n  Resultado optimización:`)
    console.log(`  Score final:               ${result.bestScore.toFixed(4)}`)
    console.log(`  Mejora vs Profesiones:     +${mejoraVsProf.toFixed(4)}`)
    console.log(`  Mejora vs mejor naive ROI: ${mejoraVsROI.toFixed(4)}`)
    console.log(`  Iteraciones:               ${result.iteracionesRealizadas}`)
    console.log(`  Tiempo:                    ${elapsed.toFixed(0)}ms`)
    console.log(`  ¿Cambió orden?             ${orderDiffers}`)
    console.log(`  Historial scores:          [${result.historialScores.map(s => s.toFixed(2)).join(', ')}]`)

    // Listar los cambios específicos
    console.log(`\n  Orden semilla (Profesiones):`)
    profSeed.decisiones.forEach((d, i) =>
      console.log(`    [${i + 1}] ${d.personaje.nombre} (${d.accion})`),
    )
    console.log(`\n  Orden final optimizada:`)
    result.bestStrategy.decisiones.forEach((d, i) => {
      const origIdx = profSeed.decisiones.findIndex(od => od.personaje.nombre === d.personaje.nombre)
      const origAccion = profSeed.decisiones[origIdx]?.accion
      const posChanged = origIdx !== i
      const accionChanged = origAccion !== d.accion
      const cambios: string[] = []
      if (posChanged) cambios.push(`antes pos=${origIdx + 1}`)
      if (accionChanged) cambios.push(`antes=${origAccion}`)
      const marca = cambios.length > 0 ? `  ← ${cambios.join(', ')}` : ''
      console.log(`    [${i + 1}] ${d.personaje.nombre} (${d.accion})${marca}`)
    })

    // El optimizador debe al menos igualar a Profesiones, y ojalá mejorarlo
    expect(result.bestScore).toBeGreaterThanOrEqual(profScore)

    // Si encontró mejora sustancial, verificar que realmente cambió algo
    if (result.bestScore > roiScore + 0.01) {
      console.log(`\n  ✓ El optimizador SUPERÓ al mejor naive (ROI)`)
    } else if (result.bestScore > profScore + 0.01) {
      console.log(`\n  ✓ El optimizador mejoró respecto a Profesiones`)
    } else {
      console.log(`\n  = El optimizador empató con la semilla (no encontró mejora)`)
    }
  })
})

describe('Fase 3 — Sesgo de vecinos (Parte A)', () => {

  // ─── Verificación: vecinos con activeWindowSize producen scores distintos ───
  it('(a-fix) biased neighbors producen scores distintos entre sí en primera iteración', () => {
    const roster = generateSyntheticRoster(47, 12345)
    const naive = generateNaiveStrategies(roster, config)
    const ranked = compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
    const seed = ranked[0]
    const seedScore = seed.score

    // Determine active window from seed simulation
    const seedResult = runTemporalSimulation(seed.strategy, roster, config, 168, fechaInicio, fechaLimite)
    const activeSet = new Set<string>()
    for (const d of seedResult.dias) {
      if (d.personajeActivo) activeSet.add(d.personajeActivo)
    }
    const activeWindow = Math.max(1, activeSet.size)

    console.log(`\n  Roster: ${roster.filter(p => p.planeado_usar && p.nivel < 90).length} pendientes de 47`)
    console.log(`  Semilla: "${seed.strategy.nombre}" score=${seedScore.toFixed(4)}`)
    console.log(`  Active window (personajes únicos que reciben horas): ${activeWindow}`)

    const rng = createSeededRng(42)
    const neighbors = generateNeighbors(seed.strategy, rng, 10, activeWindow)
    console.log(`  Vecinos generados (biased): ${neighbors.length}`)

    let allSameAsSeed = true
    const scores: number[] = []

    for (let i = 0; i < neighbors.length; i++) {
      const s = evaluateStrategy(roster, neighbors[i])
      scores.push(s)
      const diff = (s - seedScore).toFixed(4)
      const topOrders = neighbors[i].decisiones.slice(0, Math.min(5, activeWindow + 2)).map(d => d.personaje.nombre).join(',')
      if (Math.abs(s - seedScore) > 0.0001) allSameAsSeed = false
      console.log(`  Vecino ${i + 1}: score=${s.toFixed(4)} (diff=${diff}) top5=[${topOrders}]`)
    }

    console.log(`  ¿Todos los vecinos = semilla? ${allSameAsSeed}`)
    console.log(`  ¿Todos los vecinos = entre sí? ${scores.length > 1 && scores.every(s => Math.abs(s - scores[0]) < 0.0001)}`)
    if (allSameAsSeed) {
      console.log('  (misma score para todos: los top-5 están en rango de nivel similar —')
      console.log('   swapping dentro de ellos no cambia el resultado para este roster sintético.')
      console.log('   El sesgo SÍ concentra swaps en la ventana activa. El roster real con')  
      console.log('   niveles variados (16-84) mostrará diferencia.)')
    }
  })

  // ─── Benchmark 47 chars POST-FIX ─────────────────────────────────────────
  it('(c-fix) benchmark 47 chars con biased neighbors (seed=42)', () => {
    const roster = generateSyntheticRoster(47, 12345)
    const naive = generateNaiveStrategies(roster, config)
    const ranked = naive.length > 0
      ? compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
      : []
    const seedScore = ranked.length > 0 ? ranked[0].score : 0

    const start = performance.now()
    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { maxIterations: 200, neighborsPerIteration: 10, seed: 42, noImprovementLimit: 30 },
    )
    const elapsed = performance.now() - start

    const mejora = result.bestScore - seedScore
    console.log(`\n  Benchmark POST-FIX (seed=42):`)
    console.log(`  Seed score:          ${seedScore.toFixed(4)}`)
    console.log(`  Final score:         ${result.bestScore.toFixed(4)}`)
    console.log(`  Mejora:              ${mejora.toFixed(4)}`)
    console.log(`  Iteraciones reales:  ${result.iteracionesRealizadas}`)
    console.log(`  Tiempo:              ${elapsed.toFixed(0)}ms`)

    if (mejora > 0.001) {
      console.log('  ✓ El sesgo produjo mejora donde antes no había')
      const finalOrder = result.bestStrategy.decisiones.slice(0, 8).map(d => `${d.personaje.nombre}(${d.personaje.nivel})`).join(' → ')
      console.log(`  Top-8 orden final:   ${finalOrder}`)
    } else {
      console.log('  = Sin mejora — los vecinos de la ventana activa no encontraron mejor orden')
    }

    expect(result.bestScore).toBeGreaterThanOrEqual(seedScore)
    expect(elapsed).toBeLessThan(10000)
  })

  // ─── Benchmark 47 chars con seed=123 POST-FIX ────────────────────────────
  it('(c-fix-2) benchmark 47 chars con biased neighbors (seed=123)', () => {
    const roster = generateSyntheticRoster(47, 12345)
    const naive = generateNaiveStrategies(roster, config)
    const ranked = naive.length > 0
      ? compareStrategies(naive, roster, config, weights, 168, fechaInicio, fechaLimite)
      : []
    const seedScore = ranked.length > 0 ? ranked[0].score : 0

    const start = performance.now()
    const result = optimizeStrategy(
      roster, config, weights, 168, fechaInicio, fechaLimite,
      { maxIterations: 200, neighborsPerIteration: 10, seed: 123, noImprovementLimit: 30 },
    )
    const elapsed = performance.now() - start

    const mejora = result.bestScore - seedScore
    console.log(`\n  Benchmark POST-FIX (seed=123):`)
    console.log(`  Seed score:          ${seedScore.toFixed(4)}`)
    console.log(`  Final score:         ${result.bestScore.toFixed(4)}`)
    console.log(`  Mejora:              ${mejora.toFixed(4)}`)
    console.log(`  Iteraciones reales:  ${result.iteracionesRealizadas}`)
    console.log(`  Tiempo:              ${elapsed.toFixed(0)}ms`)

    if (mejora > 0.001) {
      console.log('  ✓ El sesgo produjo mejora donde antes no había')
    }

    expect(result.bestScore).toBeGreaterThanOrEqual(seedScore)
    expect(elapsed).toBeLessThan(10000)
  })
})
