import type { TipoContenido } from './constants/wowContent'

export interface Tarea {
  id: string
  nombre: string
  tipoContenido?: TipoContenido
  contenidoExpansion?: string
  contenidoDificultad?: string
  tipo: 'weekly' | 'daily' | 'farm_libre'
  cooldown: 'weekly' | 'daily' | 'none'
  tiempo_min: number
  prioridad: 1 | 2 | 3
  recompensa: string
  hecho: boolean
  ultimo_completado: string | null
  expansion?: string
  tags?: string[]
  orden?: number
}

export interface ProfesionSlot {
  id: string
  nivel: number
  esMainCrafter?: boolean
}

export interface TagEstrategico {
  id: string
  texto: string
  puntos: number
}

export interface Personaje {
  nombre: string
  clase: string
  nivel: number
  faccion: 'Horda' | 'Alianza'
  raza: string
  reino: string
  warband: string
  mision_principal: string | null
  expansion_por_defecto?: string | null
  parecidos?: string[]
  profesiones?: ProfesionSlot[]
  planeado_usar: boolean
  descripcion?: string
  tipo?: 'iconico' | 'funcional'
  objetivoNivel?: number
  timewaysPct?: number
  tagsEstrategicos?: TagEstrategico[]
  tareas: Tarea[]
}

export interface WarbandTareaDisponible {
  id: string
  nombre: string
  tipo: string
  cooldown: string
  tiempo_min: number
  prioridad: number
  recompensa: string
}

export interface Warband {
  nombre: string
  personajes: string[]
  tareas_disponibles: WarbandTareaDisponible[]
}

export interface Mision {
  id: string
  nombre: string
  personaje: string
  tipo: string
  estado: 'pendiente' | 'completada'
  prioridad: number
  tiempo_min: number
  creada: string
  expansion?: string
  tags?: string[]
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

export interface WowData {
  _meta: Meta
  personajes: Personaje[]
  warbands: Warband[]
  misiones: Mision[]
  keybinds?: Record<string, string>
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

export type ViewType = 'warband' | 'tareas' | 'tabla' | 'priority' | 'time' | 'personajes' | 'mapa' | 'fantasia' | 'profesion' | 'keybinds' | 'leveling'
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
}

export interface LevelingResult {
  nombre: string
  clase: string
  nivel: number
  xpTo80: number
  dungeonsTo80: number
  timeTo80: number
  xpTo90: number
  dungeonsTo90: number
  timeTo90: number
  xpPerHour: number
  done80: boolean
  done90: boolean
  roi: number
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

export interface StrategicValueResult {
  stars: number
  warbandImpact: number
  professionValue: number
  closenessTo90: number
  closenessToObjective: number
  futureXpIncrease: number
  remainingWeight: number
  bonusSub90: number
  bonus8089: number
  classValue: number
  raceValue: number
  tagsValue: number
  totalScore: number
  reasons: string[]
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
