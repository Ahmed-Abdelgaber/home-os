import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import type { ItemStatus } from '../../shared/components/StatusChip'

export interface ItemDetail {
  id: string
  status: ItemStatus
  startedDate: string | null
  finishedDate: string | null
  quantity: number
  notes: string | null
  productId: string
  productName: string
  expenseId: string | null
  expense: {
    amount: number
    merchant: string | null
    date: string
    account: string | null
    accountId: string | null
  } | null
  metrics: { calendarDays: number; awayDays: number; activeUsageDays: number } | null
}

export function useItem(itemId: string | undefined) {
  return useQuery({
    queryKey: ['items', 'detail', itemId],
    enabled: Boolean(itemId),
    queryFn: async (): Promise<ItemDetail> => {
      const { data: item, error } = await supabase
        .from('items')
        .select(
          'id, status, started_date, finished_date, quantity, notes, product_id, expense_id, product:products(name), expense:expenses(amount, merchant, expense_date, account_id, account:accounts(name))',
        )
        .eq('id', itemId as string)
        .single()
      if (error) throw error

      const { data: metrics } = await supabase
        .from('item_usage_metrics')
        .select('calendar_days, away_days, active_usage_days')
        .eq('item_id', itemId as string)
        .maybeSingle()

      const product = item.product as unknown as { name: string } | null
      const expense = item.expense as unknown as
        | {
            amount: number
            merchant: string | null
            expense_date: string
            account_id: string | null
            account: { name: string } | null
          }
        | null

      return {
        id: item.id,
        status: item.status,
        startedDate: item.started_date,
        finishedDate: item.finished_date,
        quantity: item.quantity,
        notes: item.notes,
        productId: item.product_id,
        productName: product?.name ?? 'Unknown product',
        expenseId: item.expense_id ?? null,
        expense: expense
          ? {
              amount: Number(expense.amount),
              merchant: expense.merchant,
              date: expense.expense_date,
              account: expense.account?.name ?? null,
              accountId: expense.account_id ?? null,
            }
          : null,
        metrics: metrics
          ? { calendarDays: metrics.calendar_days, awayDays: metrics.away_days, activeUsageDays: metrics.active_usage_days }
          : null,
      }
    },
  })
}

export interface ProductHistoryItem {
  id: string
  status: ItemStatus
  startedDate: string | null
  finishedDate: string | null
  quantity: number
  metrics: {
    activeUsageDays: number
    calendarDays: number
    awayDays: number
  } | null
  expense: {
    amount: number
    merchant: string | null
    date: string
  } | null
}

/** Calculates typical/average active usage days from finished cycles (minimum 2 finished cycles required). */
export function calculateTypicalUsage(items: ProductHistoryItem[]): number | null {
  const finishedCycles = items.filter(
    (i) => i.status === 'finished' && i.metrics != null && i.metrics.activeUsageDays > 0,
  )
  if (finishedCycles.length < 2) return null
  const totalDays = finishedCycles.reduce((sum, c) => sum + (c.metrics?.activeUsageDays ?? 0), 0)
  const avg = totalDays / finishedCycles.length
  return Math.round(avg * 10) / 10
}

/** Previous cycles for the same Product per docs/01 §13 — rich contextual history without N+1 queries. */
export function useProductHistory(productId: string | undefined, excludeItemId: string | undefined) {
  return useQuery({
    queryKey: ['items', 'product-history', productId, excludeItemId],
    enabled: Boolean(productId),
    queryFn: async (): Promise<ProductHistoryItem[]> => {
      let query = supabase
        .from('items')
        .select(`
          id,
          status,
          started_date,
          finished_date,
          quantity,
          expense:expenses (
            amount,
            merchant,
            expense_date
          )
        `)
        .eq('product_id', productId as string)
      if (excludeItemId) {
        query = query.neq('id', excludeItemId)
      }
      const { data: items, error } = await query
        .order('started_date', { ascending: false, nullsFirst: false })
        .limit(10)
      if (error) throw error
      if (!items || items.length === 0) return []

      const ids = items.map((i) => i.id)
      const { data: metricsData } = await supabase
        .from('item_usage_metrics')
        .select('item_id, active_usage_days, calendar_days, away_days')
        .in('item_id', ids)

      const metricsMap = new Map(
        (metricsData ?? []).map((m) => [
          m.item_id,
          {
            activeUsageDays: Number(m.active_usage_days ?? 0),
            calendarDays: Number(m.calendar_days ?? 0),
            awayDays: Number(m.away_days ?? 0),
          },
        ]),
      )

      return items.map((row) => {
        const expense = row.expense as unknown as {
          amount: number
          merchant: string | null
          expense_date: string
        } | null
        const metrics = metricsMap.get(row.id) ?? null

        return {
          id: row.id,
          status: row.status as ItemStatus,
          startedDate: row.started_date,
          finishedDate: row.finished_date,
          quantity: Number(row.quantity ?? 1),
          metrics,
          expense: expense
            ? {
                amount: Number(expense.amount),
                merchant: expense.merchant,
                date: expense.expense_date,
              }
            : null,
        }
      })
    },
  })
}
