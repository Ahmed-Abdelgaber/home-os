import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { checkAndSendNotifications, Env } from './logic'

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleSchedule(env))
  },
}

async function handleSchedule(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    console.error('Missing Supabase credentials')
    return
  }
  
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    console.error('Missing VAPID credentials')
    return
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
  const now = new Date()

  await checkAndSendNotifications(supabase, env, now)
}
