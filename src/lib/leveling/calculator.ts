import { XP_CURVE } from '../constants/experience'
import type { LevelingConfig, Personaje, LevelBreakdownEntry } from '../types'

export function getXpRemaining(nivel: number, objetivo: number): number {
  if (nivel >= objetivo) return 0
  let total = 0
  for (let l = nivel + 1; l <= objetivo; l++) {
    total += XP_CURVE[l] ?? 0
  }
  return total
}

export function getRewardBuffPct(config: LevelingConfig, nivel: number): number {
  let pct = 0
  pct += config.knowledgeOfTimeways
  if (nivel < 80) pct += config.warbandMentor080
  pct += getWarbandMentor8090Bonus(nivel, config)
  if (config.warMode && (config.warModeTarget === 'reward' || config.warModeTarget === 'both')) {
    pct += 15
  }
  for (const buff of config.customBuffs) {
    if (buff.target === 'reward' || buff.target === 'both') pct += buff.percentage
  }
  return pct / 100
}

export function getMonsterBuffPct(config: LevelingConfig, nivel: number): number {
  let pct = 0
  pct += config.knowledgeOfTimeways
  if (nivel < 80) pct += config.warbandMentor080
  pct += getWarbandMentor8090Bonus(nivel, config)
  if (config.warMode && (config.warModeTarget === 'monsters' || config.warModeTarget === 'both')) {
    pct += 15
  }
  for (const buff of config.customBuffs) {
    if (buff.target === 'monsters' || buff.target === 'both') pct += buff.percentage
  }
  return pct / 100
}

export function getWarbandMentor8090Bonus(nivel: number, _config: LevelingConfig, count90?: number): number {
  if (nivel < 80 || nivel >= 90) return 0
  const count = count90 ?? 0
  return Math.min(count * 5, 25)
}

export function getWarbandMentor8090FromRoster(personajes: Personaje[]): number {
  const count90 = personajes.filter(p => p.planeado_usar && p.nivel >= 90).length
  return Math.min(count90 * 5, 25)
}

export function getEffectiveXpPerDungeon(config: LevelingConfig, nivel: number, count90?: number): number {
  const rewardMult = 1 + getRewardBuffPct({ ...config }, nivel)
  const monsterMult = 1 + getMonsterBuffPct({ ...config }, nivel)
  const xpReward = config.xpRecompensa * rewardMult
  const xpMobs = config.xpMonstruos * monsterMult
  return Math.round(xpReward + xpMobs)
}

export function getDungeonsNeeded(xpRemaining: number, xpPerDungeon: number): number {
  if (xpPerDungeon <= 0) return 0
  return Math.ceil(xpRemaining / xpPerDungeon)
}

export function getTimeHours(dungeons: number, duracionDungeon: number): number {
  return (dungeons * duracionDungeon) / 60
}

export function getXpPerHour(xpPerDungeon: number, duracionDungeon: number): number {
  if (duracionDungeon <= 0) return 0
  return Math.round(xpPerDungeon * (60 / duracionDungeon))
}

export interface CalcResult {
  xpRemaining: number
  xpPerDungeon: number
  dungeons: number
  timeHours: number
  xpPerHour: number
  done: boolean
}

export function calculateForCharacter(
  personaje: Personaje,
  config: LevelingConfig,
  count90: number,
): CalcResult {
  const objetivo = personaje.objetivoNivel ?? 80
  const nivel = personaje.nivel
  const xpRemaining = getXpRemaining(nivel, objetivo)
  const xpPerDungeon = getEffectiveXpPerDungeon(config, nivel, count90)
  const dungeons = getDungeonsNeeded(xpRemaining, xpPerDungeon)
  const timeHours = getTimeHours(dungeons, config.duracionDungeon)
  const xpPerHour = getXpPerHour(xpPerDungeon, config.duracionDungeon)
  return {
    xpRemaining,
    xpPerDungeon,
    dungeons,
    timeHours,
    xpPerHour,
    done: nivel >= objetivo,
  }
}

export function getTotalXpRemaining(personajes: Personaje[], config: LevelingConfig, count90: number): number {
  return personajes
    .filter(p => p.planeado_usar)
    .reduce((sum, p) => sum + calculateForCharacter(p, config, count90).xpRemaining, 0)
}

export function getTotalDungeons(personajes: Personaje[], config: LevelingConfig, count90: number): number {
  return personajes
    .filter(p => p.planeado_usar)
    .reduce((sum, p) => sum + calculateForCharacter(p, config, count90).dungeons, 0)
}

export function getTotalTimeHours(personajes: Personaje[], config: LevelingConfig, count90: number): number {
  return personajes
    .filter(p => p.planeado_usar)
    .reduce((sum, p) => sum + calculateForCharacter(p, config, count90).timeHours, 0)
}

export function getLevelBreakdown(
  personaje: Personaje,
  config: LevelingConfig,
  count90: number,
): LevelBreakdownEntry[] {
  const objetivo = personaje.objetivoNivel ?? 80
  const nivel = personaje.nivel
  if (nivel >= objetivo) return []
  const entries: LevelBreakdownEntry[] = []
  let cumDungeons = 0
  let cumTime = 0
  for (let l = nivel + 1; l <= objetivo; l++) {
    const xpNeeded = XP_CURVE[l] ?? 0
    const xpPerDungeon = getEffectiveXpPerDungeon(config, l - 1, count90)
    const dungeons = getDungeonsNeeded(xpNeeded, xpPerDungeon)
    cumDungeons += dungeons
    cumTime += getTimeHours(dungeons, config.duracionDungeon)
    entries.push({
      level: l,
      xpNeeded,
      xpPerDungeon,
      dungeons,
      cumulativeDungeons: cumDungeons,
      cumulativeTime: cumTime,
    })
  }
  return entries
}

export function formatNumber(n: number): string {
  return n.toLocaleString('es-ES')
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`
  if (hours < 10) return `${hours.toFixed(1)}h`
  return `${Math.round(hours)}h`
}