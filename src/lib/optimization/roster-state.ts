import type { Personaje } from '../types'
import { getWarbandMentor8090Pct } from '../leveling/calculator'

export interface RosterState {
  count90: number
  warbandMentorBuff: number
  horasConsumidas: number
  horasDisponiblesSemana: number
  fechaActual: Date
  fechaLimiteEvento: Date
  diasRestantesEvento: number
}

const DEFAULT_FECHA_LIMITE = new Date('2026-08-11T00:00:00Z')

export function computeRosterState(
  personajes: Personaje[],
  horasConsumidas: number,
  horasDisponiblesSemana: number,
  fechaActual?: Date,
  fechaLimiteEvento?: Date,
): RosterState {
  const count90 = personajes.filter(p => p.planeado_usar && p.nivel >= 90).length
  const warbandMentorBuff = getWarbandMentor8090Pct(count90)
  const now = fechaActual ?? new Date()
  const deadline = fechaLimiteEvento ?? DEFAULT_FECHA_LIMITE
  const diffMs = deadline.getTime() - now.getTime()
  const diasRestantesEvento = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  return {
    count90,
    warbandMentorBuff,
    horasConsumidas,
    horasDisponiblesSemana,
    fechaActual: now,
    fechaLimiteEvento: deadline,
    diasRestantesEvento,
  }
}
