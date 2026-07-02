import type { WowData, Stats, BackupData, ProfesionSlot } from '../types'
import { SEED_DATA } from './seed'
import { checkWeeklyReset } from './weekly-reset'
import { PROFESIONES } from '../constants/profesiones'

const STORAGE_KEY = 'wowseg_data'
const RESET_KEY = 'wowseg_last_reset'

const PROFESION_IDS = new Set(PROFESIONES.map(p => p.id))

function emptyProfesiones(): ProfesionSlot[] {
  return [{ id: '', nivel: 0 }, { id: '', nivel: 0 }]
}

function normalizeProfesiones(raw: any): ProfesionSlot[] {
  const arr: ProfesionSlot[] = []
  if (Array.isArray(raw)) {
    for (let i = 0; i < 2; i++) {
      const slot = raw[i]
      if (slot && typeof slot === 'object') {
        const id = typeof slot.id === 'string' ? (PROFESION_IDS.has(slot.id) ? slot.id : '') : ''
        const nivel = typeof slot.nivel === 'number' && !isNaN(slot.nivel) && slot.nivel >= 0 ? slot.nivel : 0
        arr.push({ id, nivel })
      } else if (typeof slot === 'string' && slot) {
        arr.push({ id: PROFESION_IDS.has(slot) ? slot : '', nivel: 0 })
      } else {
        arr.push({ id: '', nivel: 0 })
      }
    }
  }
  while (arr.length < 2) arr.push({ id: '', nivel: 0 })
  return arr.slice(0, 2)
}

const CHAR_EXPANSION: Record<string, string> = {
  'Fariat': 'midnight', 'Mawgul': 'legion', 'Orna': 'tww', 'Alezethar': 'dragonflight',
  'Fangrim': 'tww', 'Kraiser': 'shadowlands', 'Elbet': 'shadowlands', 'Archondris': 'shadowlands',
  'Unalaq': 'shadowlands', 'Xaigon': 'legion', 'Stormfeng': 'legion', 'Thaelune': 'bfa',
  'Grogor': 'bfa', 'Izadur': 'draenor', 'Onuki': 'draenor', 'Secenio': 'draenor',
  'Pogara': 'draenor', 'Ulnok': 'mop', 'Womak': 'mop', 'Razzlowe': 'mop', 'Zulgeku': 'mop',
  'Dykaios': 'cata', 'Carandor': 'cata', 'Lisarah': 'cata',
  'Nietzlock': 'wotlk', 'Healtonjohn': 'wotlk', 'Wasprepared': 'wotlk', 'Shockandroll': 'wotlk',
}

function propagateExpansion(data: WowData): WowData {
  for (const p of data.personajes) {
    const exp = CHAR_EXPANSION[p.nombre] || ''
    for (const t of p.tareas) {
      if (!t.expansion) t.expansion = exp
      if (!t.tags) t.tags = []
    }
  }
  for (const m of data.misiones) {
    if (!m.expansion) m.expansion = (CHAR_EXPANSION as Record<string, string>)[m.id] || ''
    if (!m.tags) m.tags = []
  }
  return data
}

export function initSeed(): WowData {
  const data = JSON.parse(JSON.stringify(SEED_DATA)) as WowData
  data._meta.schema_version = 3
  propagateExpansion(data)
  return data
}

const VALID_PERSONAJE_KEYS = new Set([
  'nombre', 'clase', 'nivel', 'faccion', 'raza', 'reino', 'warband',
  'mision_principal', 'expansion_por_defecto', 'parecidos', 'profesiones',
  'planeado_usar', 'descripcion', 'tipo', 'objetivoNivel', 'tareas',
])

const VALID_TAREA_KEYS = new Set([
  'id', 'nombre', 'tipoContenido', 'contenidoExpansion', 'contenidoDificultad',
  'tipo', 'cooldown', 'tiempo_min', 'prioridad', 'recompensa', 'hecho',
  'ultimo_completado', 'expansion', 'tags', 'orden',
])

