import { writable, derived } from 'svelte/store'
import type { ViewType } from '../types'
import { dataStore } from './data'

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
    currentView: 'warband' as ViewType,
    currentWarband: null as string | null,
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
  })

  return {
    subscribe,
    setView(view: ViewType) {
      update(s => ({ ...s, currentView: view, selectedCharacter: null, showDetailPanel: false }))
    },
    selectWarband(nombre: string | null) {
      update(s => ({ ...s, currentWarband: nombre, selectedCharacter: null, showDetailPanel: false }))
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
  }
}

export const uiStore = createUiStore()
export const currentView = derived(uiStore, $u => $u.currentView)
export const currentWarband = derived(uiStore, $u => $u.currentWarband)
export const selectedCharacter = derived(uiStore, $u => $u.selectedCharacter)
export const filters = derived(uiStore, $u => $u.filters)
