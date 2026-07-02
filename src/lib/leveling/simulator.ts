import type { Personaje, LevelingConfig, OptimizationPlan, SimulationStep, SimulationResult } from '../types'
import { calculateForCharacter, getTimeHours, getEffectiveXpPerDungeon, getXpRemaining, getDungeonsNeeded } from './calculator'
import { optimize } from './optimizer'
import { XP_CURVE } from '../constants/experience'

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

    const objetivo = p.objetivoNivel ?? 80
    const calc = calculateForCharacter(p, config, count90)
    const timeNeededMin = calc.dungeons * config.duracionDungeon

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
      const reached90 = objetivo >= 90 && p.nivel < 90
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
      const xpRem = getXpRemaining(p.nivel, objetivo)
      const progressPct = xpRem > 0 ? Math.min(1, xpGained / xpRem) : 0

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

    const objetivo = p.objetivoNivel ?? 80
    const calc = calculateForCharacter(p, config, count90)

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
      const reached90 = objetivo >= 90 && p.nivel < 90
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

function XP_CURVE_LOOKUP(level: number): number {
  return XP_CURVE[level] ?? 0
}