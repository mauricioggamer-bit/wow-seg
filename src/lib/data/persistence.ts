import type { WowData, Stats, BackupData } from '../types'
import { SEED_DATA } from './seed'
import { checkWeeklyReset } from './weekly-reset'

const STORAGE_KEY = 'wowseg_data'
const RESET_KEY = 'wowseg_last_reset'

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
  data._meta.schema_version = 2
  propagateExpansion(data)
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
    const data = JSON.parse(raw) as WowData
    const needsMigration = data.personajes.length > 0 && !Array.isArray(data.personajes[0]?.tareas)
    if (needsMigration) {
      const merged = mergeSeed(data)
      saveData(merged)
      return merged
    }
    const needsExp = !data.personajes[0]?.tareas?.[0]?.expansion
    if (needsExp) {
      propagateExpansion(data)
      saveData(data)
    }
    const needsOrden = data.personajes.some(p => p.tareas.some(t => t.orden === undefined))
    if (needsOrden) {
      for (const p of data.personajes) {
        p.tareas.forEach((t, i) => { if (t.orden === undefined) t.orden = i })
      }
      saveData(data)
    }
    const needsParecidos = data.personajes.some(p => p.parecidos === undefined)
    if (needsParecidos) {
      for (const p of data.personajes) {
        const single = (p as any).parecido
        p.parecidos = single ? [single] : []
        delete (p as any).parecido
      }
      saveData(data)
    }
    const needsPlaneado = data.personajes.some(p => p.planeado_usar === undefined)
    if (needsPlaneado) {
      for (const p of data.personajes) {
        if (p.planeado_usar === undefined) p.planeado_usar = true
      }
      saveData(data)
    }
    const needsDescTipo = data.personajes.some(p => p.descripcion === undefined || p.tipo === undefined)
    if (needsDescTipo) {
      for (const p of data.personajes) {
        if (p.descripcion === undefined) p.descripcion = ''
        if (p.tipo === undefined) p.tipo = 'funcional'
      }
      saveData(data)
    }
    const needsTipoContenido = data.personajes.some(p => p.tareas.some(t => t.tipoContenido === undefined))
    if (needsTipoContenido) {
      for (const p of data.personajes) {
        for (const t of p.tareas) {
          if (t.tipoContenido === undefined) t.tipoContenido = 'descripcion'
        }
      }
      saveData(data)
    }
    const needsContenidoExtra = data.personajes.some(p => p.tareas.some(t => t.contenidoExpansion === undefined))
    if (needsContenidoExtra) {
      for (const p of data.personajes) {
        for (const t of p.tareas) {
          if (t.contenidoExpansion === undefined) t.contenidoExpansion = ''
          if (t.contenidoDificultad === undefined) t.contenidoDificultad = ''
        }
      }
      saveData(data)
    }
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
  const activos = data.personajes.filter(c => c.activo)
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
  return data
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
