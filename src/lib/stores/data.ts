import { writable, derived, get } from 'svelte/store'
import type { WowData, Personaje, Warband, Stats, ProfesionSlot, TagEstrategico, Tarea } from '../types'
import type { TipoContenido } from '../constants/wowContent'
import type { ExportSection } from '../types'
import { loadData, saveData, normalizeData, computeStats as computeStatsFn, exportJSON as exportJSONFn, exportPersonajesJSON as exportPersonajesJSONFn, exportFullBackup as exportFullBackupFn, initSeed as initSeedFn, exportCSV as exportCSVFn, importCSV as importCSVFn, exportSections as exportSectionsFn, importSections as importSectionsFn } from '../data/persistence'
import { checkWeeklyReset, resetDailyTasks } from '../data/weekly-reset'
import { getKeybindString as getKeybindStringFn, keybindKey } from '../data/keybindDefaults'

function createDataStore() {
  const initial = loadData()

  if (checkWeeklyReset(initial)) {
    saveData(initial)
  }

  const { subscribe, set, update } = writable<WowData>(initial)

  const store = {
    subscribe,
    save() {
      update(d => { saveData(d); return { ...d } })
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
    updatePersonaje(nombre: string, updates: Partial<Personaje>): boolean {
      let ok = true
      update(d => {
        const idx = d.personajes.findIndex(p => p.nombre === nombre)
        if (idx === -1) { ok = false; return d }
        const current = d.personajes[idx]
        const oldWb = current.warband
        const newWb = updates.warband
        if (newWb && newWb !== oldWb) {
          if (newWb !== 'nada') {
            const targetWb = d.warbands.find(w => w.nombre === newWb)
            if (targetWb && targetWb.personajes.length >= 4) { ok = false; return d }
          }
          d.warbands = d.warbands
            .map(w => w.nombre === oldWb ? { ...w, personajes: w.personajes.filter(n => n !== nombre) } : w)
            .map(w => w.nombre === newWb && !w.personajes.includes(nombre) ? { ...w, personajes: [...w.personajes, nombre] } : w)
          const hasNewWb = d.warbands.some(w => w.nombre === newWb)
          if (!hasNewWb) {
            d.warbands = [...d.warbands, { nombre: newWb, personajes: [nombre] }]
          }
        }
        d.personajes = d.personajes.map((p, i) => i === idx ? { ...p, ...updates } : p)
        d._meta.total_personajes = d.personajes.length
        d._meta.total_activos = d.personajes.filter(p => p.planeado_usar).length
        saveData(d)
        return { ...d }
      })
      return ok
    },
    renamePersonaje(oldName: string, newName: string): boolean {
      const trimmed = newName.trim()
      if (!trimmed || trimmed === oldName) return true
      let ok = false
      update(d => {
        const exists = d.personajes.find(p => p.nombre === trimmed)
        if (exists) return d
        ok = true
        d.personajes = d.personajes.map(p => p.nombre === oldName ? { ...p, nombre: trimmed } : p)
        d.warbands = d.warbands.map(w => ({
          ...w,
          personajes: w.personajes.map(n => n === oldName ? trimmed : n),
        }))
        saveData(d)
        return { ...d }
      })
      return ok
    },
    updateObjetivoNivel(nombre: string, nivel: number) {
      update(d => {
        const exists = d.personajes.some(pj => pj.nombre === nombre)
        if (!exists) return d
        d.personajes = d.personajes.map(p => p.nombre === nombre ? { ...p, objetivoNivel: nivel } : p)
        saveData(d)
        return { ...d }
      })
    },
    updateTimewaysPct(nombre: string, pct: number) {
      update(d => {
        const exists = d.personajes.some(pj => pj.nombre === nombre)
        if (!exists) return d
        const clamped = Math.max(0, Math.min(30, pct))
        d.personajes = d.personajes.map(p => p.nombre === nombre ? { ...p, timewaysPct: clamped } : p)
        saveData(d)
        return { ...d }
      })
    },
    toggleTarea(nombrePersonaje: string, tareaId: string) {
      update(d => {
        const p = d.personajes.find(pj => pj.nombre === nombrePersonaje)
        if (!p) return d
        const t = p.tareas.find(tk => tk.id === tareaId)
        if (!t) return d
        d.personajes = d.personajes.map(pj => pj.nombre === nombrePersonaje
          ? { ...pj, tareas: pj.tareas.map(tk => tk.id === tareaId
              ? { ...tk, hecho: !tk.hecho, ultimo_completado: !tk.hecho ? new Date().toISOString() : null }
              : tk) }
          : pj)
        saveData(d)
        return { ...d }
      })
    },
    updateTarea(nombrePersonaje: string, tareaId: string, updates: Partial<Personaje['tareas'][0]>) {
      update(d => {
        const p = d.personajes.find(pj => pj.nombre === nombrePersonaje)
        if (!p) return d
        const t = p.tareas.find(tk => tk.id === tareaId)
        if (!t) return d
        d.personajes = d.personajes.map(pj => pj.nombre === nombrePersonaje
          ? { ...pj, tareas: pj.tareas.map(tk => tk.id === tareaId ? { ...tk, ...updates } : tk) }
          : pj)
        saveData(d)
        return { ...d }
      })
    },
    deleteTarea(nombrePersonaje: string, tareaId: string) {
      update(d => {
        const p = d.personajes.find(pj => pj.nombre === nombrePersonaje)
        if (!p) return d
        d.personajes = d.personajes.map(pj => pj.nombre === nombrePersonaje
          ? { ...pj, tareas: pj.tareas.filter(t => t.id !== tareaId) }
          : pj)
        saveData(d)
        return { ...d }
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
        const aOrden = a.orden ?? idx
        const bOrden = b.orden ?? swapIdx
        d.personajes = d.personajes.map(pj => pj.nombre === nombrePersonaje
          ? { ...pj, tareas: pj.tareas.map(tk => {
              if (tk.id === a.id) return { ...tk, orden: bOrden }
              if (tk.id === b.id) return { ...tk, orden: aOrden }
              return tk
            }) }
          : pj)
        saveData(d)
        return { ...d }
      })
    },
addTarea(nombrePersonaje: string, tarea: { nombre: string; tipoContenido?: TipoContenido; contenidoExpansion?: string; contenidoDificultad?: string; tipo?: string; cooldown?: string; prioridad?: number; tiempo_min?: number; expansion?: string; recompensa?: string }) {
      update(d => {
        const p = d.personajes.find(pj => pj.nombre === nombrePersonaje)
        if (!p) return d
        const id = 'ts' + Date.now()
        const maxOrden = p.tareas.reduce((m, t) => Math.max(m, t.orden ?? 0), -1)
        const nuevaTarea = {
          id,
          nombre: tarea.nombre,
          esPrincipal: false,
          tipoContenido: tarea.tipoContenido ?? 'descripcion',
          contenidoExpansion: tarea.contenidoExpansion || '',
          contenidoDificultad: tarea.contenidoDificultad || '',
          hecho: false,
          tipo: (tarea.tipo || 'mision') as 'weekly' | 'daily' | 'farm_libre',
          cooldown: (tarea.cooldown || 'none') as 'weekly' | 'daily' | 'none',
          prioridad: (tarea.prioridad ?? 2) as 1 | 2 | 3,
          tiempo_min: tarea.tiempo_min ?? 15,
          expansion: tarea.expansion || '',
          ultimo_completado: null,
          tags: [],
          orden: maxOrden + 1,
          recompensa: tarea.recompensa || '',
        }
        d.personajes = d.personajes.map(pj => pj.nombre === nombrePersonaje
          ? { ...pj, tareas: [...pj.tareas, nuevaTarea] }
          : pj)
        saveData(d)
        return { ...d }
      })
    },
    resetDailyTasks() {
      update(d => {
        const dCopy = structuredClone(d)
        resetDailyTasks(dCopy)
        saveData(dCopy)
        return dCopy
      })
    },
    
    getKeybind(className: string, specId: number): string {
      return getKeybindStringFn(className, specId, get({ subscribe }).keybinds)
    },
    updateKeybind(className: string, specId: number, base64: string) {
      update(d => {
        if (!d.keybinds) d.keybinds = {}
        d.keybinds[keybindKey(className, specId)] = base64
        saveData(d)
        return { ...d }
      })
    },
    resetKeybind(className: string, specId: number) {
      update(d => {
        if (!d.keybinds) return d
        delete d.keybinds[keybindKey(className, specId)]
        saveData(d)
        return { ...d }
      })
    },
    isKeybindEdited(className: string, specId: number): boolean {
      const d = get({ subscribe })
      return !!d.keybinds?.[keybindKey(className, specId)]
    },
    getWarbands(): Warband[] {
      return get({ subscribe }).warbands
    },
    deletePersonaje(nombre: string) {
      update(d => {
        d.personajes = d.personajes.filter(p => p.nombre !== nombre)
        d.warbands = d.warbands.map(wb => ({ ...wb, personajes: wb.personajes.filter(n => n !== nombre) }))
        d._meta.total_personajes = d.personajes.length
        d._meta.total_activos = d.personajes.filter(p => p.planeado_usar).length
        saveData(d)
        return { ...d }
      })
    },
    addPersonaje(p: { nombre: string; clase: string; raza: string; nivel: number; faccion: string; reino: string; warband: string; expansion_por_defecto?: string | null; parecidos?: string[]; profesiones?: ProfesionSlot[]; planeado_usar?: boolean; descripcion?: string; tagsEstrategicos?: TagEstrategico[] }): boolean {
      if (get({ subscribe }).personajes.find(x => x.nombre === p.nombre)) return false
      if (p.warband !== 'nada') {
        const targetWb = get({ subscribe }).warbands.find(w => w.nombre === p.warband)
        if (targetWb && targetWb.personajes.length >= 4) return false
      }
      update(d => {
        const nuevo: Personaje = {
          nombre: p.nombre,
          clase: p.clase,
          raza: p.raza,
          nivel: p.nivel,
          faccion: p.faccion as 'Horda' | 'Alianza',
          reino: p.reino,
          warband: p.warband,
          expansion_por_defecto: p.expansion_por_defecto || null,
          parecidos: p.parecidos || [],
          profesiones: p.profesiones ?? [{ id: '', completadas: [] }, { id: '', completadas: [] }],
          planeado_usar: p.planeado_usar ?? true,
          descripcion: p.descripcion ?? '',
          timewaysPct: 0,
          tagsEstrategicos: p.tagsEstrategicos ?? [],
          tareas: [],
        }
        d.personajes = [...d.personajes, nuevo]
        const wbExists = d.warbands.some(w => w.nombre === p.warband)
        if (!wbExists) {
          d.warbands = [...d.warbands, { nombre: p.warband, personajes: [p.nombre] }]
        } else {
          d.warbands = d.warbands.map(w => w.nombre === p.warband && !w.personajes.includes(p.nombre)
            ? { ...w, personajes: [...w.personajes, p.nombre] }
            : w)
        }
        d._meta.total_personajes = d.personajes.length
        d._meta.total_activos = d.personajes.filter(c => c.planeado_usar).length
        saveData(d)
        return { ...d }
      })
      return true
    },
    moveCharToExpansion(charName: string, newExp: string) {
      update(d => {
        const char = d.personajes.find(p => p.nombre === charName)
        if (!char || char.expansion_por_defecto === newExp) return d
        const oldExp = char.expansion_por_defecto
        d.personajes = d.personajes.map(p => p.nombre === charName
          ? { ...p, expansion_por_defecto: newExp, tareas: p.tareas.map(t => t.expansion === oldExp ? { ...t, expansion: newExp } : t) }
          : p)
        saveData(d)
        return { ...d }
      })
    },
    moveCharToWarband(charName: string, newWarband: string): boolean {
      let ok = true
      update(d => {
        const char = d.personajes.find(p => p.nombre === charName)
        if (!char || char.warband === newWarband) { ok = false; return d }
        if (newWarband !== 'nada') {
          const targetWb = d.warbands.find(w => w.nombre === newWarband)
          if (targetWb && targetWb.personajes.length >= 4) { ok = false; return d }
        }
        const oldWarband = char.warband
        d.personajes = d.personajes.map(p => p.nombre === charName ? { ...p, warband: newWarband } : p)
        d.warbands = d.warbands
          .map(w => w.nombre === oldWarband
            ? { ...w, personajes: w.personajes.filter(n => n !== charName) }
            : w)
          .map(w => w.nombre === newWarband && !w.personajes.includes(charName)
            ? { ...w, personajes: [...w.personajes, charName] }
            : w)
        const hasNewWb = d.warbands.some(w => w.nombre === newWarband)
        if (!hasNewWb) {
          d.warbands = [...d.warbands, { nombre: newWarband, personajes: [charName] }]
        }
        d._meta.total_personajes = d.personajes.length
        d._meta.total_activos = d.personajes.filter(p => p.planeado_usar).length
        saveData(d)
        return { ...d }
      })
      return ok
    },
    addWarband(name: string) {
      update(d => {
        if (d.warbands.find(w => w.nombre === name)) return d
        const orden = d.warbands.filter(w => w.nombre !== 'nada').length
        d.warbands = [...d.warbands, { nombre: name, personajes: [], orden }]
        saveData(d)
        return { ...d }
      })
    },
    reorderWarbands(orderedNames: string[]) {
      update(d => {
        const max = orderedNames.length
        d.warbands = d.warbands.map(w => {
          const idx = orderedNames.indexOf(w.nombre)
          return { ...w, orden: idx >= 0 ? idx : (w.nombre === 'nada' ? max : (w.orden ?? 0)) }
        })
        saveData(d)
        return { ...d }
      })
    },
    renameWarband(oldName: string, newName: string) {
      update(d => {
        const wb = d.warbands.find(w => w.nombre === oldName)
        if (!wb || d.warbands.find(w => w.nombre === newName)) return d
        d.warbands = d.warbands.map(w => w.nombre === oldName ? { ...w, nombre: newName } : w)
        d.personajes = d.personajes.map(p => p.warband === oldName ? { ...p, warband: newName } : p)
        saveData(d)
        return { ...d }
      })
    },
    deleteWarband(name: string) {
      update(d => {
        const exists = d.warbands.some(w => w.nombre === name)
        if (!exists) return d
        d.warbands = d.warbands
          .filter(w => w.nombre !== name)
          .map(w => w.nombre === 'nada'
            ? { ...w, personajes: d.personajes.filter(p => p.warband === 'nada').map(p => p.nombre) }
            : w)
        d.personajes = d.personajes.map(p => p.warband === name ? { ...p, warband: 'nada' } : p)
        const hasNada = d.warbands.some(w => w.nombre === 'nada')
        if (!hasNada && d.personajes.some(p => p.warband === 'nada')) {
          d.warbands = [...d.warbands, { nombre: 'nada', personajes: d.personajes.filter(p => p.warband === 'nada').map(p => p.nombre) }]
        }
        d._meta.total_personajes = d.personajes.length
        d._meta.total_activos = d.personajes.filter(p => p.planeado_usar).length
        saveData(d)
        return { ...d }
      })
    },
    importJSON(jsonStr: string) {
      update(d => {
        const result = importSectionsFn(jsonStr, d)
        set(result)
        saveData(result)
        return result
      })
    },
    exportSections(sections: ExportSection[]): string {
      return exportSectionsFn(get({ subscribe }), sections)
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
      normalizeData(data)
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
    exportCSV(): string {
      return exportCSVFn(get({ subscribe }))
    },
    importCSVToRoster(csv: string) {
      const newPersonajes = importCSVFn(csv)
      if (newPersonajes.length === 0) throw new Error('CSV sin personajes válidos')
      update(d => {
        d.personajes = [...d.personajes, ...newPersonajes]
        for (const p of newPersonajes) {
          const wb = p.warband || 'nada'
          if (wb === 'nada') continue
          const wbExists = d.warbands.some(w => w.nombre === wb)
          if (!wbExists) {
            d.warbands = [...d.warbands, { nombre: wb, personajes: [p.nombre] }]
          } else {
            d.warbands = d.warbands.map(w => w.nombre === wb && !w.personajes.includes(p.nombre)
              ? { ...w, personajes: [...w.personajes, p.nombre] }
              : w)
          }
        }
        d._meta.total_personajes = d.personajes.length
        d._meta.total_activos = d.personajes.filter(p => p.planeado_usar).length
        saveData(d)
        return { ...d }
      })
    },
    updateProfesionRol(nombre: string, profId: string, newRol: 'main' | 'cd' | undefined) {
      update(d => {
        const idx = d.personajes.findIndex(p => p.nombre === nombre)
        if (idx === -1) return d
        const slots = d.personajes[idx].profesiones ?? []
        const slotIdx = slots.findIndex(s => s.id === profId)
        if (slotIdx === -1) return d

        let newPersonajes = [...d.personajes]

        if (newRol === 'main') {
          newPersonajes = newPersonajes.map(c => ({
            ...c,
            profesiones: (c.profesiones ?? []).map(s =>
              s.id === profId && s.rol === 'main' ? { ...s, rol: undefined } : s
            )
          }))
        } else if (newRol === 'cd') {
          const cdCount = newPersonajes.filter(c =>
            (c.profesiones ?? []).some(s => s.id === profId && s.rol === 'cd')
          ).length
          if (cdCount >= 3) {
            for (let i = 0; i < newPersonajes.length; i++) {
              const cdSlot = (newPersonajes[i].profesiones ?? []).find(s => s.id === profId && s.rol === 'cd')
              if (cdSlot) {
                newPersonajes[i] = {
                  ...newPersonajes[i],
                  profesiones: (newPersonajes[i].profesiones ?? []).map(s =>
                    s.id === profId ? { ...s, rol: undefined } : s
                  )
                }
                break
              }
            }
          }
        }

        const targetIdx = newPersonajes.findIndex(c => c.nombre === nombre)
        newPersonajes[targetIdx] = {
          ...newPersonajes[targetIdx],
          profesiones: newPersonajes[targetIdx].profesiones?.map(s =>
            s.id === profId ? { ...s, rol: newRol } : s
          )
        }

        d = { ...d, personajes: newPersonajes }
        saveData(d)
        return d
      })
    },
    reorderProfesiones(orderedIds: string[]) {
      update(d => {
        d = { ...d, profesionOrden: orderedIds }
        saveData(d)
        return d
      })
    },
  }

  return store
}

export const dataStore = createDataStore()
export const statsStore = derived(dataStore, $data => computeStatsFn($data))
export const personajesStore = derived(dataStore, $data => $data.personajes)
export const warbandsStore = derived(dataStore, $data => $data.warbands)

