import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase'

let client = null

export function initSupabase() {
  if (client) return client
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.warn('⚠️ 请先在 src/config/supabase.js 中配置 Supabase 项目信息')
    return null
  }
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}

export default client
