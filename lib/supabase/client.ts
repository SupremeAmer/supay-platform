// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { config } from '@/lib/supabase/config'

export function createClient() {
  return createBrowserClient(
    config.supabaseUrl,
    config.supabaseAnonKey
  )
}
