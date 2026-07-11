import type { Personaje, LevelingConfig, StrategicValueResult, StrategicIndex, ReasonGroup } from '../types'
import { calculateForCharacter, getEffectiveXpPerDungeon, getXpRemaining } from './calculator'
import { STAR_THRESHOLDS, RACE_PROFESSION_BONUS } from '../constants'
import { dataStore } from '../stores/data'

function getObjetivo(p: Personaje): number {
  if (p.tareas && p.tareas.length > 0) {
    const maxNivel = Math.max(0, ...p.tareas.map(t => t.nivelRecomendado ?? 0))
    if (maxNivel > 0) return maxNivel
  }
  return p.objetivoNivel ?? 90
}

function getClassValue(className: string, indexId: string): number {
  return dataStore.getStrategicValue('class', className, indexId) ?? 0
}
function getRaceValue(race: string, indexId: string): number {
  return dataStore.getStrategicValue('race', race, indexId) ?? 0
}
function getProfessionValue(id: string, indexId: string): number {
  return dataStore.getStrategicValue('profession', id, indexId) ?? 0
}
function getComponentWeight(key: string): number {
  return dataStore.getComponentWeight(key)
}
function getEffectiveWeight(key: string, defaultWeight: number): number {
  const override = getComponentWeight(key)
  return override > 0 ? override : defaultWeight
}

function ensureGroup(groups: ReasonGroup[], subtitle: string): ReasonGroup {
  let g = groups.find(g => g.subtitle === subtitle)
  if (!g) {
    g = { subtitle, entries: [] }
    groups.push(g)
  }
  return g
}

