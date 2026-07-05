import type { Personaje, LevelingConfig } from '../types'
import type { SimulationOutcome } from './objective-function'
import type { Strategy, Decision } from './strategy'
import { computeRosterState } from './roster-state'
import { computeFutureTimeSaved } from './future-time-saved'
import { getEffectiveXpPerDungeon } from '../leveling/calculator'
import { getXpForLevel } from '../constants/experience'
import { PROFESIONES } from '../constants/profesiones'
import { tieneMainCrafter } from './professions'

export type PatronSemanal = {
  lunes: number
  martes: number
  miercoles: number
  jueves: number
  viernes: number
  sabado: number
  domingo: number
}

export interface TemporalSimulationResult {
  dias: SimulationDay[]
  outcome: SimulationOutcome
}

export interface SimulationDay {
  fecha: Date
  horasUsadas: number
  personajeActivo: string | null
  xpGanada: number
  nivelesGanados: Record<string, number>
}

const DAY_HOUR_MAP: Record<number, keyof PatronSemanal> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
}

export function runTemporalSimulation(
  strategy: Strategy,
  roster: Personaje[],
  config: LevelingConfig,
  horasDisponiblesSemana: number,
  fechaInicio: Date,
  fechaLimite: Date,
  throughputEfectivo: number = 1.0,
  patronSemanal?: PatronSemanal,
): TemporalSimulationResult {
  const horasPorDiaDefault = patronSemanal ? undefined : (horasDisponiblesSemana / 7) * throughputEfectivo
  const dias: SimulationDay[] = []
  let xpTotal = 0
  let personajesA90 = 0
  let tiempoTotalHoras = 0

  const charState = new Map<string, { nivel: number; xp: number; done: boolean }>()
  for (const p of roster) {
    charState.set(p.nombre, { nivel: p.nivel, xp: 0, done: false })
  }

  let count90 = roster.filter(p => p.planeado_usar && p.nivel >= 90).length
  const currentDate = new Date(fechaInicio)
  const personajesNombreA90: string[] = []

  while (currentDate < fechaLimite) {
    const day: SimulationDay = {
      fecha: new Date(currentDate),
      horasUsadas: 0,
      personajeActivo: null,
      xpGanada: 0,
      nivelesGanados: {},
    }

    const horasHoy = patronSemanal
      ? patronSemanal[DAY_HOUR_MAP[currentDate.getDay()]] * throughputEfectivo
      : horasPorDiaDefault!
    let remaining = horasHoy
    let targetDecision: Decision | null = null

    for (const dec of strategy.decisiones) {
      if (dec.accion === 'saltear') continue
      const st = charState.get(dec.personaje.nombre)
      if (!st || st.done) continue
      const targetLevel = dec.accion === 'subir-a-90' ? 90 : 80
      if (st.nivel >= targetLevel) {
        st.done = true
        continue
      }
      targetDecision = dec
      break
    }

    if (!targetDecision) break

    const dec = targetDecision
    const st = charState.get(dec.personaje.nombre)!
    const targetLevel = dec.accion === 'subir-a-90' ? 90 : 80
    day.personajeActivo = dec.personaje.nombre
    const timewaysPct = dec.personaje.timewaysPct ?? 0

    while (remaining > 0 && st.nivel < targetLevel) {
      const xpPerDungeon = getEffectiveXpPerDungeon(config, st.nivel, count90, timewaysPct)
      const hoursPerDungeon = config.duracionDungeon / 60
      const xpPerHour = xpPerDungeon / hoursPerDungeon

      const xpNeededForLevel = getXpForLevel(st.nivel + 1) - st.xp
      const hoursToLevel = xpNeededForLevel / xpPerHour

      if (remaining >= hoursToLevel) {
        remaining -= hoursToLevel
        st.xp = 0
        st.nivel++
        xpTotal += xpNeededForLevel
        day.xpGanada += xpNeededForLevel
        day.horasUsadas += hoursToLevel
        day.nivelesGanados[dec.personaje.nombre] = (day.nivelesGanados[dec.personaje.nombre] ?? 0) + 1

        if (st.nivel >= targetLevel) {
          st.done = true
          if (targetLevel === 90 && st.nivel >= 90) {
            count90++
            personajesA90++
            personajesNombreA90.push(dec.personaje.nombre)
          }
          break
        }
      } else {
        const xpGained = remaining * xpPerHour
        st.xp += xpGained
        xpTotal += xpGained
        day.xpGanada += xpGained
        day.horasUsadas += remaining
        remaining = 0
      }
    }

    tiempoTotalHoras += day.horasUsadas
    dias.push(day)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const finalRoster = roster.map(p => {
    const st = charState.get(p.nombre)
    if (!st) return p
    return { ...p, nivel: st.nivel }
  })

  const profesionesCubiertas = new Set(
    PROFESIONES
      .filter(prof => tieneMainCrafter(finalRoster, prof.id))
      .map(prof => prof.id),
  )

  const rosterStateFinal = computeRosterState(
    finalRoster,
    tiempoTotalHoras,
    horasDisponiblesSemana,
    new Date(currentDate),
  )

  let tiempoAhorradoFuturo = 0
  for (const nombre of personajesNombreA90) {
    const personaje = roster.find(p => p.nombre === nombre)
    if (!personaje) continue
    const resto = roster.filter(p => p.nombre !== nombre)
    tiempoAhorradoFuturo += computeFutureTimeSaved(personaje, rosterStateFinal, resto, config)
  }

  return {
    dias,
    outcome: {
      xpTotal,
      personajesA90,
      tiempoTotalHoras,
      profesionesCubiertas,
      rosterStateFinal,
      personajesNombreA90,
      tiempoAhorradoFuturo,
    },
  }
}
