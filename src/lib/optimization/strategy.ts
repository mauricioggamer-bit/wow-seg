import type { Personaje, LevelingConfig, OptimizationEntry } from '../types'
import { getWarbandMentor8090Pct } from '../leveling/calculator'
import { getObjetivoFromTareas } from '../leveling/objetivo'
import { tieneMainCrafter } from './professions'
import { optimize } from '../leveling/optimizer'
import { PROFESIONES } from '../constants/profesiones'

export interface Decision {
  personaje: Personaje
  accion: 'subir-a-90' | 'subir-a-80' | 'saltear'
  ordenPrioridad: number
}

export interface Strategy {
  nombre: string
  decisiones: Decision[]
}

export function generateNaiveStrategies(
  roster: Personaje[],
  config?: LevelingConfig,
): Strategy[] {
  const pending = roster.filter(p => p.planeado_usar && p.nivel < getObjetivoFromTareas(p.tareas, undefined, config?.objetivoSinTareas))
  if (pending.length === 0) return []

  const strategies: Strategy[] = []

  const initialCount90 = roster.filter(p => p.planeado_usar && p.nivel >= 90).length

  const defaultConfig: LevelingConfig = config ?? {
    xpMonstruos: 20000,
    duracionDungeon: 18,
    warbandMentor080: 30,
    warMode: false,
    warModeTarget: 'both',
    customBuffs: [],
    objetivoSinTareas: 90,
  }

  const plan = optimize(roster, defaultConfig, initialCount90)

  const roiDecisions: Decision[] = plan.entries.map((entry: OptimizationEntry, i: number) => {
    const p = roster.find(pp => pp.nombre === entry.nombre)!
    return {
      personaje: p,
      accion: 'subir-a-90' as const,
      ordenPrioridad: i + 1,
    }
  })
  strategies.push({ nombre: 'ROI', decisiones: roiDecisions })

  const sortedByLevel = [...pending].sort((a, b) => b.nivel - a.nivel)
  const levelDecisions: Decision[] = sortedByLevel.map((p, i) => ({
    personaje: p,
    accion: 'subir-a-90' as const,
    ordenPrioridad: i + 1,
  }))
  strategies.push({ nombre: 'Ascendente por nivel', decisiones: levelDecisions })

  const allProfIds = PROFESIONES.map(p => p.id)
  const isMainCrafter = (p: Personaje) => allProfIds.some(id => tieneMainCrafter([p], id))
  const crafters = pending.filter(isMainCrafter).sort((a, b) => b.nivel - a.nivel)
  const nonCrafters = pending.filter(p => !isMainCrafter(p)).sort((a, b) => b.nivel - a.nivel)
  const sortedByProf = [...crafters, ...nonCrafters]
  const profDecisions: Decision[] = sortedByProf.map((p, i) => ({
    personaje: p,
    accion: 'subir-a-90' as const,
    ordenPrioridad: i + 1,
  }))
  strategies.push({ nombre: 'Profesiones', decisiones: profDecisions })

  return strategies
}
