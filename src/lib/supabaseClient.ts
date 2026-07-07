import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  console.warn('[supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env.local')
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const supabaseConfigured = !!(url && key)