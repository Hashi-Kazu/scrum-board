import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn(
    '[Supabase] 環境変数が未設定です。.env.local に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。'
  )
}

export const supabase = createClient(url ?? '', key ?? '')
