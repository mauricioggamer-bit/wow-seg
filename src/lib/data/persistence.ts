import type { WowData, Stats, BackupData, ProfesionSlot, Personaje, ExportSection, ExportPayload } from '../types'
import { SEED_DATA } from './seed'
import { checkWeeklyReset } from './weekly-reset'
import { PROFESIONES } from '../constants/profesiones'

const STORAGE_KEY = 'wowseg_data'
const RESET_KEY = 'wowseg_last_reset'

const memoryStorage = new Map<string, string>()
const storage: Pick<Storage, 'getItem' | 'setItem'> = typeof localStorage !== 'undefined'
  ? localStorage
  : {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => { memoryStorage.set(key, value) },
    }

const PROFESION_IDS = new Set(PROFESIONES.map(p => p.id))

function emptyProfesiones(): ProfesionSlot[] {
  return [{ id: '', completadas: [] }, { id: '', completadas: [] }]
}

function normalizeProfesiones(raw: any): ProfesionSlot[] {
  const arr: ProfesionSlot[] = []
  if (Array.isArray(raw)) {
    for (let i = 0; i < 2; i++) {
      const slot = raw[i]
      if (slot && typeof slot === 'object') {
        const id = typeof slot.id === 'string' ? (PROFESION_IDS.has(slot.id) ? slot.id : '') : ''
        const completadas = Array.isArray(slot.completadas) ? slot.completadas.filter((x: any) => typeof x === 'string') : []
        let rol: 'main' | 'cd' | undefined = slot.rol === 'main' || slot.rol === 'cd' ? slot.rol : undefined
        if (!rol && slot.esMainCrafter === true) rol = 'main'
        const motivo = typeof slot.motivo === 'string' ? slot.motivo : undefined
        arr.push({ id, completadas, rol, motivo })
      } else if (typeof slot === 'string' && slot) {
        arr.push({ id: PROFESION_IDS.has(slot) ? slot : '', completadas: [] })
      } else {
        arr.push({ id: '', completadas: [] })
      }
    }
  }
  while (arr.length < 2) arr.push({ id: '', completadas: [] })
  return arr.slice(0, 2)
}

function normalizeTagsEstrategicos(raw: any): { id: string; texto: string; puntos: number }[] {
  if (!Array.isArray(raw)) return []
  const arr: { id: string; texto: string; puntos: number }[] = []
  for (const tag of raw) {
    if (tag && typeof tag === 'object') {
      const id = typeof tag.id === 'string' ? tag.id : typeof tag.id === 'number' ? String(tag.id) : ''
      const texto = typeof tag.texto === 'string' ? tag.texto : ''
      const puntos = typeof tag.puntos === 'number' && !isNaN(tag.puntos) ? tag.puntos : 0
      if (id && texto) arr.push({ id, texto, puntos })
    }
  }
  return arr
}

function migrateTagsToVentajas(data: WowData): void {
  const indexes = data.strategicConfig!.indexes!
  const values = data.strategicConfig!.values!
  for (const p of data.personajes) {
    const tags = normalizeTagsEstrategicos((p as any).tagsEstrategicos)
    for (const tag of tags) {
      const texto = tag.texto.trim()
      if (!texto || !tag.puntos) continue
      let idx = indexes.find(i => i.name.toLowerCase() === texto.toLowerCase())
      if (!idx) {
        const base = 'idx_' + texto.toLowerCase().replace(/[^a-z0-9]/g, '_')
        let id = base || `idx_tag_${indexes.length}`
        let n = 1
        while (indexes.some(i => i.id === id)) { id = `${base}_${n++}` }
        idx = { id, name: texto, description: '', context: 'general', entityTypes: ['personaje'] }
        indexes.push(idx)
      }
      const key = `personaje:${p.nombre}:${idx.id}`
      if (values[key] === undefined) values[key] = tag.puntos
    }
  }
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
  return data
}

