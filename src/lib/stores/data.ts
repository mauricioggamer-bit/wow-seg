import { writable, derived, get } from 'svelte/store'
import type { WowData, Personaje, Warband, Mision, Stats } from '../types'
import { loadData, saveData, computeStats as computeStatsFn, exportJSON as exportJSONFn, exportPersonajesJSON as exportPersonajesJSONFn, exportFullBackup as exportFullBackupFn, initSeed as initSeedFn } from '../data/persistence'
import { checkWeeklyReset, resetDailyTasks } from '../data/weekly-reset'

function createDataStore() {
  const initial = loadData()

  if (checkWeeklyReset(initial)) {
    saveData(initial)
  }

  const { subscribe, set, update } = writable<WowData>(initial)

  const store = {
    subscribe,
    save() {
      update(d => { saveData(d); return d })
    },
    getData(): WowData {
      return get({ subscribe })
    },
    getPersonajes(): Personaje[] {
      return get({ subscribe }).personajes
    },
    getPersonaje(nombre: string): Personaje | undefined {
      return get({ subscribe }).personajes.find(p => p.nombre === nombre)
    },
    updatePersonaje(nombre: string, updates: Partial<Personaje>) {
      update(d => {
        const idx = d.personajes.findIndex(p => p.nombre === nombre)
        if (idx !== -1) {
          d.personajes[idx] = { ...d.personajes[idx], ...updates }
          d._meta.total_personajes = d.personajes.length
          d._meta.total_activos = d.personajes.filter(p => p.activo).length
          saveData(d)
        }
        return d
      })
    },
    toggleTarea(nombrePersonaje: string, tareaId: string) {
      update(d => {
        const p = d.personajes.find(pj => pj.nombre === nombrePersonaje)
        if (!p) return d
        const t = p.tareas.find(tk => tk.id === tareaId)
        if (!t) return d
        t.hecho = !t.hecho
        t.ultimo_completado = t.hecho ? new Date().toISOString() : null
        saveData(d)
        return d
      })
    },
    updateTarea(nombrePersonaje: string, tareaId: string, updates: Partial<Personaje['tareas'][0]>) {
      update(d => {
        const p = d.personajes.find(pj => pj.nombre === nombrePersonaje)
        if (!p) return d
        const t = p.tareas.find(tk => tk.id === tareaId)
        if (!t) return d
        Object.assign(t, updates)
        saveData(d)
        return d
      })
    },
    deleteTarea(nombrePersonaje: string, tareaId: string) {
      update(d => {
        const p = d.personajes.find(pj => pj.nombre === nombrePersonaje)
        if (!p) return d
        p.tareas = p.tareas.filter(t => t.id !== tareaId)
        saveData(d)
        return d
      })
    },
    moveTarea(nombrePersonaje: string, tareaId: string, direction: -1 | 1) {
      update(d => {
        const p = d.personajes.find(pj => pj.nombre === nombrePersonaje)
        if (!p) return d
        const sorted = [...p.tareas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        const idx = sorted.findIndex(t => t.id === tareaId)
        if (idx === -1) return d
        const swapIdx = idx + direction
        if (swapIdx < 0 || swapIdx >= sorted.length) return d
        const a = sorted[idx]
        const b = sorted[swapIdx]
        const tmp = a.orden ?? idx
        a.orden = b.orden ?? swapIdx
        b.orden = tmp
        saveData(d)
        return d
      })
    },
    addTarea(nombrePersonaje: string, tarea: { nombre: string; tipo?: string; cooldown?: string; prioridad?: number; tiempo_min?: number; expansion?: string }) {
      update(d => {
        const p = d.personajes.find(pj => pj.nombre === nombrePersonaje)
        if (!p) return d
        const id = 'ts' + Date.now()
        const maxOrden = p.tareas.reduce((m, t) => Math.max(m, t.orden ?? 0), -1)
        p.tareas.push({
          id,
          nombre: tarea.nombre,
          hecho: false,
          tipo: tarea.tipo || 'mision',
          cooldown: tarea.cooldown || 'none',
          prioridad: tarea.prioridad ?? 2,
          tiempo_min: tarea.tiempo_min ?? 15,
          expansion: tarea.expansion || '',
          creada: new Date().toISOString(),
          tags: [],
          orden: maxOrden + 1,
        })
        saveData(d)
        return d
      })
    },
    resetDailyTasks() {
      update(d => {
        resetDailyTasks(d)
        saveData(d)
        return d
      })
    },
    getMisiones(): Mision[] {
      return get({ subscribe }).misiones || []
    },
    addMision(m: Omit<Mision, 'id' | 'creada'>) {
      update(d => {
        if (!d.misiones) d.misiones = []
        const id = 'm' + Date.now()
        d.misiones.push({ id, ...m, creada: new Date().toISOString() })
        saveData(d)
        return d
      })
    },
    updateMision(id: string, updates: Partial<Mision>) {
      update(d => {
        if (!d.misiones) return d
        const idx = d.misiones.findIndex(m => m.id === id)
        if (idx !== -1) {
          d.misiones[idx] = { ...d.misiones[idx], ...updates }
          saveData(d)
        }
        return d
      })
    },
    deleteMision(id: string) {
      update(d => {
        if (!d.misiones) return d
        d.misiones = d.misiones.filter(m => m.id !== id)
        saveData(d)
        return d
      })
    },
    toggleMision(id: string) {
      update(d => {
        if (!d.misiones) return d
        const m = d.misiones.find(mx => mx.id === id)
        if (!m) return d
        m.estado = m.estado === 'completada' ? 'pendiente' : 'completada'
        saveData(d)
        return d
      })
    },
    getWarbands(): Warband[] {
      return get({ subscribe }).warbands
    },
    addPersonaje(p: { nombre: string; clase: string; raza: string; nivel: number; faccion: string; reino: string; warband: string; mision_principal?: string; expansion_por_defecto?: string | null; parecidos?: string[]; activo?: boolean }) {
      update(d => {
        if (d.personajes.find(x => x.nombre === p.nombre)) return d
        const nuevo: Personaje = {
          nombre: p.nombre,
          clase: p.clase,
          raza: p.raza,
          nivel: p.nivel,
          faccion: p.faccion as 'Horda' | 'Alianza',
          reino: p.reino,
          warband: p.warband,
          mision_principal: p.mision_principal || null,
          expansion_por_defecto: p.expansion_por_defecto || null,
          parecidos: p.parecidos || [],
          activo: p.activo ?? true,
          tareas: [],
        }
        d.personajes.push(nuevo)
        let wb = d.warbands.find(w => w.nombre === p.warband)
        if (!wb) {
          d.warbands.push({ nombre: p.warband, personajes: [p.nombre], tareas_disponibles: [] })
        } else {
          if (!wb.personajes.includes(p.nombre)) wb.personajes.push(p.nombre)
        }
        d._meta.total_personajes = d.personajes.length
        d._meta.total_activos = d.personajes.filter(c => c.activo).length
        saveData(d)
        return d
      })
    },
    moveCharToExpansion(charName: string, newExp: string) {
      update(d => {
        const char = d.personajes.find(p => p.nombre === charName)
        if (!char || char.expansion_por_defecto === newExp) return d
        const oldExp = char.expansion_por_defecto
        char.expansion_por_defecto = newExp
        for (const t of char.tareas) {
          if (t.expansion === oldExp) t.expansion = newExp
        }
        for (const m of (d.misiones || [])) {
          if (m.personaje === charName && m.expansion === oldExp) m.expansion = newExp
        }
        saveData(d)
        return d
      })
    },
    moveCharToWarband(charName: string, newWarband: string) {
      update(d => {
        const char = d.personajes.find(p => p.nombre === charName)
        if (!char || char.warband === newWarband) return d
        const oldWarband = char.warband
        char.warband = newWarband
        const oldWb = d.warbands.find(w => w.nombre === oldWarband)
        if (oldWb) oldWb.personajes = oldWb.personajes.filter(n => n !== charName)
        let newWb = d.warbands.find(w => w.nombre === newWarband)
        if (!newWb) {
          d.warbands.push({ nombre: newWarband, personajes: [charName], tareas_disponibles: [] })
        } else {
          if (!newWb.personajes.includes(charName)) newWb.personajes.push(charName)
        }
        d._meta.total_personajes = d.personajes.length
        d._meta.total_activos = d.personajes.filter(p => p.activo).length
        saveData(d)
        return d
      })
    },
    addWarband(name: string) {
      update(d => {
        if (d.warbands.find(w => w.nombre === name)) return d
        d.warbands.push({ nombre: name, personajes: [], tareas_disponibles: [] })
        saveData(d)
        return d
      })
    },
    renameWarband(oldName: string, newName: string) {
      update(d => {
        const wb = d.warbands.find(w => w.nombre === oldName)
        if (!wb || d.warbands.find(w => w.nombre === newName)) return d
        wb.nombre = newName
        for (const p of d.personajes) {
          if (p.warband === oldName) p.warband = newName
        }
        saveData(d)
        return d
      })
    },
    deleteWarband(name: string) {
      update(d => {
        const idx = d.warbands.findIndex(w => w.nombre === name)
        if (idx === -1) return d
        d.warbands.splice(idx, 1)
        for (const p of d.personajes) {
          if (p.warband === name) p.warband = 'nada'
        }
        const nadaWb = d.warbands.find(w => w.nombre === 'nada')
        if (nadaWb) {
          nadaWb.personajes = d.personajes.filter(p => p.warband === 'nada').map(p => p.nombre)
        }
        d._meta.total_personajes = d.personajes.length
        d._meta.total_activos = d.personajes.filter(p => p.activo).length
        saveData(d)
        return d
      })
    },
    importJSON(jsonStr: string) {
      const parsed = JSON.parse(jsonStr) as WowData
      if (!parsed.personajes || !parsed.warbands || !parsed._meta) {
        throw new Error('Estructura inválida')
      }
      checkWeeklyReset(parsed)
      set(parsed)
      saveData(parsed)
    },
    importFullBackup(jsonStr: string) {
      const pkg = JSON.parse(jsonStr)
      if (!pkg._export?.data) throw new Error('Estructura de backup inválida')
      if (!pkg._export.data.personajes || !pkg._export.data.warbands) throw new Error('Datos inválidos')
      const data = pkg._export.data as WowData
      if (pkg._export.reset_last) {
        localStorage.setItem('wowseg_last_reset', pkg._export.reset_last)
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
      set(data)
      saveData(data)
    },
    refresh() {
      const data = loadData()
      set(data)
    },
    initSeed() {
      const data = initSeedFn()
      set(data)
      saveData(data)
    },
    exportJSON(): string {
      return exportJSONFn(get({ subscribe }))
    },
    exportPersonajesJSON(): string {
      return exportPersonajesJSONFn(get({ subscribe }))
    },
    exportFullBackup(): string {
      return exportFullBackupFn(get({ subscribe }))
    },
  }

  return store
}

export const dataStore = createDataStore()
export const statsStore = derived(dataStore, $data => computeStatsFn($data))
export const personajesStore = derived(dataStore, $data => $data.personajes)
export const warbandsStore = derived(dataStore, $data => $data.warbands)
export const misionesStore = derived(dataStore, $data => $data.misiones || [])
