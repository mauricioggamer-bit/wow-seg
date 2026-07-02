import type { Personaje, LevelingConfig, OptimizationPlan, SimulationStep, SimulationResult, TimeRecommendation } from '../types'
import { calculateForCharacter, getEffectiveXpPerDungeon, getXpRemaining, getDungeonsNeeded, getTimeHours } from './calculator'
import { optimize } from './optimizer'
import { XP_CURVE } from '../constants/experience'

function XP_CURVE_LOOKUP(level: number): number {
  return XP_CURVE[level] ?? 0
}

export function simulateByTime(
  personajes: Personaje[],
  config: LevelingConfig,
  initialCount90: number,
  hoursAvailable: number,
): SimulationResult {
  const plan = optimize(personajes, config, initialCount90)
  const steps: SimulationStep[] = []
  let timeLeft = hoursAvailable * 60
  let totalDungeons = 0
  let count90 = initialCount90
  let completed = 0

  for (const entry of plan.entries) {
    const p = personajes.find(pp => pp.planeado_usar && pp.nombre === entry.nombre)
    if (!p) continue

    const calc = calculateForCharacter(p, config, count90)
    const timeNeededMin = calc.dungeons * config.duracionDungeon
    const objetivo = 90

    if (timeLeft <= 0) {
      steps.push({
        nombre: p.nombre,
        clase: p.clase,
        nivelInicial: p.nivel,
        nivelFinal: p.nivel,
        dungeonsUsed: 0,
        timeUsed: 0,
        completed: false,
        reached90: false,
      })
      continue
    }

    if (timeLeft >= timeNeededMin) {
      timeLeft -= timeNeededMin
      totalDungeons += calc.dungeons
      completed++
      const reached90 = p.nivel < 90
      if (reached90) count90++

      steps.push({
        nombre: p.nombre,
        clase: p.clase,
        nivelInicial: p.nivel,
        nivelFinal: objetivo,
        dungeonsUsed: calc.dungeons,
        timeUsed: calc.timeHours,
        completed: true,
        reached90,
      })
    } else {
      const dungeonsDoable = Math.floor(timeLeft / config.duracionDungeon)
      const xpPerDungeon = getEffectiveXpPerDungeon(config, p.nivel, count90)
      const xpGained = dungeonsDoable * xpPerDungeon

      let nivelFinal = p.nivel
      let xpAccount = xpGained
      for (let l = p.nivel + 1; l <= objetivo && xpAccount > 0; l++) {
        const xpForLevel = XP_CURVE_LOOKUP(l)
        if (xpAccount >= xpForLevel) {
          nivelFinal = l
          xpAccount -= xpForLevel
        } else {
          break
        }
      }

      totalDungeons += dungeonsDoable
      timeLeft -= dungeonsDoable * config.duracionDungeon

      steps.push({
        nombre: p.nombre,
        clase: p.clase,
        nivelInicial: p.nivel,
        nivelFinal,
        dungeonsUsed: dungeonsDoable,
        timeUsed: (dungeonsDoable * config.duracionDungeon) / 60,
        completed: false,
        reached90: false,
      })
    }
  }

  return {
    steps,
    totalDungeonsUsed: totalDungeons,
    totalTimeUsed: hoursAvailable - timeLeft / 60,
    charactersCompleted: completed,
    count90Reached: count90,
    remainingTime: timeLeft / 60,
    remainingDungeons: Math.floor(timeLeft / config.duracionDungeon),
  }
}