export function initSeed(): WowData {
  const data = JSON.parse(JSON.stringify(SEED_DATA)) as WowData
  data._meta.schema_version = 3
  data.profesionOrden = PROFESIONES.map(p => p.id)
  propagateExpansion(data)
  return data
}

const VALID_PERSONAJE_KEYS = new Set([
  'nombre', 'clase', 'nivel', 'faccion', 'raza', 'reino', 'warband',
  'motivoWarband', 'expansion_por_defecto', 'parecidos', 'profesiones',
  'planeado_usar', 'descripcion', 'objetivoNivel', 'timewaysPct', 'tareas',
])

const VALID_TAREA_KEYS = new Set([
  'id', 'nombre', 'personaje', 'esPrincipal', 'tipoContenido', 'contenidoExpansion', 'contenidoDificultad',
  'tipo', 'cooldown', 'tiempo_min', 'prioridad', 'recompensa', 'hecho',
  'ultimo_completado', 'expansion', 'nivelRecomendado', 'tags', 'orden', 'puntos',
])

export function normalizeData(data: WowData): WowData {
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
  if (!data.profesionOrden || data.profesionOrden.length === 0) {
    data.profesionOrden = PROFESIONES.map(p => p.id)
  }
  if (!data.strategicConfig) data.strategicConfig = {}
  if (!data.strategicConfig.indexes) {
    data.strategicConfig.indexes = []
  }
  if (!data.strategicConfig.categories) {
    data.strategicConfig.categories = [
      { id: 'general', label: 'General', orden: 0 },
      { id: 'mundo_abierto', label: 'Mundo abierto', orden: 1 },
      { id: 'mazmorra_larga', label: 'Mazmorra larga', orden: 2 },
      { id: 'viaje_ciudad', label: 'Viaje entre ciudades', orden: 3 },
      { id: 'raid', label: 'Raid', orden: 4 },
      { id: 'rare', label: 'Rare', orden: 5 },
    ]
  }
  if (!data.strategicConfig.values) data.strategicConfig.values = {}
  if (!data.strategicConfig.componentWeights) data.strategicConfig.componentWeights = {}

  // Migration: professionValue → profesionesCompletas (Jul 2026)
  if (data.strategicConfig.componentWeights.professionValue > 0) {
    data.strategicConfig.componentWeights.profesionesCompletas = data.strategicConfig.componentWeights.professionValue
    delete data.strategicConfig.componentWeights.professionValue
  }

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
    if (p.objetivoNivel === undefined || typeof p.objetivoNivel !== 'number') p.objetivoNivel = 90
    if (p.timewaysPct === undefined || typeof p.timewaysPct !== 'number') p.timewaysPct = 0
    if (p.timewaysPct < 0) p.timewaysPct = 0
    if (p.timewaysPct > 30) p.timewaysPct = 30
    if (p.parecidos === undefined) {
      const single = (p as any).parecido
      p.parecidos = single ? [single] : []
      delete (p as any).parecido
    }
    if (!Array.isArray(p.parecidos)) p.parecidos = []
    p.profesiones = normalizeProfesiones((p as any).profesiones)
    if (!Array.isArray(p.tareas)) p.tareas = []

    for (const t of p.tareas) {
      if (t.esPrincipal === undefined) t.esPrincipal = false
      if (t.personaje === undefined) t.personaje = ''
      if (t.tipoContenido === undefined) t.tipoContenido = 'descripcion'
      if (t.contenidoExpansion === undefined) t.contenidoExpansion = ''
      if (t.contenidoDificultad === undefined) t.contenidoDificultad = ''
      if (t.expansion === null || t.expansion === undefined) t.expansion = ''
      if (!t.tags) t.tags = []
      if (t.puntos === undefined || typeof t.puntos !== 'number' || isNaN(t.puntos)) t.puntos = 0
    }
  }

  migrateTagsToVentajas(data)

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

  const wbMap = new Map<string, string[]>()
  for (const p of data.personajes) {
    const wbName = p.warband || 'nada'
    if (!wbMap.has(wbName)) wbMap.set(wbName, [])
    wbMap.get(wbName)!.push(p.nombre)
  }
  data.warbands = [...wbMap.entries()].map(([nombre, personajes]) => {
    const existing = data.warbands.find(w => w.nombre === nombre)
    return {
      nombre,
      personajes,
      orden: existing?.orden,
    }
  })
  let maxOrden = Math.max(0, ...data.warbands.map(w => w.orden ?? -1))
  for (const wb of data.warbands) {
    if (wb.orden === undefined) {
      wb.orden = wb.nombre === 'nada' ? 999 : maxOrden++
    }
  }

  data._meta.total_personajes = data.personajes.length
  data._meta.total_activos = data.personajes.filter(p => p.planeado_usar).length

  const d = data as any
  try {
    const lcRaw = storage.getItem('wowseg_leveling_config')
    if (lcRaw) {
      try { d.levelingConfig = JSON.parse(lcRaw) } catch { /* empty */ }
    } else if (d.levelingConfig) {
      try { storage.setItem('wowseg_leveling_config', JSON.stringify(d.levelingConfig)) } catch { /* empty */ }
    }
  } catch { /* empty */ }
  try {
    const xpRaw = storage.getItem('wowseg_xp_overrides')
    if (xpRaw) {
      try { d.xpOverrides = JSON.parse(xpRaw) } catch { /* empty */ }
    } else if (d.xpOverrides) {
      try { storage.setItem('wowseg_xp_overrides', JSON.stringify(d.xpOverrides)) } catch { /* empty */ }
    }
  } catch { /* empty */ }
  try {
    const dxpRaw = storage.getItem('wowseg_dungeon_xp_overrides')
    if (dxpRaw) {
      try { d.dungeonXpOverrides = JSON.parse(dxpRaw) } catch { /* empty */ }
    } else if (d.dungeonXpOverrides) {
      try { storage.setItem('wowseg_dungeon_xp_overrides', JSON.stringify(d.dungeonXpOverrides)) } catch { /* empty */ }
    }
  } catch { /* empty */ }

  return data
}

