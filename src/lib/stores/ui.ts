import { writable, derived } from 'svelte/store'
import type { ViewType } from '../types'
import { dataStore } from './data'

const VIEW_STORAGE_KEY = 'wowseg_current_view'
const WARBAND_STORAGE_KEY = 'wowseg_current_warband'
const VALID_VIEWS: ViewType[] = ['warband', 'tareas', 'tasks', 'personajes', 'mapa', 'fantasia', 'profesion', 'keybinds', 'leveling', 'warband-manager', 'estrategia', 'opie']

function loadStoredView(): ViewType {
  try {
    const raw = sessionStorage.getItem(VIEW_STORAGE_KEY)
    if (raw && (VALID_VIEWS as string[]).includes(raw)) return raw as ViewType
  } catch { /* empty */ }
  return 'warband'
}

function loadStoredWarband(): string | null {
  try {
    return localStorage.getItem(WARBAND_STORAGE_KEY)
  } catch { /* empty */ }
  return null
}

interface Filters {
  clase: string[]
  faccion: string
  reino: string
  soloActivos: boolean
  expansion: string
  cooldown: string
  prioridad: number
  tiempoRange: string
  searchText: string
}

function createUiStore() {
  const defaultFilters: Filters = {
    clase: [],
    faccion: '',
    reino: '',
    soloActivos: true,
    expansion: '',
    cooldown: '',
    prioridad: 0,
    tiempoRange: '',
    searchText: '',
  }

  const { subscribe, set, update } = writable({
    currentView: loadStoredView(),
    currentWarband: loadStoredWarband(),
    warbandInitialized: false,
    selectedCharacter: null as string | null,
    showDetailPanel: false,
    showAuthModal: false,
    showImportExportModal: false,
    showGistModal: false,
    showWarbandModal: false,
    showMissionModal: false,
    activeModal: null as string | null,
    filters: defaultFilters as Filters,
    statusMessage: { text: '', tone: 'idle' as 'idle' | 'syncing' | 'ok' | 'error' },
    toast: '',
  })

  return {
    subscribe,
    setView(view: ViewType) {
      try { sessionStorage.setItem(VIEW_STORAGE_KEY, view) } catch { /* empty */ }
      update(s => ({ ...s, currentView: view, selectedCharacter: null, showDetailPanel: false }))
    },
    selectWarband(nombre: string | null) {
      try {
        if (nombre) localStorage.setItem(WARBAND_STORAGE_KEY, nombre)
        else localStorage.removeItem(WARBAND_STORAGE_KEY)
      } catch { /* empty */ }
      update(s => ({ ...s, currentWarband: nombre, warbandInitialized: true, selectedCharacter: null, showDetailPanel: false }))
    },
    selectCharacter(nombre: string | null) {
      update(s => ({ ...s, selectedCharacter: nombre, showDetailPanel: !!nombre }))
    },
    setFilter(key: keyof Filters, value: any) {
      update(s => ({ ...s, filters: { ...s.filters, [key]: value } }))
    },
    resetFilters() {
      update(s => ({ ...s, filters: defaultFilters }))
    },
    setStatus(text: string, tone: 'idle' | 'syncing' | 'ok' | 'error') {
      update(s => ({ ...s, statusMessage: { text, tone } }))
    },
    openModal(name: string) {
      update(s => ({ ...s, activeModal: name }))
    },
    closeModal() {
      update(s => ({ ...s, activeModal: null }))
    },
    setToast(msg: string) {
      update(s => ({ ...s, toast: msg }))
    },
  }
}

export const uiStore = createUiStore()
export const currentView = derived(uiStore, $u => $u.currentView)
export const currentWarband = derived(uiStore, $u => $u.currentWarband)
export const selectedCharacter = derived(uiStore, $u => $u.selectedCharacter)
export const filters = derived(uiStore, $u => $u.filters)
