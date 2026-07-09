import type { Personaje, LevelingConfig, StrategicValueResult } from '../types'
import { calculateForCharacter, getEffectiveXpPerDungeon, getXpRemaining } from './calculator'
import { CLASS_STRATEGIC_VALUE, RACE_STRATEGIC_VALUE, PROFESSION_STRATEGIC_VALUE, STAR_THRESHOLDS } from '../constants'
import { dataStore } from '../stores/data'

function getClassValue(className: string): number {
  return dataStore.getStrategicClassValue(className) ?? CLASS_STRATEGIC_VALUE[className] ?? 0
}
function getRaceValue(race: string): number {
  return dataStore.getStrategicRaceValue(race) ?? RACE_STRATEGIC_VALUE[race] ?? 0
}
function getProfessionValue(id: string): number {
  return dataStore.getStrategicProfessionValue(id) ?? PROFESSION_STRATEGIC_VALUE[id] ?? 0
}
function getComponentWeight(key: string): number {
  return dataStore.getStrategicComponentWeight(key) ?? 0
}
function getEffectiveWeight(key: string, defaultWeight: number): number {
  const override = getComponentWeight(key)
  return override > 0 ? override : defaultWeight
}

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
      bonusSub90: 0,
      bonus8089: 0,
      classValue: 0,
      raceValue: 0,
    tagsValue: 0,
    taskValue: 0,
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

  const profIds = personaje.profesiones?.map(pr => pr.id).filter(Boolean) ?? []
  let professionValue = 0
  if (profIds.length > 0) {
    professionValue = profIds.reduce((sum, id) => sum + getProfessionValue(id), 0)
    const profNames = profIds.join(', ')
    reasons.push(`Profesiones (${profNames}): +${professionValue} pts`)
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

  const bonusSub90 = personaje.nivel < 90 ? 1 : 0
  const bonus8089 = (personaje.nivel >= 80 && personaje.nivel < 90) ? 1 : 0

  const classValue = getClassValue(personaje.clase)
  if (classValue > 0) {
    reasons.push(`Clase ${personaje.clase}: +${classValue} pts`)
  }

  const raceValue = getRaceValue(personaje.raza)
  if (raceValue > 0) {
    reasons.push(`Raza ${personaje.raza}: +${raceValue} pts`)
  }

  const tagsValue = (personaje.tagsEstrategicos ?? []).reduce((sum, t) => sum + t.puntos, 0)

  const taskValue = (personaje.tareas ?? []).reduce((sum, t) => sum + (t.puntos ?? 0), 0)
  if (taskValue > 0) {
    reasons.push(`Tareas: +${taskValue} pts`)
  }
  for (const tag of (personaje.tagsEstrategicos ?? [])) {
    reasons.push(`Tag "${tag.texto}": +${tag.puntos} pts`)
  }

  const wWarband = getEffectiveWeight('warbandImpact', 10)
  const wProfession = getEffectiveWeight('professionValue', 15)
  const wCloseness90 = getEffectiveWeight('closenessTo90', 25)
  const wClosenessObj = getEffectiveWeight('closenessToObjective', 25)
  const wFutureXp = getEffectiveWeight('futureXpIncrease', 8)
  const wRemaining = getEffectiveWeight('remainingWeight', 10)
  const wBonusSub90 = getEffectiveWeight('bonusSub90', 10)
  const wBonus8089 = getEffectiveWeight('bonus8089', 15)

  let totalScore = 0
  totalScore += warbandImpact * wWarband
  totalScore += professionValue * wProfession
  totalScore += closenessTo90 * wCloseness90
  totalScore += closenessToObjective * wClosenessObj
  totalScore += futureXpIncrease * wFutureXp
  totalScore += remainingWeight * wRemaining
  totalScore += bonusSub90 * wBonusSub90
  totalScore += bonus8089 * wBonus8089
  totalScore += classValue
  totalScore += raceValue
  totalScore += tagsValue
  totalScore += taskValue
  totalScore = Math.min(100, totalScore)

  let stars = 1
  for (const t of STAR_THRESHOLDS) {
    if (totalScore >= t.min) { stars = t.stars; break }
  }

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
    bonusSub90,
    bonus8089,
    classValue,
    raceValue,
    tagsValue,
    taskValue,
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