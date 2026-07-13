import { supabase, supabaseConfigured } from '../supabaseClient'
import { dataStore } from './data'

const TABLE = 'wow_data'
const ROW_ID = 1
const SYNC_INTERVAL_MS = 30000
const LASTHASH_KEY = 'wowseg_supabase_lasthash'

function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return 'h' + Math.abs(h).toString(36)
}

let lastHash = ''
let syncInFlight = false
let syncTimer: ReturnType<typeof setTimeout> | null = null

function persistHash() {
  try { localStorage.setItem(LASTHASH_KEY, lastHash) } catch { /* empty */ }
}

function loadHash(): string {
  try { return localStorage.getItem(LASTHASH_KEY) || '' } catch { return '' }
}

async function fetchRemote(): Promise<{ blob: any; hash: string; updated_at: string } | null> {
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

async function doSync() {
  if (!supabaseConfigured || syncInFlight) return
  syncInFlight = true

  try {
    const localStr = dataStore.exportJSON()
    const localHash = simpleHash(localStr)

    if (localHash === lastHash) {
      scheduleSync()
      return
    }

    const remote = await fetchRemote()
    const remoteHash = remote?.hash ?? ''

    if (!remote || !remoteHash) {
      await upsertRemote(localStr, localHash)
      lastHash = localHash
    } else if (localHash === remoteHash) {
      lastHash = localHash
    } else if (localHash === lastHash) {
      const remoteStr = typeof remote.blob === 'string' ? remote.blob : JSON.stringify(remote.blob)
      dataStore.importJSON(remoteStr)
      const newHash = simpleHash(dataStore.exportJSON())
      lastHash = newHash
    } else {
      if (remote.updated_at && new Date(remote.updated_at).getTime() > Date.now() - 60_000) {
        const remoteStr = typeof remote.blob === 'string' ? remote.blob : JSON.stringify(remote.blob)
        dataStore.importJSON(remoteStr)
        const newHash = simpleHash(dataStore.exportJSON())
        lastHash = newHash
      } else {
        await upsertRemote(localStr, localHash)
        lastHash = localHash
      }
    }
  } catch {
    // silent — no UI to notify
  }

  syncInFlight = false
  persistHash()
  scheduleSync()
}

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => doSync(), SYNC_INTERVAL_MS)
}

export function startSync(): void {
  if (!supabaseConfigured) return
  lastHash = loadHash()
  scheduleSync()
}

export function syncNow(): void {
  doSync()
}

export { supabaseConfigured }
