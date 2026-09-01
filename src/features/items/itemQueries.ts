import { supabase } from '../../core/supabase/client'
import { cairoDateMinusDays, cairoToday, formatShortDate } from '../../core/utils/cairoDate'

export interface ItemSummary {
  id: string
  title: string
  meta: string
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00Z`)
  const to = new Date(`${toDateStr}T00:00:00Z`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/** Active Items oldest-first, using item_usage_metrics for calendar_days per docs/02 §2. */
export async function fetchActiveItems(limit?: number): Promise<ItemSummary[]> {
  let query = supabase
    .from('items')
    .select('id, product:products(name)')
    .eq('status', 'active')
    .order('started_date', { ascending: true })
  if (limit) query = query.limit(limit)

  const { data: items, error } = await query
  if (error) throw error
  if (!items || items.length === 0) return []

  const ids = items.map((item) => item.id)
  const { data: metrics, error: metricsError } = await supabase
    .from('item_usage_metrics')
    .select('item_id, calendar_days')
    .in('item_id', ids)
  if (metricsError) throw metricsError

  const daysById = new Map((metrics ?? []).map((m) => [m.item_id, m.calendar_days as number]))

  return items.map((item) => {
    const product = item.product as unknown as { name: string } | null
    const days = daysById.get(item.id)
    return {
      id: item.id,
      title: product?.name ?? 'Unknown product',
      meta: days != null ? `Active for ${days} day${days === 1 ? '' : 's'}` : 'Active',
    }
  })
}

/** Stocked Items purchased >= 30 days ago, oldest-first — purchase date comes from the linked Expense. */
export async function fetchLongStockedItems(limit?: number): Promise<ItemSummary[]> {
  const { data: items, error } = await supabase
    .from('items')
    .select('id, product:products(name), expense:expenses(expense_date)')
    .eq('status', 'stocked')
  if (error) throw error

  const cutoff = cairoDateMinusDays(30)
  const today = cairoToday()

  const eligible = (items ?? [])
    .map((item) => {
      const product = item.product as unknown as { name: string } | null
      const expense = item.expense as unknown as { expense_date: string } | null
      return { id: item.id, title: product?.name ?? 'Unknown product', purchaseDate: expense?.expense_date }
    })
    .filter((item): item is { id: string; title: string; purchaseDate: string } => Boolean(item.purchaseDate) && item.purchaseDate! <= cutoff)
    .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))

  const limited = limit ? eligible.slice(0, limit) : eligible

  return limited.map((item) => ({
    id: item.id,
    title: item.title,
    meta: `Stocked for ${daysBetween(item.purchaseDate, today)} days`,
  }))
}

/** All Stocked Items, newest purchase first — for the Items tab Stocked view. */
export async function fetchAllStockedItems(): Promise<ItemSummary[]> {
  const { data: items, error } = await supabase
    .from('items')
    .select('id, product:products(name), expense:expenses(expense_date)')
    .eq('status', 'stocked')
  if (error) throw error

  const today = cairoToday()

  return (items ?? [])
    .map((item) => {
      const product = item.product as unknown as { name: string } | null
      const expense = item.expense as unknown as { expense_date: string } | null
      const purchaseDate = expense?.expense_date
      return {
        id: item.id,
        title: product?.name ?? 'Unknown product',
        meta: purchaseDate ? `Stocked for ${daysBetween(purchaseDate, today)} days` : 'Stocked',
        purchaseDate: purchaseDate ?? '',
      }
    })
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
    .map(({ purchaseDate: _purchaseDate, ...item }) => item)
}

/** Finished Items, most recently finished first — for the Items tab Finished view. */
export async function fetchFinishedItems(): Promise<ItemSummary[]> {
  const { data: items, error } = await supabase
    .from('items')
    .select('id, started_date, finished_date, product:products(name)')
    .eq('status', 'finished')
    .order('finished_date', { ascending: false })
  if (error) throw error

  return (items ?? []).map((item) => {
    const product = item.product as unknown as { name: string } | null
    const started = item.started_date as string
    const finished = item.finished_date as string
    return {
      id: item.id,
      title: product?.name ?? 'Unknown product',
      meta: `${formatShortDate(started)} → ${formatShortDate(finished)} • ${daysBetween(started, finished) + 1} days`,
    }
  })
}
