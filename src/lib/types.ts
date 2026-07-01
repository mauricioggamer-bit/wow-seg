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

export type ViewType = 'warband' | 'tareas' | 'tabla' | 'priority' | 'time' | 'personajes' | 'mapa' | 'fantasia' | 'profesion'
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
