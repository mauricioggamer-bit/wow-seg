import { writable } from 'svelte/store'
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
  const { subscribe, set, update } = writable({
    theme: loadPref<ThemeType>('wowseg_theme', 'dark'),
    fontSize: loadPref<FontSizeType>('wowseg_fontsize', 'medium'),
  })

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
      let theme: ThemeType = 'dark'
      this.subscribe(s => theme = s.theme)()
      this.setTheme(theme === 'dark' ? 'light' : 'dark')
    },
    init() {
      let prefs = { theme: 'dark' as ThemeType, fontSize: 'medium' as FontSizeType }
      this.subscribe(s => prefs = s)()
      document.documentElement.setAttribute('data-theme', prefs.theme)
      document.documentElement.setAttribute('data-size', prefs.fontSize)
    },
  }
}

export const preferencesStore = createPreferencesStore()
