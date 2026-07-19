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

export function getSessionPrefStr(key: string, fallback = ''): string {
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (raw !== null) return raw
  } catch { /* empty */ }
  return fallback
}

export function setSessionPrefStr(key: string, value: string) {
  try {
    sessionStorage.setItem(PREFIX + key, value)
  } catch { /* empty */ }
}
