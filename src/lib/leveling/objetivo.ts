import type { Tarea } from '../types'

export function getObjetivoFromTareas(tareas: Tarea[]): number {
  const maxNivel = Math.max(0, ...tareas.map(t => t.nivelRecomendado ?? 0))
  return maxNivel > 0 ? maxNivel : 90
}
