import { writable } from 'svelte/store'
import type { AuthDuration } from '../types'

const STORAGE_KEY = 'wowseg_session'
const DURATIONS: Record<AuthDuration, number | null> = {
  '10min': 10 * 60 * 1000,
  '1hora': 60 * 60 * 1000,
  '8horas': 8 * 60 * 60 * 1000,
  '1semana': 7 * 24 * 60 * 60 * 1000,
  'siempre': null,
}

function getToday(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Argentina/Cordoba',
    day: 'numeric',
  })
}

function hasValidSession(): boolean {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session) return false
    if (session.expires === null) return true
    return Date.now() < session.expires
  } catch {
    return false
  }
}

function createAuthStore() {
  const { subscribe, set } = writable({
    authenticated: hasValidSession(),
    durations: DURATIONS,
  })

  return {
    subscribe,
    verifyPassword(input: string): boolean {
      return input === 'gusfraba' + getToday()
    },
    login(duration: AuthDuration) {
      const expires = DURATIONS[duration] === null ? null : Date.now() + DURATIONS[duration]!
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ expires }))
      set({ authenticated: true, durations: DURATIONS })
    },
    logout() {
      localStorage.removeItem(STORAGE_KEY)
      set({ authenticated: false, durations: DURATIONS })
    },
    checkSession(): boolean {
      const valid = hasValidSession()
      set({ authenticated: valid, durations: DURATIONS })
      return valid
    },
  }
}

export const authStore = createAuthStore()