export function normalizeData(data: WowData): WowData {
  if (!data.misiones) data.misiones = []
  if (!data.warbands) data.warbands = []
  if (!data.keybinds) data.keybinds = {}
  if (!data._meta) data._meta = {
    version: '2',
    descripcion: '',
    reset_weekly_dia: 'tuesday',
    ultimo_reset_semanal: null,
    total_personajes: 0,
    total_activos: 0,
    schema_version: 3,
  }
  data._meta.schema_version = data._meta.schema_version ?? 3

  const needsMigration = data.personajes.length > 0 && !Array.isArray(data.personajes[0]?.tareas)
  if (needsMigration) {
    return mergeSeed(data)
  }

  for (const p of data.personajes) {
    if (p.clase === 'Maga') p.clase = 'Mago'
    if ('activo' in p && typeof (p as any).activo === 'boolean') {
      if (p.planeado_usar === undefined) p.planeado_usar = (p as any).activo
      delete (p as any).activo
    }
    if (p.raza === null || p.raza === undefined) p.raza = ''
    if (p.faccion !== 'Horda' && p.faccion !== 'Alianza') p.faccion = 'Horda'
    if (typeof p.nivel !== 'number') p.nivel = 80
    if (typeof p.planeado_usar !== 'boolean') p.planeado_usar = true
    if (p.descripcion === undefined) p.descripcion = ''
    if (p.tipo === undefined) p.tipo = 'funcional'
    if (p.objetivoNivel === undefined || typeof p.objetivoNivel !== 'number') p.objetivoNivel = 90
    if (p.parecidos === undefined) {
      const single = (p as any).parecido
      p.parecidos = single ? [single] : []
      delete (p as any).parecido
    }
    if (!Array.isArray(p.parecidos)) p.parecidos = []
    p.profesiones = normalizeProfesiones((p as any).profesiones)
    if (!Array.isArray(p.tareas)) p.tareas = []

    for (const t of p.tareas) {
      if (t.tipoContenido === undefined) t.tipoContenido = 'descripcion'
      if (t.contenidoExpansion === undefined) t.contenidoExpansion = ''
      if (t.contenidoDificultad === undefined) t.contenidoDificultad = ''
      if (t.expansion === null || t.expansion === undefined) t.expansion = ''
      if (!t.tags) t.tags = []
    }
  }

  for (let i = 0; i < data.personajes.length; i++) {
    const p = data.personajes[i]
    const clean: any = {}
    for (const key of VALID_PERSONAJE_KEYS) {
      if (key in p) clean[key] = (p as any)[key]
    }
    clean.tareas = (p.tareas || []).map((t: any) => {
      const tc: any = {}
      for (const key of VALID_TAREA_KEYS) {
        if (key in t) tc[key] = t[key]
      }
      return tc
    })
    data.personajes[i] = clean
  }

  propagateExpansion(data)

  const needsOrden = data.personajes.some(p => p.tareas.some(t => t.orden === undefined))
  if (needsOrden) {
    for (const p of data.personajes) {
      p.tareas.forEach((t, i) => { if (t.orden === undefined) t.orden = i })
    }
  }

  data._meta.total_personajes = data.personajes.length
  data._meta.total_activos = data.personajes.filter(p => p.planeado_usar).length

  return data
}

export function loadData(): WowData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const data = initSeed()
    saveData(data)
    return data
  }
  try {
    const data = normalizeData(JSON.parse(raw) as WowData)
    saveData(data)
    if (data._meta?.ultimo_reset_semanal) {
      localStorage.setItem(RESET_KEY, data._meta.ultimo_reset_semanal)
    }
    return data
  } catch {
    const data = initSeed()
    saveData(data)
    return data
  }
}

function mergeSeed(data: WowData): WowData {
  const seed = SEED_DATA
  data.personajes = data.personajes.map(p => {
    const sp = seed.personajes.find(sp => sp.nombre === p.nombre)
    if (sp) return { ...sp, ...p, tareas: p.tareas || sp.tareas || [] }
    return { ...p, tareas: p.tareas || [] }
  })
  for (const p of data.personajes) {
    p.profesiones = normalizeProfesiones((p as any).profesiones)
  }
  if (!data.misiones) data.misiones = seed.misiones || []
  if (!data.warbands) data.warbands = seed.warbands || []
  data._meta = { ...seed._meta, ...data._meta }
  return propagateExpansion(data)
}