export function loadData(): WowData {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) {
    const data = normalizeData(initSeed())
    saveData(data)
    return data
  }
  try {
    const data = normalizeData(JSON.parse(raw) as WowData)
    saveData(data)
    if (data._meta?.ultimo_reset_semanal) {
      storage.setItem(RESET_KEY, data._meta.ultimo_reset_semanal)
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
  if (!data.warbands) data.warbands = seed.warbands || []
  data._meta = { ...seed._meta, ...data._meta }
  return propagateExpansion(data)
}

export function saveData(data: WowData): void {
  const d = data as any
  try {
    const lc = storage.getItem('wowseg_leveling_config')
    if (lc) d.levelingConfig = JSON.parse(lc)
  } catch { /* empty */ }
  try {
    const xp = storage.getItem('wowseg_xp_overrides')
    if (xp) d.xpOverrides = JSON.parse(xp)
  } catch { /* empty */ }
  try {
    const dxp = storage.getItem('wowseg_dungeon_xp_overrides')
    if (dxp) d.dungeonXpOverrides = JSON.parse(dxp)
  } catch { /* empty */ }
  storage.setItem(STORAGE_KEY, JSON.stringify(d))
  if (data._meta?.ultimo_reset_semanal) {
    storage.setItem(RESET_KEY, data._meta.ultimo_reset_semanal)
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
  const parsed = JSON.parse(jsonStr)
  const data = (() => {
    if (Array.isArray(parsed)) {
      return { personajes: parsed as Personaje[], warbands: [] } as unknown as WowData
    }
    const d = parsed as WowData & { misiones?: unknown }
    delete d.misiones
    return d
  })()
  if (!Array.isArray(data.personajes)) {
    throw new Error('Estructura inválida: falta el array de personajes')
  }
  normalizeData(data as WowData)
  if (!data.warbands || data.warbands.length === 0) {
    const grouped = new Map<string, string[]>()
    for (const p of data.personajes) {
      const wb = p.warband || ''
      if (!wb) continue
      if (!grouped.has(wb)) grouped.set(wb, [])
      grouped.get(wb)!.push(p.nombre)
    }
    data.warbands = [...grouped.entries()].map(([nombre, personajes]) => ({
      nombre,
      personajes,
    }))
  }
  checkWeeklyReset(data as WowData)
  return data as WowData
}

export function exportJSON(data: WowData): string {
  const d = { ...data } as any
  try {
    const lc = storage.getItem('wowseg_leveling_config')
    if (lc) d.levelingConfig = JSON.parse(lc)
  } catch { /* empty */ }
  try {
    const xp = storage.getItem('wowseg_xp_overrides')
    if (xp) d.xpOverrides = JSON.parse(xp)
  } catch { /* empty */ }
  try {
    const dxp = storage.getItem('wowseg_dungeon_xp_overrides')
    if (dxp) d.dungeonXpOverrides = JSON.parse(dxp)
  } catch { /* empty */ }
  return JSON.stringify(d, null, 2)
}

export function exportPersonajesJSON(data: WowData): string {
  return JSON.stringify(data.personajes, null, 2)
}

function pickPersonajeFields(p: Personaje, sections: ExportSection[]): any {
  const out: any = {}
  if (sections.includes('personajes') || sections.includes('nombres_fantasia') || sections.includes('profesiones') || sections.includes('tareas')) {
    out.nombre = p.nombre
  }
  if (sections.includes('personajes')) {
    out.clase = p.clase
    out.nivel = p.nivel
    out.faccion = p.faccion
    out.raza = p.raza
    out.reino = p.reino
    out.warband = p.warband
    out.expansion_por_defecto = p.expansion_por_defecto
    out.planeado_usar = p.planeado_usar
    out.descripcion = p.descripcion
    out.objetivoNivel = p.objetivoNivel
    out.timewaysPct = p.timewaysPct
  }
  if (sections.includes('nombres_fantasia')) {
    out.clase = p.clase
    out.raza = p.raza
    out.faccion = p.faccion
    out.parecidos = p.parecidos
    out.descripcion = p.descripcion
  }
  if (sections.includes('profesiones')) {
    out.profesiones = p.profesiones
  }
  if (sections.includes('tareas')) {
    out.tareas = p.tareas
  }
  return out
}

export function exportSections(data: WowData, sections: ExportSection[]): string {
  const payload: ExportPayload = {
    _exportType: 'wowseg_export',
    version: 1,
    exportedAt: new Date().toISOString(),
    sections,
    data: {},
  }

  const needsPersonajes = sections.some(s =>
    ['personajes', 'nombres_fantasia', 'profesiones', 'tareas'].includes(s)
  )
  if (needsPersonajes) {
    payload.data.personajes = data.personajes.map(p => pickPersonajeFields(p, sections)) as Personaje[]
  }

  if (sections.includes('personajes') || sections.includes('warbands')) {
    payload.data.warbands = data.warbands
  }
  if (sections.includes('keybinds')) {
    payload.data.keybinds = data.keybinds
  }
  if (sections.includes('config_leveling')) {
    payload.data._meta = data._meta
  }

  return JSON.stringify(payload, null, 2)
}

export function importSections(jsonStr: string, current: WowData): WowData {
  const parsed = JSON.parse(jsonStr)

  if (parsed._exportType === 'wowseg_export') {
    const p = parsed as ExportPayload
    const sections = p.sections
    const incoming = p.data
    const result = { ...current }

    if (sections.includes('personajes')) {
      result.personajes = (incoming.personajes ?? []) as Personaje[]
    } else {
      const incomingChars = (incoming.personajes ?? []) as Personaje[]
      const charMap = new Map(incomingChars.map(c => [c.nombre, c]))
      if (incomingChars.length > 0) {
        result.personajes = result.personajes.map(existing => {
          const matching = charMap.get(existing.nombre)
          if (!matching) return existing
          const out: any = { ...existing }
          if (sections.includes('nombres_fantasia')) {
            out.clase = matching.clase; out.raza = matching.raza; out.faccion = matching.faccion
            out.parecidos = matching.parecidos; out.descripcion = matching.descripcion
          }
          if (sections.includes('profesiones')) out.profesiones = matching.profesiones
          if (sections.includes('tareas')) out.tareas = matching.tareas
          return out as Personaje
        })
      }
    }

    if (sections.includes('warbands')) {
      result.warbands = incoming.warbands ?? []
      if (sections.includes('personajes')) {
        for (const p of result.personajes) {
          const inWb = (incoming.personajes as Personaje[])?.find(x => x.nombre === p.nombre)
          if (inWb?.warband) p.warband = inWb.warband
        }
      }
    }
    if (sections.includes('keybinds')) {
      result.keybinds = { ...result.keybinds, ...(incoming.keybinds ?? {}) }
    }
    if (sections.includes('config_leveling')) {
      result._meta = { ...result._meta, ...incoming._meta }
    }

    return normalizeData(result)
  }

  const data = (() => {
    if (Array.isArray(parsed)) {
      return { personajes: parsed as Personaje[], warbands: [] } as unknown as WowData
    }
    const d = parsed as WowData & { misiones?: unknown }
    delete d.misiones
    return d
  })()
  if (!Array.isArray(data.personajes)) {
    throw new Error('Estructura inválida: falta el array de personajes')
  }
  normalizeData(data)
  if (!data.warbands || data.warbands.length === 0) {
    const grouped = new Map<string, string[]>()
    for (const p of data.personajes) {
      const wb = p.warband || ''
      if (!wb) continue
      if (!grouped.has(wb)) grouped.set(wb, [])
      grouped.get(wb)!.push(p.nombre)
    }
    data.warbands = [...grouped.entries()].map(([nombre, personajes]) => ({ nombre, personajes }))
  }
  checkWeeklyReset(data as WowData)
  return data as WowData
}

export function exportFullBackup(data: WowData): string {
  let gistConfig = null
  try {
    const raw = storage.getItem('wowseg_gist_config')
    if (raw) gistConfig = JSON.parse(raw)
  } catch { /* empty */ }

  const backup: BackupData = {
    _export: {
      version: 2,
      exported_at: new Date().toISOString(),
      app_name: 'WoW Seg Warband Tracker',
      data: { ...data } as WowData,
      preferences: {
        theme: storage.getItem('wowseg_theme') || 'dark',
        fontsize: storage.getItem('wowseg_fontsize') || 'medium',
      },
      gist: gistConfig
        ? { config: gistConfig, hash: storage.getItem('wowseg_gist_lasthash') || '' }
        : null,
      reset_last: storage.getItem(RESET_KEY) || null,
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
    storage.setItem(RESET_KEY, pkg._export.reset_last)
  }
  if (pkg._export.preferences) {
    const prefs = pkg._export.preferences
    if (prefs.theme) storage.setItem('wowseg_theme', prefs.theme)
    if (prefs.fontsize) storage.setItem('wowseg_fontsize', prefs.fontsize)
  }
  if (pkg._export.gist?.config) {
    storage.setItem('wowseg_gist_config', JSON.stringify(pkg._export.gist.config))
    if (pkg._export.gist.hash) storage.setItem('wowseg_gist_lasthash', pkg._export.gist.hash)
  }
  return normalizeData(data)
}

export function getCharExpansion(nombre: string): string {
  return CHAR_EXPANSION[nombre] || ''
}

export function getExpansionsList(data: WowData): string[] {
  const exps = new Set<string>()
  for (const e of Object.values(CHAR_EXPANSION)) exps.add(e)
  for (const p of data.personajes) {
    for (const t of p.tareas) {
      if (t.expansion) exps.add(t.expansion)
    }
  }
  return [...exps]
}

