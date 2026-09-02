import { buildPushPayload } from '@block65/webcrypto-web-push'
import { SupabaseClient } from '@supabase/supabase-js'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { addDays, differenceInDays, startOfMonth, endOfMonth } from 'date-fns'

export interface Env {
  SUPABASE_URL: string
  SUPABASE_SECRET_KEY: string
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
}

type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

type NotificationSettings = {
  user_id: string
  spend_warning_enabled: boolean
  monthly_spend_limit: number | null
  trip_start_enabled: boolean
  trip_end_enabled: boolean
  long_stocked_enabled: boolean
  long_stocked_days: number
}

// Main entry point for logic
export async function checkAndSendNotifications(supabase: SupabaseClient, env: Env, now: Date) {
  const cairoTime = toZonedTime(now, 'Africa/Cairo')
  const currentHour = cairoTime.getHours()
  const todayDateStr = formatInTimeZone(cairoTime, 'Africa/Cairo', 'yyyy-MM-dd')
  const tomorrowDateStr = formatInTimeZone(addDays(cairoTime, 1), 'Africa/Cairo', 'yyyy-MM-dd')
  const currentMonthStr = formatInTimeZone(cairoTime, 'Africa/Cairo', 'yyyy-MM')

  // Monthly spend warning
  await checkSpendWarnings(supabase, env, cairoTime, currentMonthStr)

  // Daily checks (around 9 AM Cairo time)
  if (currentHour === 9) {
    await checkTripStarts(supabase, env, tomorrowDateStr)
    await checkTripEnds(supabase, env, tomorrowDateStr)
    await checkLongStockedItems(supabase, env, cairoTime)
  }
}

async function sendPushToUser(
  supabase: SupabaseClient,
  env: Env,
  userId: string,
  type: string,
  dedupeKey: string,
  payload: { title: string; body: string; type: string }
) {
  // Check dedupe first
  const { data: existingLog } = await supabase
    .from('notification_log')
    .select('id')
    .eq('user_id', userId)
    .eq('notification_type', type)
    .eq('dedupe_key', dedupeKey)
    .single()

  if (existingLog) return // already sent

  // Get active subscriptions
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return

  let sentCount = 0

  const vapid = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY
  }

  for (const sub of subs as PushSubscriptionRow[]) {
    try {
      const subscription = {
        endpoint: sub.endpoint,
        expirationTime: null,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }

      const requestInit = await buildPushPayload({ data: payload }, subscription, vapid)
      const res = await fetch(sub.endpoint, {
        method: requestInit.method,
        headers: requestInit.headers,
        body: requestInit.body.buffer as ArrayBuffer
      })

      if (!res.ok) {
        if (res.status === 404 || res.status === 410) {
          // subscription expired or invalid
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          const text = await res.text()
          console.error(`Push error: ${res.status} ${text}`)
          throw new Error(`Push failed with status: ${res.status}`)
        }
      } else {
        sentCount++
      }
    } catch (err: any) {
      console.error('Push error:', err)
      throw err
    }
  }

  // Log delivery if at least one succeeded
  if (sentCount > 0) {
    await supabase.from('notification_log').insert({
      user_id: userId,
      notification_type: type,
      dedupe_key: dedupeKey,
      sent_at: new Date().toISOString()
    })
  }
}

async function checkSpendWarnings(supabase: SupabaseClient, env: Env, cairoTime: Date, currentMonthStr: string) {
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('spend_warning_enabled', true)
    .not('monthly_spend_limit', 'is', null)
  
  if (!settings || settings.length === 0) { console.log("No settings"); return }

  const { data: activePeriod } = await supabase
    .from('periods')
    .select('id, start_date')
    .eq('is_active', true)
    .maybeSingle()
    
  if (!activePeriod) return

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('expense_date', activePeriod.start_date)

  if (!expenses) return

  const totalHouseholdSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const periodDedupeKey = `${activePeriod.start_date}:active`

  for (const s of settings as NotificationSettings[]) {
    if (s.monthly_spend_limit && totalHouseholdSpend >= s.monthly_spend_limit) {
      await sendPushToUser(supabase, env, s.user_id, 'spend_threshold', periodDedupeKey, {
        title: 'Spending warning',
        body: `Household spending reached EGP ${totalHouseholdSpend.toLocaleString('en-US')} and passed your EGP ${s.monthly_spend_limit.toLocaleString('en-US')} limit for this period.`,
        type: 'spend'
      })
    }
  }
}

async function checkTripStarts(supabase: SupabaseClient, env: Env, tomorrowDateStr: string) {
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('user_id')
    .eq('trip_start_enabled', true)
    
  if (!settings || settings.length === 0) { console.log("No settings"); return }

  // Need people to format the name
  const { data: trips } = await supabase
    .from('trips')
    .select('id, name, person_id, people (name)')
    .eq('departure_date', tomorrowDateStr)

  if (!trips) return

  for (const trip of trips) {
    for (const s of settings) {
      const personName = (trip.people as any)?.name ?? 'Household'
      await sendPushToUser(supabase, env, s.user_id, 'trip_start', trip.id, {
        title: 'Trip starts tomorrow ✈️',
        body: `${personName} • ${trip.name}`,
        type: 'trip'
      })
    }
  }
}

async function checkTripEnds(supabase: SupabaseClient, env: Env, tomorrowDateStr: string) {
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('user_id')
    .eq('trip_end_enabled', true)
    
  if (!settings || settings.length === 0) { console.log("No settings"); return }

  const { data: trips } = await supabase
    .from('trips')
    .select('id, name, person_id, people (name)')
    .eq('return_date', tomorrowDateStr)

  if (!trips) return

  for (const trip of trips) {
    for (const s of settings) {
      const personName = (trip.people as any)?.name ?? 'Household'
      await sendPushToUser(supabase, env, s.user_id, 'trip_end', trip.id, {
        title: 'Back home tomorrow 🏠',
        body: `${trip.name} trip ends tomorrow.`,
        type: 'trip'
      })
    }
  }
}

async function checkLongStockedItems(supabase: SupabaseClient, env: Env, cairoTime: Date) {
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('user_id, long_stocked_days')
    .eq('long_stocked_enabled', true)
    
  if (!settings || settings.length === 0) { console.log("No settings"); return }

  // Items joined with expenses
  const { data: items } = await supabase
    .from('items')
    .select('id, name, status, expense_id, expenses(expense_date)')
    .eq('status', 'stocked')

  if (!items) return

  for (const item of items) {
    const expenseDateStr = (item.expenses as any)?.expense_date
    if (!expenseDateStr) continue

    const expenseDate = toZonedTime(new Date(expenseDateStr), 'Africa/Cairo')
    const diffDays = differenceInDays(cairoTime, expenseDate)

    for (const s of settings as NotificationSettings[]) {
      if (diffDays >= s.long_stocked_days) {
        await sendPushToUser(supabase, env, s.user_id, 'long_stocked', item.id, {
          title: 'Still in stock 📦',
          body: `${item.name} has been stocked for ${diffDays} days.`,
          type: 'long_stocked'
        })
      }
    }
  }
}
