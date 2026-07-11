import type { Personaje, LevelingConfig, OptimizationEntry, OptimizationPlan } from '../types'
import { calculateForCharacter, getTimeHours, getDungeonsNeeded, getXpRemaining } from './calculator'
import { calculateStrategicValue } from './strategicValue'
import { getObjetivoFromTareas } from './objetivo'
import { dataStore } from '../stores/data'
import { STRATEGIC_COMPONENTS } from '../constants'

function getStrategicBonusWeight(): number {
  const override = dataStore.getComponentWeight('optimizationStrategicBonus')
  if (override > 0) return override
  const def = STRATEGIC_COMPONENTS.find(c => c.key === 'optimizationStrategicBonus')?.weight
  return typeof def === 'number' ? def : 0.1
}

export function optimize(
  personajes: Personaje[],
  config: LevelingConfig,
  initialCount90: number,
): OptimizationPlan {
  const pending = personajes.filter(p => p.planeado_usar && p.nivel < getObjetivoFromTareas(p.tareas))
  if (pending.length === 0) {
    return { entries: [], optimizedTime: 0, baselineTime: 0, timeSaved: 0, order: [] }
  }

  const baselineTime = pending.reduce(
    (sum, p) => sum + calculateForCharacter(p, config, initialCount90).timeHours,
    0,
  )

  const remaining = [...pending]
  const order: OptimizationEntry[] = []
  let currentCount90 = initialCount90
  let optimizedTime = 0
  const strategicBonusWeight = getStrategicBonusWeight()

  while (remaining.length > 0) {
    let best: { idx: number; roi: number; timeSaved: number; timeForThis: number } | null = null

    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i]
      const calc = calculateForCharacter(p, config, currentCount90)
      const timeForThis = calc.timeHours

      let timeSaved = 0
      if (p.nivel < 90) {
        const newCount90 = currentCount90 + 1
        const newBuff = Math.min(newCount90 * 5, 25)
        const oldBuff = Math.min(currentCount90 * 5, 25)
        const buffDelta = (newBuff - oldBuff) / 100

        for (const other of remaining) {
          if (other.nombre === p.nombre) continue
          if (other.nivel >= 80 && other.nivel < 90) {
            const oldCalc = calculateForCharacter(other, config, currentCount90)
            const oldXpPerDungeon = oldCalc.xpPerDungeon
            const newXpPerDungeon = oldXpPerDungeon * (1 + buffDelta)
            const oldXpRemaining = oldCalc.xpRemaining
            const oldDungeons = getDungeonsNeeded(oldXpRemaining, oldXpPerDungeon)
            const newDungeons = getDungeonsNeeded(oldXpRemaining, newXpPerDungeon)
            const savedDungeons = oldDungeons - newDungeons
            timeSaved += getTimeHours(savedDungeons, config.duracionDungeon)
          }
        }
      }

      const strategicScore = calculateStrategicValue(p, config, personajes, currentCount90).totalScore
      const strategicBonus = strategicScore * strategicBonusWeight

      const roi = timeSaved - timeForThis + strategicBonus

      if (!best || roi > best.roi || (roi === best.roi && timeForThis < best.timeForThis)) {
        best = { idx: i, roi, timeSaved, timeForThis }
      }
    }

    if (!best) break

    const chosen = remaining[best.idx]
    const calc = calculateForCharacter(chosen, config, currentCount90)
    const objetivo = getObjetivoFromTareas(chosen.tareas)

    const willReachObjetivo = chosen.nivel < objetivo
    const buffBefore = Math.min(currentCount90 * 5, 25)
    const buffAfter = willReachObjetivo && objetivo >= 90 ? Math.min((currentCount90 + 1) * 5, 25) : buffBefore

    let reason: string
    if (willReachObjetivo && objetivo >= 90 && best.timeSaved > 0) {
      reason = `Llevar a ${objetivo} ahorra ${best.timeSaved.toFixed(1)}h al resto (ROI neto: ${best.roi > 0 ? '+' : ''}${best.roi.toFixed(1)}h)`
    } else if (willReachObjetivo && objetivo >= 90) {
      reason = `Desbloquea Warband Mentor 80-90 (+5% para toda la cuenta)`
    } else if (willReachObjetivo) {
      reason = `Subir a ${objetivo} para tareas del personaje`
    } else {
      reason = `Sin impacto en warband, completar cuando sea conveniente`
    }

    order.push({
      nombre: chosen.nombre,
      clase: chosen.clase,
      nivel: chosen.nivel,
      objetivoNivel: objetivo,
      orden: order.length + 1,
      dungeonsTo90: calc.dungeons,
      timeTo90: calc.timeHours,
      dungeonsToObjective: calc.dungeons,
      timeToObjective: calc.timeHours,
      buffBefore,
      buffAfter,
      timeSavedForOthers: best.timeSaved,
      roi: best.roi,
      reason,
    })

    optimizedTime += calc.timeHours

    if (willReachObjetivo && objetivo >= 90) {
      currentCount90 += 1
    }

    remaining.splice(best.idx, 1)
  }

  const timeSaved = Math.max(0, baselineTime - recomputeOptimizedTime(pending, config, initialCount90, order))

  return {
    entries: order,
    optimizedTime,
    baselineTime,
    timeSaved,
    order: order.map(e => e.nombre),
  }
}

function recomputeOptimizedTime(
  pending: Personaje[],
  config: LevelingConfig,
  initialCount90: number,
  order: OptimizationEntry[],
): number {
  let count90 = initialCount90
  let total = 0
  for (const entry of order) {
    const p = pending.find(pp => pp.nombre === entry.nombre)
    if (!p) continue
    const calc = calculateForCharacter(p, config, count90)
    total += calc.timeHours
    const objetivo = getObjetivoFromTareas(p.tareas)
    if (p.nivel < objetivo && objetivo >= 90) {
      count90 += 1
    }
  }
  return total
}