export function calculateStrategicValue(
  personaje: Personaje,
  config: LevelingConfig,
  roster: Personaje[],
  count90: number,
  taskContext?: string,
): StrategicValueResult {
  const objetivo = getObjetivo(personaje)
  const calc = calculateForCharacter({ ...personaje, objetivoNivel: objetivo }, config, count90)
  const reasonGroups: ReasonGroup[] = []

  if (calc.done) {
    ensureGroup(reasonGroups, 'Objetivo').entries.push(`Nivel ${objetivo} alcanzado — ya no suma por leveling`)
  }

  const pendingRoster = roster.filter(p => p.planeado_usar && p.nivel < 90)
  const remainingCount = pendingRoster.length

  const beneficiaries8089 = roster.filter(
    p => p.planeado_usar && p.nivel >= 80 && p.nivel < 90 && p.nombre !== personaje.nombre,
  ).length

  let warbandImpact = 0
  if (!calc.done && personaje.nivel < 90) {
    const buffIncrease = 5
    warbandImpact = beneficiaries8089 * buffIncrease
    if (warbandImpact > 0) {
      ensureGroup(reasonGroups, 'Impacto Warband').entries.push(`Llegar a 90 añade +5% XP para ${beneficiaries8089} personaje(s) 80-89 (${warbandImpact}% total)`)
    }
  }

  const profIds = personaje.profesiones?.map(pr => pr.id).filter(Boolean) ?? []

  const indexes: StrategicIndex[] = dataStore.getIndexes()
  const indexValues: Record<string, number> = {}

  for (const idx of indexes) {
    if (taskContext && idx.context && idx.context !== 'general' && idx.context !== taskContext) continue
    if (idx.id === 'general') continue

    const cv = getClassValue(personaje.clase, idx.id)
    const rv = getRaceValue(personaje.raza, idx.id)
    const profVals: { id: string; value: number }[] = []
    for (const pid of profIds) {
      const pv = getProfessionValue(pid, idx.id)
      if (pv > 0) profVals.push({ id: pid, value: pv })
    }
    const tv = dataStore.getStrategicValue('task', '', idx.id) ?? 0
    const wv = dataStore.getStrategicValue('warband', personaje.warband, idx.id) ?? 0
    const pv2 = dataStore.getStrategicValue('personaje', personaje.nombre, idx.id) ?? 0

    let hasNonEntity = false
    if (cv > 0) ensureGroup(reasonGroups, `Clase: ${personaje.clase}`).entries.push(`${idx.name}: +${cv}`)
    if (rv > 0) ensureGroup(reasonGroups, `Raza: ${personaje.raza}`).entries.push(`${idx.name}: +${rv}`)
    for (const pv of profVals) {
      ensureGroup(reasonGroups, 'Profesiones').entries.push(`${pv.id}: +${pv.value} (${idx.name})`)
    }
    if (tv > 0) ensureGroup(reasonGroups, 'Tareas').entries.push(`${idx.name}: +${tv}`)

    if (wv > 0) { ensureGroup(reasonGroups, idx.name).entries.push(`Warband (${personaje.warband}): +${wv}`); hasNonEntity = true }
    if (pv2 > 0) { ensureGroup(reasonGroups, idx.name).entries.push(`Personaje: +${pv2}`); hasNonEntity = true }

    const total = cv + rv + profVals.reduce((s, p) => s + p.value, 0) + tv + wv + pv2
    if (total > 0) indexValues[idx.id] = total
  }

  const classValue = getClassValue(personaje.clase, 'general')
  const raceValue = getRaceValue(personaje.raza, 'general')

  let professionValue = 0
  if (profIds.length > 0) {
    professionValue = profIds.reduce((sum, id) => sum + getProfessionValue(id, 'general'), 0)
    if (professionValue > 0) {
      const profNames = profIds.join(', ')
      ensureGroup(reasonGroups, 'Profesiones').entries.push(`General (${profNames}): +${professionValue}`)
    }
  }

  const proximityToMaxLevel = calc.done ? 0 : (personaje.nivel >= objetivo ? 1 : Math.max(0, (personaje.nivel - 10) / (objetivo - 10)))
  const dungeonsTo90 = calc.dungeons
  const closenessToObjective = calc.done ? 0 : (dungeonsTo90 > 0 ? Math.max(0, 1 - dungeonsTo90 / 200) : 1)

  let futureXpIncrease = 0
  if (!calc.done && personaje.nivel < 90 && beneficiaries8089 > 0) {
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
        ensureGroup(reasonGroups, 'Impacto Warband').entries.push(`Aumentar XP futura +${buffDelta}% para ${beneficiaries8089} personaje(s) — ahorra ~${totalFutureTimeSaved.toFixed(1)}h`)
      }
    }
  }

  const remainingWeight = !calc.done && remainingCount > 0 ? Math.min(1, remainingCount / 10) : 0
  if (!calc.done && remainingCount > 5) {
    ensureGroup(reasonGroups, 'Prioridad').entries.push(`${remainingCount} personajes pendientes — alta prioridad para maximizar beneficio de warband`)
  } else if (!calc.done && remainingCount > 2) {
    ensureGroup(reasonGroups, 'Prioridad').entries.push(`${remainingCount} personajes pendientes — beneficio moderado de warband`)
  }

  if (!calc.done) {
    if (personaje.nivel >= 80 && personaje.nivel < 90) {
      ensureGroup(reasonGroups, 'Impacto Warband').entries.push(`Nivel ${personaje.nivel}: cercano a 90, barato para desbloquear Warband Mentor 80-90`)
    } else if (personaje.nivel < 80 && objetivo >= 90) {
      ensureGroup(reasonGroups, 'Impacto Warband').entries.push(`Objetivo ${objetivo}: al completarlo, desbloquea +5% Warband Mentor para toda la cuenta`)
    } else if (dungeonsTo90 <= 20) {
      ensureGroup(reasonGroups, 'Impacto Warband').entries.push(`Solo ${dungeonsTo90} dungeons para llegar a ${objetivo} (victoria rápida)`)
    }
  }

  const bonusSub90 = !calc.done && personaje.nivel < 90 ? 1 : 0
  const bonus8089 = !calc.done && (personaje.nivel >= 80 && personaje.nivel < 90) ? 1 : 0

  if (classValue > 0) {
    ensureGroup(reasonGroups, `Clase: ${personaje.clase}`).entries.push(`General: +${classValue}`)
  }
  if (raceValue > 0) {
    ensureGroup(reasonGroups, `Raza: ${personaje.raza}`).entries.push(`General: +${raceValue}`)
  }

  const taskValue = (personaje.tareas ?? []).reduce((sum, t) => sum + (t.puntos ?? 0), 0)
  if (taskValue > 0) {
    ensureGroup(reasonGroups, 'Tareas').entries.push(`General: +${taskValue}`)
  }

  let raceProfBonus = 0
  const raceBonuses = RACE_PROFESSION_BONUS[personaje.raza] ?? []
  for (const bonus of raceBonuses) {
    if (bonus.profId === '*') {
      raceProfBonus += bonus.bonus * profIds.length
      if (profIds.length > 0) {
        ensureGroup(reasonGroups, `Raza: ${personaje.raza}`).entries.push(`Bono racial (${profIds.length} profesiones): +${bonus.bonus * profIds.length}`)
      }
    } else if (profIds.includes(bonus.profId)) {
      raceProfBonus += bonus.bonus
      ensureGroup(reasonGroups, `Raza: ${personaje.raza}`).entries.push(`Bono racial (${bonus.profId}${bonus.note ? ' — ' + bonus.note : ''}): +${bonus.bonus}`)
    }
  }

  const wWarband = getEffectiveWeight('warbandImpact', 10)
  const wProfession = getEffectiveWeight('professionValue', 15)
  const wProximityToMaxLevel = getEffectiveWeight('proximityToMaxLevel', 25)
  const wClosenessObj = getEffectiveWeight('closenessToObjective', 25)
  const wFutureXp = getEffectiveWeight('futureXpIncrease', 8)
  const wRemaining = getEffectiveWeight('remainingWeight', 10)
  const wBonusSub90 = getEffectiveWeight('bonusSub90', 10)
  const wBonus8089 = getEffectiveWeight('bonus8089', 15)

  const totalIndexValue = Object.values(indexValues).reduce((a, b) => a + b, 0)

  let totalScore = 0
  totalScore += warbandImpact * wWarband
  totalScore += professionValue * wProfession
  totalScore += proximityToMaxLevel * wProximityToMaxLevel
  totalScore += closenessToObjective * wClosenessObj
  totalScore += futureXpIncrease * wFutureXp
  totalScore += remainingWeight * wRemaining
  totalScore += bonusSub90 * wBonusSub90
  totalScore += bonus8089 * wBonus8089
  totalScore += raceProfBonus
  totalScore += taskValue
  totalScore += classValue
  totalScore += raceValue
  totalScore += totalIndexValue
  totalScore = Math.min(100, totalScore)

  let stars = 1
  for (const t of STAR_THRESHOLDS) {
    if (totalScore >= t.min) { stars = t.stars; break }
  }

  const reasons = reasonGroups.flatMap(g => g.entries)

  if (reasons.length === 0) {
    ensureGroup(reasonGroups, 'General').entries.push(`${dungeonsTo90} dungeons restantes para llegar a ${objetivo}`)
  }

  const intrinsicScore =
    proximityToMaxLevel * wProximityToMaxLevel
    + closenessToObjective * wClosenessObj
    + professionValue * wProfession
    + bonusSub90 * wBonusSub90
    + bonus8089 * wBonus8089
    + raceProfBonus
    + taskValue
    + classValue
    + raceValue
    + totalIndexValue

  const accountImpactScore =
    warbandImpact * wWarband
    + futureXpIncrease * wFutureXp
    + remainingWeight * wRemaining

  return {
    stars,
    warbandImpact,
    professionValue,
    proximityToMaxLevel,
    closenessToObjective,
    futureXpIncrease,
    remainingWeight,
    bonusSub90,
    bonus8089,
    classValue,
    raceValue,
    raceProfBonus,
    taskValue,
    indexValues,
    totalScore,
    intrinsicScore,
    accountImpactScore,
    reasons,
    reasonGroups,
  }
}

export function getWarbandMentorContribution(personaje: Personaje, roster: Personaje[]): number {
  if (personaje.nivel >= 90) return 0
  const beneficiaries = roster.filter(
    p => p.planeado_usar && p.nivel >= 80 && p.nivel < 90 && p.nombre !== personaje.nombre,
  ).length
  return beneficiaries * 5
}
