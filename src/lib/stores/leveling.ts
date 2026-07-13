import { writable, get } from 'svelte/store'
import type { LevelingConfig, CustomBuff } from '../types'

const STORAGE_KEY = 'wowseg_leveling_config'

const DEFAULT_CONFIG: LevelingConfig = {
  xpMonstruos: 112892,
  duracionDungeon: 18,
  warbandMentor080: 30,
  warMode: false,
  warModeTarget: 'both',
  customBuffs: [],
  objetivoSinTareas: 90,
  patronSemanal: { lunes: 1.5, martes: 1.5, miercoles: 1.5, jueves: 1.5, viernes: 1.5, sabado: 5, domingo: 5 },
}

function loadConfig(): LevelingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_CONFIG, ...parsed }
    }
  } catch { /* empty */ }
  return { ...DEFAULT_CONFIG }
}

function saveConfig(config: LevelingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch { /* empty */ }
}

function createLevelingStore() {
  const { subscribe, set, update } = writable<LevelingConfig>(loadConfig())

  return {
    subscribe,
    getConfig(): LevelingConfig {
      return get({ subscribe })
    },
    updateConfig(partial: Partial<LevelingConfig>) {
      update(c => {
        const next = { ...c, ...partial }
        saveConfig(next)
        return next
      })
    },
    setConfig(config: LevelingConfig) {
      saveConfig(config)
      set(config)
    },
    addCustomBuff(buff: CustomBuff) {
      update(c => {
        const next = { ...c, customBuffs: [...c.customBuffs, buff] }
        saveConfig(next)
        return next
      })
    },
    updateCustomBuff(id: string, partial: Partial<CustomBuff>) {
      update(c => {
        const next = {
          ...c,
          customBuffs: c.customBuffs.map(b => b.id === id ? { ...b, ...partial } : b),
        }
        saveConfig(next)
        return next
      })
    },
    removeCustomBuff(id: string) {
      update(c => {
        const next = { ...c, customBuffs: c.customBuffs.filter(b => b.id !== id) }
        saveConfig(next)
        return next
      })
    },
    reset() {
      const config = { ...DEFAULT_CONFIG }
      saveConfig(config)
      set(config)
    },
  }
}

export const levelingStore = createLevelingStore()