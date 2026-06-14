import type { WowData } from '../types'

const RESET_KEY = 'wowseg_last_reset'

export function checkWeeklyReset(data: WowData): boolean {
  const today = new Date()
  const dayName = today.toLocaleString('en-US', { weekday: 'long' }).toLowerCase()
  const lastReset = localStorage.getItem(RESET_KEY)
  const resetDay = data._meta.reset_weekly_dia || 'tuesday'

  if (dayName === resetDay) {
    const todayStr = today.toISOString().slice(0, 10)
    if (lastReset !== todayStr) {
      for (const p of data.personajes) {
        for (const t of p.tareas) {
          if (t.cooldown === 'weekly') {
            t.hecho = false
            t.ultimo_completado = null
          }
        }
      }
      data._meta.ultimo_reset_semanal = todayStr
      localStorage.setItem(RESET_KEY, todayStr)
      return true
    }
  }
  return false
}

export function resetDailyTasks(data: WowData): void {
  for (const p of data.personajes) {
    for (const t of p.tareas) {
      if (t.cooldown === 'daily') {
        t.hecho = false
        t.ultimo_completado = null
      }
    }
  }
}
