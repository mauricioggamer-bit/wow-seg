import { writable, get } from 'svelte/store'
import type { GistConfig } from '../types'
import { dataStore } from './data'

const CONFIG_KEY = 'wowseg_gist_config'
const TOKEN_KEY = 'wowseg_gist_token'
const GIST_API = 'https://api.github.com/gists'
const DEFAULT_FILENAME = 'wowseg-data.json'

function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return 'h' + Math.abs(h).toString(36)
}

interface GistState {
  config: GistConfig
  lastHash: string
  connected: boolean
  syncInFlight: boolean
  status: { text: string; tone: 'idle' | 'syncing' | 'ok' | 'error' }
}

function createGistStore() {
  const { subscribe, update } = writable<GistState>({
    config: loadConfig(),
    lastHash: localStorage.getItem('wowseg_gist_lasthash') || '',
    connected: false,
    syncInFlight: false,
    status: { text: '', tone: 'idle' },
  })

  let syncTimer: ReturnType<typeof setTimeout> | null = null

  function loadConfig(): GistConfig {
    try {
      const raw = localStorage.getItem(CONFIG_KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* empty */ }
    return { enabled: false, gistId: '', fileName: DEFAULT_FILENAME, intervalMinutes: 60, rememberToken: false }
  }

  function getTokenFromStorage(): string {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''
  }

  function persistConfig() {
    const state = get({ subscribe })
    localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config))
    localStorage.setItem('wowseg_gist_lasthash', state.lastHash)
  }

  async function doSync(forcePush = false) {
    const state = get({ subscribe })
    const token = getTokenFromStorage()
    if (!token || !state.config.gistId || state.syncInFlight) return

    update(s => ({ ...s, syncInFlight: true, status: { text: 'Sincronizando...', tone: 'syncing' as const } }))

    try {
      const localStr = dataStore.exportJSON()
      const localHash = simpleHash(localStr)

      if (!forcePush && localHash === state.lastHash) {
        update(s => ({ ...s, syncInFlight: false, status: { text: 'Sin cambios', tone: 'ok' as const } }))
        scheduleSync()
        return
      }

      const res = await fetch(`${GIST_API}/${state.config.gistId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      const remote = await res.json()
      const remoteStr = remote?.files?.[state.config.fileName]?.content || ''
      const remoteHash = remoteStr ? simpleHash(remoteStr) : ''

      if (!remoteHash || localHash === remoteHash) {
        if (localHash !== state.lastHash) {
          const upRes = await fetch(`${GIST_API}/${state.config.gistId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: { [state.config.fileName]: { content: localStr } } }),
          })
          if (!upRes.ok) throw new Error(`HTTP ${upRes.status}: ${await upRes.text()}`)
          update(s => ({ ...s, lastHash: localHash, syncInFlight: false, status: { text: 'Subido OK', tone: 'ok' as const } }))
        } else {
          update(s => ({ ...s, syncInFlight: false, status: { text: 'Sin cambios', tone: 'ok' as const } }))
        }
      } else if (localHash === state.lastHash) {
        dataStore.importJSON(remoteStr)
        const newHash = simpleHash(dataStore.exportJSON())
        update(s => ({ ...s, lastHash: newHash, syncInFlight: false, status: { text: 'Descargado OK', tone: 'ok' as const } }))
      } else {
        const upRes = await fetch(`${GIST_API}/${state.config.gistId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: { [state.config.fileName]: { content: localStr } } }),
        })
        if (!upRes.ok) throw new Error(`HTTP ${upRes.status}: ${await upRes.text()}`)
        update(s => ({ ...s, lastHash: localHash, syncInFlight: false, status: { text: 'Subido OK', tone: 'ok' as const } }))
      }
    } catch (e: any) {
      if (e.message?.includes('401') || e.message?.includes('403')) {
        disconnect()
        update(s => ({ ...s, status: { text: 'Token inválido — reconectá', tone: 'error' as const } }))
      } else {
        update(s => ({ ...s, status: { text: 'Error: ' + e.message, tone: 'error' as const } }))
      }
    }

    update(s => ({ ...s, syncInFlight: false }))
    scheduleSync()
  }

  function scheduleSync() {
    if (syncTimer) clearTimeout(syncTimer)
    const state = get({ subscribe })
    if (!state.config.enabled || !state.config.gistId) return
    const ms = Math.max(30000, state.config.intervalMinutes * 60 * 1000)
    syncTimer = setTimeout(() => doSync(), ms)
  }

  function disconnect() {
    if (syncTimer) clearTimeout(syncTimer)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('wowseg_gist_lasthash')
    sessionStorage.removeItem(TOKEN_KEY)
    update(s => ({
      ...s,
      config: { ...s.config, enabled: false, gistId: '' },
      lastHash: '',
      connected: false,
      status: { text: 'Desconectado', tone: 'idle' as const },
    }))
    persistConfig()
  }

  function connect(gistId: string, token: string, fileName?: string) {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_KEY, token)
    update(s => ({
      ...s,
      config: { ...s.config, gistId, fileName: fileName || DEFAULT_FILENAME, enabled: true },
      connected: true,
    }))
    persistConfig()
    doSync(true)
    update(s => ({ ...s, status: { text: 'Conectado y sincronizado', tone: 'ok' as const } }))
  }

  async function createNewGist(token: string, fileName: string, content: string): Promise<string> {
    const res = await fetch(GIST_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ public: false, files: { [fileName]: { content } } }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    const gist = await res.json()
    return gist.id
  }

  function setToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_KEY, token)
  }

  function setConfigUpdate(updates: Partial<GistConfig>) {
    update(s => {
      const newConfig = { ...s.config, ...updates }
      localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig))
      return { ...s, config: newConfig }
    })
  }

  return {
    subscribe,
    connect,
    createNewGist,
    disconnect,
    doSync,
    setToken,
    setConfigUpdate,
    getToken: getTokenFromStorage,
  }
}

export const gistStore = createGistStore()
