import type { TipoContenido } from './constants/wowContent'
import type { OpieRing } from './opie/types'

export interface Tarea {
  id: string
  nombre: string
  personaje?: string
  esPrincipal: boolean
  tipoContenido?: TipoContenido
  contenidoExpansion?: string
  contenidoDificultad?: string
  tipo: 'weekly' | 'daily' | 'farm_libre' | 'mision' | 'achievement'
  cooldown: 'weekly' | 'daily' | 'none'
  tiempo_min: number
  prioridad: 1 | 2 | 3
  recompensa: string
  hecho: boolean
  ultimo_completado: string | null
  expansion?: string
  nivelRecomendado?: number
  tags?: string[]
  orden?: number
  puntos?: number
}

export interface ProfesionSlot {
  id: string
  completadas: string[]
  esMainCrafter?: boolean
  rol?: 'main' | 'cd'
  motivo?: string
}

export interface Personaje {
  nombre: string
  clase: string
  nivel: number
  faccion: 'Horda' | 'Alianza'
  raza: string
  reino: string
  warband: string
  motivoWarband?: string
  expansion_por_defecto?: string | null
  parecidos?: string[]
  profesiones?: ProfesionSlot[]
  planeado_usar: boolean
  descripcion?: string
  objetivoNivel?: number
  timewaysPct?: number
  tareas: Tarea[]
}

export interface Warband {
  nombre: string
  personajes: string[]
  orden?: number
  objetivoNivel?: number
}

export interface Meta {
  version: string
  descripcion: string
  reset_weekly_dia: string
  ultimo_reset_semanal: string | null
  total_personajes: number
  total_activos: number
  schema_version?: number
}

export interface StrategicCategory {
  id: string
  label: string
  orden?: number
  entityType?: EntityType
}

export type EntityType = 'class' | 'race' | 'profession' | 'task' | 'warband' | 'personaje'

export interface StrategicIndex {
  id: string
  name: string
  description: string
  context?: string
  entityTypes?: EntityType[]
}

export interface WowData {
  _meta: Meta
  personajes: Personaje[]
  warbands: Warband[]
  keybinds?: Record<string, string>
  uiPrefs?: Record<string, boolean>
  profesionOrden?: string[]
  strategicConfig?: {
    indexes?: StrategicIndex[]
    categories?: StrategicCategory[]
    values?: Record<string, number>
    componentWeights?: Record<string, number>
    params?: Record<string, number>
    expansionLevels?: Record<string, number>
  }
  levelingConfig?: LevelingConfig
  xpOverrides?: Record<number, number>
  dungeonXpOverrides?: Record<number, number>
  opieRings?: OpieRing[]
}

export interface Stats {
  total: number
  activos: number
  warbands: number
  weeklyTotal: number
  weeklyDone: number
  weeklyPct: number
  dailyTotal: number
  dailyDone: number
}

export type ViewType = 'warband' | 'tareas' | 'tasks' | 'personajes' | 'mapa' | 'fantasia' | 'profesion' | 'keybinds' | 'leveling' | 'warband-manager' | 'estrategia' | 'opie'
export type ThemeType = 'dark' | 'light'
export type FontSizeType = 'small' | 'medium' | 'large' | 'xlarge'
export type AuthDuration = '10min' | '1hora' | '8horas' | '1semana' | 'siempre'

export interface GistConfig {
  enabled: boolean
  gistId: string
  fileName: string
  intervalMinutes: number
  rememberToken: boolean
}

export interface CustomBuff {
  id: string
  name: string
  percentage: number
  target: 'monsters' | 'reward' | 'both'
}

export type PatronSemanal = {
  lunes: number
  martes: number
  miercoles: number
  jueves: number
  viernes: number
  sabado: number
  domingo: number
}

export interface LevelingConfig {
  xpMonstruos: number
  duracionDungeon: number
  warbandMentor080: number
  warMode: boolean
  warModeTarget: 'monsters' | 'reward' | 'both'
  customBuffs: CustomBuff[]
  patronSemanal?: PatronSemanal
  objetivoSinTareas: number
}

export interface LevelingResult {
  nombre: string
  clase: string
  nivel: number
  maxTareaNivel?: number
  objetivo: number
  xpTo80: number
  dungeonsTo80: number
  timeTo80: number
  xpTo90: number
  dungeonsTo90: number
  timeTo90: number
  xpPerHour: number
  done80: boolean
  done90: boolean
  doneObjetivo: boolean
  strategicStars: number
  strategicText: string
  strategicScore: number
  warbandImpact: number
}

export interface LevelBreakdownEntry {
  level: number
  xpNeeded: number
  xpPerDungeon: number
  dungeons: number
  cumulativeDungeons: number
  cumulativeTime: number
}

export interface ReasonGroup {
  subtitle: string
  entries: string[]
  subGroups?: ReasonGroup[]
}

export interface StrategicValueResult {
  stars: number
  warbandImpact: number
  profesionesCompletasValor: number
  proximityToMaxLevel: number
  closenessToObjective: number
  futureXpIncrease: number
  bonusSub90: number
  bonus8089: number
  classValue: number
  raceValue: number
  raceProfBonus: number
  taskValue: number
  indexValues: Record<string, number>
  objetivo: number
  totalScore: number
  rawTotalScore: number
  maxPosible: number
  intrinsicScore: number
  accountImpactScore: number
  reasons: string[]
  reasonGroups: ReasonGroup[]
}

export interface TimeRecommendation {
  option: string
  description: string
  timeUsed: number
  benefit: number
  charactersInvolved: { nombre: string; nivelFinal: number; dungeons: number }[]
}

export interface XpOverride {
  level: number
  xp: number
}

export interface OptimizationEntry {
  nombre: string
  clase: string
  nivel: number
  objetivoNivel: number
  orden: number
  dungeonsTo90: number
  timeTo90: number
  dungeonsToObjective: number
  timeToObjective: number
  buffBefore: number
  buffAfter: number
  timeSavedForOthers: number
  roi: number
  reason: string
}

export interface OptimizationPlan {
  entries: OptimizationEntry[]
  optimizedTime: number
  baselineTime: number
  timeSaved: number
  order: string[]
}

export interface SimulationStep {
  nombre: string
  clase: string
  nivelInicial: number
  nivelFinal: number
  dungeonsUsed: number
  timeUsed: number
  completed: boolean
  reached90: boolean
}

export interface SimulationResult {
  steps: SimulationStep[]
  totalDungeonsUsed: number
  totalTimeUsed: number
  charactersCompleted: number
  count90Reached: number
  remainingTime: number
  remainingDungeons: number
}

export interface BackupData {
  _export: {
    version: number
    exported_at: string
    app_name: string
    data: WowData
    preferences: {
      theme: string
      fontsize: string
    }
    gist: {
      config: GistConfig
      hash: string
    } | null
    reset_last: string | null
  }
}

export type ExportSection =
  | 'personajes'
  | 'nombres_fantasia'
  | 'profesiones'
  | 'tareas'
  | 'warbands'
  | 'keybinds'
  | 'config_leveling'
  | 'opie_rings'

export interface ExportPayload {
  _exportType: 'wowseg_export'
  version: number
  exportedAt: string
  sections: ExportSection[]
  data: Partial<WowData>
}