export function saveData(data: WowData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  if (data._meta?.ultimo_reset_semanal) {
    localStorage.setItem(RESET_KEY, data._meta.ultimo_reset_semanal)
  }
}

export function computeStats(data: WowData): Stats {
  const activos = data.personajes.filter(c => c.planeado_usar)
  const totalWeekly = data.personajes.reduce((s, c) => s + c.tareas.filter(t => t.cooldown === 'weekly').length, 0)
  const doneWeekly = data.personajes.reduce((s, c) => s + c.tareas.filter(t => t.cooldown === 'weekly' && t.hecho).length, 0)
  const totalDaily = data.personajes.reduce((s, c) => s + c.tareas.filter(t => t.cooldown === 'daily').length, 0)
  const doneDaily = data.personajes.reduce((s, c) => s + c.tareas.filter(t => t.cooldown === 'daily' && t.hecho).length, 0)
  return {
    total: data.personajes.length,
    activos: activos.length,
    warbands: data.warbands.length,
    weeklyTotal: totalWeekly,
    weeklyDone: doneWeekly,
    weeklyPct: totalWeekly > 0 ? Math.round(doneWeekly / totalWeekly * 100) : 0,
    dailyTotal: totalDaily,
    dailyDone: doneDaily,
  }
}

export function importJSON(jsonStr: string): WowData {
  const data = JSON.parse(jsonStr) as WowData
  if (!data.personajes || !data.warbands || !data._meta) {
    throw new Error('Estructura inválida')
  }
  normalizeData(data)
  checkWeeklyReset(data)
  return data
}

export function exportJSON(data: WowData): string {
  return JSON.stringify(data, null, 2)
}

export function exportPersonajesJSON(data: WowData): string {
  return JSON.stringify(data.personajes, null, 2)
}

export function exportFullBackup(data: WowData): string {
  let gistConfig = null
  try {
    const raw = localStorage.getItem('wowseg_gist_config')
    if (raw) gistConfig = JSON.parse(raw)
  } catch { /* empty */ }

  const backup: BackupData = {
    _export: {
      version: 2,
      exported_at: new Date().toISOString(),
      app_name: 'WoW Seg Warband Tracker',
      data: { ...data, misiones: data.misiones || [] },
      preferences: {
        theme: localStorage.getItem('wowseg_theme') || 'dark',
        fontsize: localStorage.getItem('wowseg_fontsize') || 'medium',
      },
      gist: gistConfig
        ? { config: gistConfig, hash: localStorage.getItem('wowseg_gist_lasthash') || '' }
        : null,
      reset_last: localStorage.getItem(RESET_KEY) || null,
    },
  }
  return JSON.stringify(backup, null, 2)
}

export function importFullBackup(jsonStr: string): WowData {
  const pkg = JSON.parse(jsonStr)
  if (!pkg._export?.data) throw new Error('Estructura de backup inválida')
  if (!pkg._export.data.personajes || !pkg._export.data.warbands) throw new Error('Datos inválidos')

  const data = pkg._export.data as WowData
  if (pkg._export.reset_last) {
    localStorage.setItem(RESET_KEY, pkg._export.reset_last)
  }
  if (pkg._export.preferences) {
    const prefs = pkg._export.preferences
    if (prefs.theme) localStorage.setItem('wowseg_theme', prefs.theme)
    if (prefs.fontsize) localStorage.setItem('wowseg_fontsize', prefs.fontsize)
  }
  if (pkg._export.gist?.config) {
    localStorage.setItem('wowseg_gist_config', JSON.stringify(pkg._export.gist.config))
    if (pkg._export.gist.hash) localStorage.setItem('wowseg_gist_lasthash', pkg._export.gist.hash)
  }
  return normalizeData(data)
}

export function getCharExpansion(nombre: string): string {
  return CHAR_EXPANSION[nombre] || ''
}

export function getExpansionsList(data: WowData): string[] {
  const exps = new Set<string>()
  for (const e of Object.values(CHAR_EXPANSION)) exps.add(e)
  for (const m of (data.misiones || [])) {
    if (m.expansion) exps.add(m.expansion)
  }
  return [...exps]
}
