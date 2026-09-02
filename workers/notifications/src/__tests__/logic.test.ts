import { describe, it, expect, vi } from 'vitest'
import { checkAndSendNotifications, Env } from '../logic'
import { toZonedTime } from 'date-fns-tz'

// A mock Supabase client for testing logic without DB connection
function createMockSupabase(mockData: any) {
  const queryBuilder = (data: any[]) => {
    let filteredData = [...(data || [])]
    const builder: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gte: vi.fn((col: string, val: any) => {
        if (col === 'expense_date') {
          filteredData = filteredData.filter(d => d.expense_date >= val)
        }
        return builder
      }),
      lte: vi.fn((col: string, val: any) => {
        if (col === 'expense_date') {
          filteredData = filteredData.filter(d => d.expense_date <= val)
        }
        return builder
      }),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: filteredData[0] || null })),
      single: vi.fn().mockImplementation(() => Promise.resolve({ data: filteredData[0] })),
      then: (resolve: any) => resolve({ data: filteredData })
    }
    return builder
  }

  const notificationLogMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData.existingLog ? {} : null }),
    insert: vi.fn().mockResolvedValue({ data: {} })
  }

  return {
    from: vi.fn((table: string) => {
      if (table === 'notification_log') {
        return notificationLogMock
      }
      if (table === 'push_subscriptions') {
        return queryBuilder(mockData.subscriptions || [])
      }
      return queryBuilder(mockData[table] || [])
    })
  } as any
}

vi.mock('@block65/webcrypto-web-push', () => ({
  buildPushPayload: vi.fn().mockResolvedValue({
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: new Uint8Array()
  })
}))

// Mock global fetch for web-push
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  text: vi.fn().mockResolvedValue('OK')
})

describe('Notification Logic', () => {
  const env: Env = {
    SUPABASE_URL: 'test',
    SUPABASE_SECRET_KEY: 'test',
    VAPID_PUBLIC_KEY: 'test',
    VAPID_PRIVATE_KEY: 'test',
    VAPID_SUBJECT: 'test'
  }

  it('Period threshold evaluation - above threshold', async () => {
    const supabase = createMockSupabase({
      notification_settings: [{ user_id: 'u1', monthly_spend_limit: 1000 }],
      periods: [{ id: 'p1', start_date: '2024-10-10', is_active: true }],
      expenses: [{ amount: 500, expense_date: '2024-10-11' }, { amount: 600, expense_date: '2024-10-12' }], // 1100 total
      subscriptions: [{ id: 's1', user_id: 'u1', endpoint: 'url', p256dh: 'x', auth: 'y' }],
      existingLog: false
    })

    // Simulated time: 9:00 AM Cairo time
    const now = new Date('2024-10-15T06:00:00Z') // 9 AM in UTC+3 Cairo

    await checkAndSendNotifications(supabase, env, now)

    expect(global.fetch).toHaveBeenCalled()
    expect(supabase.from('notification_log').insert).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_type: 'spend_threshold',
        dedupe_key: '2024-10-10:active'
      })
    )
  })

  it('Period threshold evaluation - below threshold due to old expenses', async () => {
    vi.clearAllMocks()
    const supabase = createMockSupabase({
      notification_settings: [{ user_id: 'u1', monthly_spend_limit: 1000 }],
      periods: [{ id: 'p1', start_date: '2024-10-10', is_active: true }],
      // Old expense from Oct 9 should be filtered out
      expenses: [{ amount: 500, expense_date: '2024-10-11' }, { amount: 600, expense_date: '2024-10-09' }], // only 500 counts
      subscriptions: [{ id: 's1', user_id: 'u1', endpoint: 'url', p256dh: 'x', auth: 'y' }],
      existingLog: false
    })

    const now = new Date('2024-10-15T06:00:00Z')
    await checkAndSendNotifications(supabase, env, now)

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('Period threshold evaluation - below threshold', async () => {
    vi.clearAllMocks()
    const supabase = createMockSupabase({
      notification_settings: [{ user_id: 'u1', monthly_spend_limit: 1000 }],
      periods: [{ id: 'p1', start_date: '2024-10-10', is_active: true }],
      expenses: [{ amount: 500, expense_date: '2024-10-11' }, { amount: 400, expense_date: '2024-10-12' }], // 900 total
      subscriptions: [{ id: 's1', user_id: 'u1', endpoint: 'url', p256dh: 'x', auth: 'y' }],
      existingLog: false
    })

    const now = new Date('2024-10-15T06:00:00Z')
    await checkAndSendNotifications(supabase, env, now)

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('Trip starts tomorrow', async () => {
    vi.clearAllMocks()
    const supabase = createMockSupabase({
      notification_settings: [{ user_id: 'u1', trip_start_enabled: true }],
      trips: [{ id: 't1', name: 'Cairo Trip', departure_date: '2024-10-16', people: { name: 'John' } }],
      subscriptions: [{ id: 's1', user_id: 'u1', endpoint: 'url', p256dh: 'x', auth: 'y' }],
      existingLog: false
    })

    const now = new Date('2024-10-15T06:00:00Z')
    await checkAndSendNotifications(supabase, env, now)

    expect(global.fetch).toHaveBeenCalled()
    expect(supabase.from('notification_log').insert).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_type: 'trip_start',
        dedupe_key: 't1'
      })
    )
  })

  it('Long stocked exactly at threshold', async () => {
    vi.clearAllMocks()
    const supabase = createMockSupabase({
      notification_settings: [{ user_id: 'u1', long_stocked_enabled: true, long_stocked_days: 30 }],
      items: [{ id: 'i1', name: 'Soap', status: 'stocked', expenses: { expense_date: '2024-09-15' } }],
      subscriptions: [{ id: 's1', user_id: 'u1', endpoint: 'url', p256dh: 'x', auth: 'y' }],
      existingLog: false
    })

    // exactly 30 days after Sept 15 is Oct 15
    const now = new Date('2024-10-15T06:00:00Z')
    await checkAndSendNotifications(supabase, env, now)

    expect(global.fetch).toHaveBeenCalled()
    expect(supabase.from('notification_log').insert).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_type: 'long_stocked',
        dedupe_key: 'i1'
      })
    )
  })
})
