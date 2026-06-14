import { writable, get } from 'svelte/store'
import type { ThemeType, FontSizeType } from '../types'

function loadPref<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key)
    return val !== null ? (val as unknown as T) : fallback
  } catch {
    return fallback
  }
}

function createPreferencesStore() {
  const store = writable({
    theme: loadPref<ThemeType>('wowseg_theme', 'dark'),
    fontSize: loadPref<FontSizeType>('wowseg_fontsize', 'medium'),
  })

  const { subscribe, update } = store

  return {
    subscribe,
    setTheme(theme: ThemeType) {
      localStorage.setItem('wowseg_theme', theme)
      update(s => ({ ...s, theme }))
      document.documentElement.setAttribute('data-theme', theme)
    },
    setFontSize(size: FontSizeType) {
      localStorage.setItem('wowseg_fontsize', size)
      update(s => ({ ...s, fontSize: size }))
      document.documentElement.setAttribute('data-size', size)
    },
    toggleTheme() {
      const current = get(store)
      this.setTheme(current.theme === 'dark' ? 'light' : 'dark')
    },
    init() {
      const prefs = get(store)
      document.documentElement.setAttribute('data-theme', prefs.theme)
      document.documentElement.setAttribute('data-size', prefs.fontSize)
    },
  }
}

export const preferencesStore = createPreferencesStore()
