const PREFIX = 'wowseg_sp_'

export function getSessionPref(key: string, fallback = false): boolean {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (raw !== null) return raw === 'true'
  } catch { /* empty */ }
  return fallback
}

export function setSessionPref(key: string, value: boolean) {
  try {
    sessionStorage.setItem(PREFIX + key, String(value))
  } catch { /* empty */ }
}
