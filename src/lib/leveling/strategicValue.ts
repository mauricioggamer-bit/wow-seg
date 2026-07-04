import type { Personaje, LevelingConfig, StrategicValueResult } from '../types'
import { calculateForCharacter, getEffectiveXpPerDungeon, getXpRemaining } from './calculator'

export function calculateStrategicValue(
  personaje: Personaje,
  config: LevelingConfig,
  roster: Personaje[],
  count90: number,
): StrategicValueResult {
  const calc = calculateForCharacter(personaje, config, count90)
  const reasons: string[] = []

  if (calc.done) {
    return {
      stars: 0,
      warbandImpact: 0,
      professionValue: 0,
      closenessTo90: 0,
      closenessToObjective: 0,
      futureXpIncrease: 0,
      remainingWeight: 0,
      totalScore: 0,
      reasons: ['Nivel 90 alcanzado'],
    }
  }

  const pendingRoster = roster.filter(p => p.planeado_usar && p.nivel < 90)
  const remainingCount = pendingRoster.length

  const beneficiaries8089 = roster.filter(
    p => p.planeado_usar && p.nivel >= 80 && p.nivel < 90 && p.nombre !== personaje.nombre,
  ).length

  let warbandImpact = 0
  if (personaje.nivel < 90) {
    const buffIncrease = 5
    warbandImpact = beneficiaries8089 * buffIncrease
    if (warbandImpact > 0) {
      reasons.push(`Llegar a 90 añade +5% XP para ${beneficiaries8089} personaje(s) 80-89 (${warbandImpact}% total)`)
    }
  }

  const hasProfessions = (personaje.profesiones?.some(pr => pr.id) ?? false)
  let professionValue = 0
  if (hasProfessions) {
    professionValue = 1
    const profNames = personaje.profesiones?.map(pr => pr.id).join(', ') ?? ''
    reasons.push(`Tiene profesiones: ${profNames}`)
  }

  const closenessTo90 = personaje.nivel >= 90 ? 1 : Math.max(0, (personaje.nivel - 10) / 80)
  const dungeonsTo90 = calc.dungeons
  const closenessToObjective = dungeonsTo90 > 0 ? Math.max(0, 1 - dungeonsTo90 / 200) : 1

  let futureXpIncrease = 0
  if (personaje.nivel < 90 && beneficiaries8089 > 0) {
    const currentBuff = Math.min(count90 * 5, 25)
    const futureBuff = Math.min((count90 + 1) * 5, 25)
    const buffDelta = futureBuff - currentBuff
    if (buffDelta > 0) {
      let totalFutureTimeSaved = 0
      for (const other of pendingRoster) {
        if (other.nombre === personaje.nombre) continue
        if (other.nivel >= 80 && other.nivel < 90) {
          const oldXpPerDungeon = getEffectiveXpPerDungeon(config, other.nivel, count90, other.timewaysPct ?? 0)
          const newXpPerDungeon = oldXpPerDungeon * (1 + buffDelta / 100)
          const xpRem = getXpRemaining(other.nivel, 90)
          const oldDungeons = Math.ceil(xpRem / oldXpPerDungeon)
          const newDungeons = Math.ceil(xpRem / newXpPerDungeon)
          const savedDungeons = oldDungeons - newDungeons
          totalFutureTimeSaved += (savedDungeons * config.duracionDungeon) / 60
        }
      }
      futureXpIncrease = buffDelta
      if (totalFutureTimeSaved > 0) {
        reasons.push(`Aumentar XP futura +${buffDelta}% para ${beneficiaries8089} personaje(s) — ahorra ~${totalFutureTimeSaved.toFixed(1)}h`)
      }
    }
  }

  const remainingWeight = remainingCount > 0 ? Math.min(1, remainingCount / 10) : 0
  if (remainingCount > 5) {
    reasons.push(`${remainingCount} personajes pendientes — alta prioridad para maximizar beneficio de warband`)
  } else if (remainingCount > 2) {
    reasons.push(`${remainingCount} personajes pendientes — beneficio moderado de warband`)
  }

  if (personaje.nivel >= 80 && personaje.nivel < 90) {
    reasons.push(`Nivel ${personaje.nivel}: cercano a 90, barato para desbloquear Warband Mentor 80-90`)
  } else if (personaje.nivel < 80) {
    reasons.push(`Objetivo 90: al completarlo, desbloquea +5% Warband Mentor para toda la cuenta`)
  } else if (dungeonsTo90 <= 20) {
    reasons.push(`Solo ${dungeonsTo90} dungeons para llegar a 90 (victoria rápida)`)
  }

  let totalScore = 0
  totalScore += warbandImpact * 10
  totalScore += professionValue * 15
  totalScore += closenessTo90 * 25
  totalScore += closenessToObjective * 25
  totalScore += futureXpIncrease * 8
  totalScore += remainingWeight * 10
  if (personaje.nivel < 90) totalScore += 10
  if (personaje.nivel >= 80 && personaje.nivel < 90) totalScore += 15
  totalScore = Math.min(100, totalScore)

  let stars = 1
  if (totalScore >= 85) stars = 5
  else if (totalScore >= 65) stars = 4
  else if (totalScore >= 45) stars = 3
  else if (totalScore >= 25) stars = 2

  if (reasons.length === 0) {
    reasons.push(`${dungeonsTo90} dungeons restantes para llegar a 90`)
  }

  return {
    stars,
    warbandImpact,
    professionValue,
    closenessTo90,
    closenessToObjective,
    futureXpIncrease,
    remainingWeight,
    totalScore,
    reasons,
  }
}

export function getWarbandMentorContribution(personaje: Personaje, roster: Personaje[]): number {
  if (personaje.nivel >= 90) return 0
  const beneficiaries = roster.filter(
    p => p.planeado_usar && p.nivel >= 80 && p.nivel < 90 && p.nombre !== personaje.nombre,
  ).length
  return beneficiaries * 5
}