import { writable, get } from 'svelte/store'
import { supabase, supabaseConfigured } from '../supabaseClient'
import { dataStore } from './data'

const CONFIG_KEY = 'wowseg_supabase_config'
const LASTHASH_KEY = 'wowseg_supabase_lasthash'
const TABLE = 'wow_data'
const ROW_ID = 1

function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return 'h' + Math.abs(h).toString(36)
}

interface SupabaseSyncConfig {
  enabled: boolean
  intervalMinutes: number
  conflictStrategy: 'local-wins' | 'remote-wins' | 'newest'
}

interface SupabaseSyncState {
  config: SupabaseSyncConfig
  lastHash: string
  connected: boolean
  syncInFlight: boolean
  status: { text: string; tone: 'idle' | 'syncing' | 'ok' | 'error' }
}

function loadConfig(): SupabaseSyncConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* empty */ }
  return { enabled: false, intervalMinutes: 60, conflictStrategy: 'newest' }
}

function createSupabaseStore() {
  const { subscribe, update } = writable<SupabaseSyncState>({
    config: loadConfig(),
    lastHash: localStorage.getItem(LASTHASH_KEY) || '',
    connected: false,
    syncInFlight: false,
    status: { text: '', tone: 'idle' },
  })

  let syncTimer: ReturnType<typeof setTimeout> | null = null

  function persistConfig() {
    const state = get({ subscribe })
    localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config))
    localStorage.setItem(LASTHASH_KEY, state.lastHash)
  }

  async function fetchRemote(): Promise<{ blob: string; hash: string; updated_at: string } | null> {
    if (!supabaseConfigured) return null
    const { data, error } = await supabase
      .from(TABLE)
      .select('blob,hash,updated_at')
      .eq('id', ROW_ID)
      .maybeSingle()
    if (error) throw new Error(`select: ${error.message}`)
    return data ?? null
  }

  async function upsertRemote(blob: string, hash: string): Promise<void> {
    if (!supabaseConfigured) throw new Error('Supabase no configurado')
    const { error } = await supabase
      .from(TABLE)
      .upsert({ id: ROW_ID, blob, hash })
    if (error) throw new Error(`upsert: ${error.message}`)
  }

  async function doSync(forcePush = false) {
    const state = get({ subscribe })
    if (!supabaseConfigured) {
      update(s => ({ ...s, status: { text: 'Supabase sin configurar', tone: 'error' as const } }))
      return
    }
    if (!state.config.enabled || state.syncInFlight) { scheduleSync(); return }

    update(s => ({ ...s, syncInFlight: true, status: { text: 'Sincronizando...', tone: 'syncing' as const } }))

    try {
      const localStr = dataStore.exportJSON()
      const localHash = simpleHash(localStr)

      if (!forcePush && localHash === state.lastHash) {
        update(s => ({ ...s, syncInFlight: false, status: { text: 'Sin cambios', tone: 'ok' as const } }))
        scheduleSync()
        return
      }

      const remote = await fetchRemote()
      const remoteHash = remote?.hash ?? ''
      const remoteStr = remote ? JSON.stringify(remote.blob) : ''

      if (!remote || !remoteHash) {
        await upsertRemote(localStr, localHash)
        update(s => ({ ...s, lastHash: localHash, syncInFlight: false, status: { text: 'Subido OK', tone: 'ok' as const } }))
      } else if (localHash === remoteHash) {
        update(s => ({ ...s, lastHash: localHash, syncInFlight: false, status: { text: 'Sin cambios', tone: 'ok' as const } }))
      } else if (localHash === state.lastHash) {
        const parsed = typeof remote.blob === 'string' ? remote.blob : remoteStr
        dataStore.importJSON(parsed)
        const newHash = simpleHash(dataStore.exportJSON())
        update(s => ({ ...s, lastHash: newHash, syncInFlight: false, status: { text: 'Descargado OK', tone: 'ok' as const } }))
      } else {
        const strat = state.config.conflictStrategy
        if (strat === 'remote-wins') {
          const parsed = typeof remote.blob === 'string' ? remote.blob : remoteStr
          dataStore.importJSON(parsed)
          const newHash = simpleHash(dataStore.exportJSON())
          update(s => ({ ...s, lastHash: newHash, syncInFlight: false, status: { text: 'Remoto ganó', tone: 'ok' as const } }))
        } else if (strat === 'newest' && remote.updated_at) {
          const remoteNewer = new Date(remote.updated_at).getTime() > Date.now() - 60_000
          if (remoteNewer) {
            const parsed = typeof remote.blob === 'string' ? remote.blob : remoteStr
            dataStore.importJSON(parsed)
            const newHash = simpleHash(dataStore.exportJSON())
            update(s => ({ ...s, lastHash: newHash, syncInFlight: false, status: { text: 'Remoto más nuevo', tone: 'ok' as const } }))
          } else {
            await upsertRemote(localStr, localHash)
            update(s => ({ ...s, lastHash: localHash, syncInFlight: false, status: { text: 'Subido OK', tone: 'ok' as const } }))
          }
        } else {
          await upsertRemote(localStr, localHash)
          update(s => ({ ...s, lastHash: localHash, syncInFlight: false, status: { text: 'Local ganó', tone: 'ok' as const } }))
        }
      }
    } catch (e: any) {
      update(s => ({ ...s, syncInFlight: false, status: { text: 'Error: ' + (e?.message || 'desconocido'), tone: 'error' as const } }))
    }

    update(s => ({ ...s, syncInFlight: false }))
    persistConfig()
    scheduleSync()
  }

  function scheduleSync() {
    if (syncTimer) clearTimeout(syncTimer)
    const state = get({ subscribe })
    if (!state.config.enabled) return
    const ms = Math.max(30000, state.config.intervalMinutes * 60 * 1000)
    syncTimer = setTimeout(() => doSync(), ms)
  }

  function enable() {
    update(s => ({ ...s, config: { ...s.config, enabled: true }, connected: true }))
    persistConfig()
    doSync(true)
    update(s => ({ ...s, status: { text: 'Conectado', tone: 'ok' as const } }))
  }

  function disable() {
    if (syncTimer) clearTimeout(syncTimer)
    update(s => ({
      ...s,
      config: { ...s.config, enabled: false },
      connected: false,
      lastHash: '',
      status: { text: 'Desconectado', tone: 'idle' as const },
    }))
    localStorage.removeItem(LASTHASH_KEY)
    persistConfig()
  }

  function setConfigUpdate(updates: Partial<SupabaseSyncConfig>) {
    update(s => {
      const newConfig = { ...s.config, ...updates }
      localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig))
      return { ...s, config: newConfig }
    })
  }

  return {
    subscribe,
    enable,
    disable,
    doSync,
    setConfigUpdate,
    get configured() { return supabaseConfigured },
  }
}

export const supabaseStore = createSupabaseStore()