export function simulateByDungeons(
  personajes: Personaje[],
  config: LevelingConfig,
  initialCount90: number,
  totalDungeonsAvailable: number,
): SimulationResult {
  const plan = optimize(personajes, config, initialCount90)
  const steps: SimulationStep[] = []
  let dungeonsLeft = totalDungeonsAvailable
  let totalTime = 0
  let count90 = initialCount90
  let completed = 0

  for (const entry of plan.entries) {
    const p = personajes.find(pp => pp.planeado_usar && pp.nombre === entry.nombre)
    if (!p) continue

    const calc = calculateForCharacter(p, config, count90)
    const objetivo = 90

    if (dungeonsLeft <= 0) {
      steps.push({
        nombre: p.nombre,
        clase: p.clase,
        nivelInicial: p.nivel,
        nivelFinal: p.nivel,
        dungeonsUsed: 0,
        timeUsed: 0,
        completed: false,
        reached90: false,
      })
      continue
    }

    if (dungeonsLeft >= calc.dungeons) {
      dungeonsLeft -= calc.dungeons
      totalTime += calc.timeHours
      completed++
      const reached90 = p.nivel < 90
      if (reached90) count90++

      steps.push({
        nombre: p.nombre,
        clase: p.clase,
        nivelInicial: p.nivel,
        nivelFinal: objetivo,
        dungeonsUsed: calc.dungeons,
        timeUsed: calc.timeHours,
        completed: true,
        reached90,
      })
    } else {
      const dungeonsDoable = dungeonsLeft
      const xpPerDungeon = getEffectiveXpPerDungeon(config, p.nivel, count90)
      const xpGained = dungeonsDoable * xpPerDungeon

      let nivelFinal = p.nivel
      let xpAccount = xpGained
      for (let l = p.nivel + 1; l <= objetivo && xpAccount > 0; l++) {
        const xpForLevel = XP_CURVE_LOOKUP(l)
        if (xpAccount >= xpForLevel) {
          nivelFinal = l
          xpAccount -= xpForLevel
        } else {
          break
        }
      }

      totalTime += (dungeonsDoable * config.duracionDungeon) / 60
      dungeonsLeft = 0

      steps.push({
        nombre: p.nombre,
        clase: p.clase,
        nivelInicial: p.nivel,
        nivelFinal,
        dungeonsUsed: dungeonsDoable,
        timeUsed: (dungeonsDoable * config.duracionDungeon) / 60,
        completed: false,
        reached90: false,
      })
    }
  }

  return {
    steps,
    totalDungeonsUsed: totalDungeonsAvailable - dungeonsLeft,
    totalTimeUsed: totalTime,
    charactersCompleted: completed,
    count90Reached: count90,
    remainingTime: 0,
    remainingDungeons: dungeonsLeft,
  }
}

export function getTimeRecommendations(
  personajes: Personaje[],
  config: LevelingConfig,
  initialCount90: number,
  hoursAvailable: number,
): TimeRecommendation[] {
  const plan = optimize(personajes, config, initialCount90)
  const pending = personajes.filter(p => p.planeado_usar && p.nivel < 90)
  if (pending.length === 0 || hoursAvailable <= 0) return []

  let count90 = initialCount90
  const recs: TimeRecommendation[] = []
  let timeLeftMin = hoursAvailable * 60

  for (const entry of plan.entries) {
    const p = pending.find(pp => pp.nombre === entry.nombre)
    if (!p) continue
    const calc = calculateForCharacter(p, config, count90)
    const timeNeededMin = calc.dungeons * config.duracionDungeon

    if (timeLeftMin <= 0) break

    if (timeLeftMin >= timeNeededMin) {
      timeLeftMin -= timeNeededMin
      const reached90 = p.nivel < 90
      if (reached90) count90++

      recs.push({
        option: `Completar ${p.nombre} hasta nivel 90`,
        description: reached90
          ? `Llega a 90 — desbloquea Warband Mentor 80-90 +${Math.min(count90 * 5, 25)}% para toda la cuenta`
          : `Objetivo completado`,
        timeUsed: calc.timeHours,
        benefit: entry.timeSavedForOthers,
        charactersInvolved: [{ nombre: p.nombre, nivelFinal: 90, dungeons: calc.dungeons }],
      })
    } else {
      const dungeonsDoable = Math.floor(timeLeftMin / config.duracionDungeon)
      if (dungeonsDoable <= 0) break
      const xpPerDungeon = getEffectiveXpPerDungeon(config, p.nivel, count90)
      const xpGained = dungeonsDoable * xpPerDungeon

      let nivelFinal = p.nivel
      let xpAccount = xpGained
      for (let l = p.nivel + 1; l <= 90 && xpAccount > 0; l++) {
        const xpForLevel = XP_CURVE[l] ?? 0
        if (xpAccount >= xpForLevel) {
          nivelFinal = l
          xpAccount -= xpForLevel
        } else {
          break
        }
      }

      recs.push({
        option: `Subir ${p.nombre} hasta nivel ${nivelFinal}`,
        description: `Progreso parcial: ${dungeonsDoable} dungeons, ${p.nivel} → ${nivelFinal}. No llega a 90 pero avanza.`,
        timeUsed: (dungeonsDoable * config.duracionDungeon) / 60,
        benefit: 0,
        charactersInvolved: [{ nombre: p.nombre, nivelFinal, dungeons: dungeonsDoable }],
      })
      timeLeftMin -= dungeonsDoable * config.duracionDungeon
    }
  }

  if (recs.length === 0) {
    recs.push({
      option: 'Tiempo insuficiente',
      description: `Con ${hoursAvailable}h no alcanza para completar ningún personaje en el orden óptimo.`,
      timeUsed: 0,
      benefit: 0,
      charactersInvolved: [],
    })
  }

  return recs
}