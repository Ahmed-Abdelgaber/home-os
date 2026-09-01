import { useQuery } from '@tanstack/react-query'
import { airplaneOutline, bagHandleOutline, cardOutline } from 'ionicons/icons'
import { supabase } from '../../core/supabase/client'
import { formatActivityTimestamp } from '../../core/utils/cairoDate'
import type { RowTone } from '../../shared/components/Row'

export interface RecentActivityEntry {
  id: string
  icon: string
  tone: RowTone
  label: string
  timestamp: string
  /** The record this entry describes. Every activity row is a link to its source. */
  href: string
}

const FETCH_LIMIT = 10

/** How many entries Home shows before "View all" reveals the rest (docs/06 §5). */
export const RECENT_ACTIVITY_PREVIEW_COUNT = 6

/**
 * Mixed timeline per docs/06_HOME_SCREEN_SPEC.md §5 — composed from row creation timestamps only
 * (Bought/Expense/Trip added). Start/Finish Item events are intentionally omitted: items.started_date
 * and finished_date are `date` columns with no timestamp, so a precise time can't be shown honestly.
 */
export function useRecentActivity() {
  return useQuery({
    queryKey: ['home', 'recent-activity'],
    queryFn: async (): Promise<RecentActivityEntry[]> => {
      const [itemsRes, expensesRes, tripsRes] = await Promise.all([
        supabase
          .from('items')
          .select('id, created_at, product:products(name)')
          .order('created_at', { ascending: false })
          .limit(FETCH_LIMIT),
        supabase
          .from('expenses')
          .select('id, created_at, description, merchant, amount, items(id)')
          .order('created_at', { ascending: false })
          .limit(FETCH_LIMIT),
        supabase.from('trips').select('id, created_at, name').order('created_at', { ascending: false }).limit(FETCH_LIMIT),
      ])
      if (itemsRes.error) throw itemsRes.error
      if (expensesRes.error) throw expensesRes.error
      if (tripsRes.error) throw tripsRes.error

      const bought = (itemsRes.data ?? []).map((item) => {
        const product = item.product as unknown as { name: string } | null
        return {
          id: `item-${item.id}`,
          icon: bagHandleOutline,
          tone: 'success' as RowTone,
          label: `Bought ${product?.name ?? 'item'}`,
          timestamp: formatActivityTimestamp(item.created_at),
          href: `/app/items/${item.id}`,
          occurredAt: item.created_at,
        }
      })

      // Only direct Expenses (no linked Item) — a purchase's own Expense is already represented by "Bought X".
      const directExpenses = (expensesRes.data ?? [])
        .filter((expense) => !expense.items || (Array.isArray(expense.items) && expense.items.length === 0))
        .map((expense) => ({
          id: `expense-${expense.id}`,
          icon: cardOutline,
          tone: 'primary' as RowTone,
          label: `Expense • ${expense.merchant ?? expense.description} • EGP ${Number(expense.amount).toLocaleString('en-US')}`,
          timestamp: formatActivityTimestamp(expense.created_at),
          href: `/app/expenses/${expense.id}`,
          occurredAt: expense.created_at,
        }))

      const tripsAdded = (tripsRes.data ?? []).map((trip) => ({
        id: `trip-${trip.id}`,
        icon: airplaneOutline,
        tone: 'info' as RowTone,
        label: `Trip added • ${trip.name}`,
        timestamp: formatActivityTimestamp(trip.created_at),
        // Trips open straight into their edit form — there is no separate trip detail screen.
        href: `/app/trips/${trip.id}/edit`,
        occurredAt: trip.created_at,
      }))

      return [...bought, ...directExpenses, ...tripsAdded]
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .slice(0, FETCH_LIMIT)
        .map(({ occurredAt: _occurredAt, ...entry }) => entry)
    },
  })
}
