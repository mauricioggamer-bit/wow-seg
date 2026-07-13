import type { Tarea } from '../types'
import { MAX_LEVEL } from '../constants/experience'

export function getObjetivoFromTareas(tareas: Tarea[], maxLevel = MAX_LEVEL, objetivoDefault = maxLevel): number {
  const maxNivel = Math.max(0, ...tareas.map(t => t.nivelRecomendado ?? 0))
  if (maxNivel > 0) return Math.min(maxNivel, maxLevel)
  return objetivoDefault
}
