import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import { formatShortDate } from '../../core/utils/cairoDate'
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

export interface ProductHistoryEntry {
  id: string
  label: string
}

/** Previous cycles for the same Product per docs/01 §13 — contextual history, not a top-level screen. */
export function useProductHistory(productId: string | undefined, excludeItemId: string | undefined) {
  return useQuery({
    queryKey: ['items', 'product-history', productId, excludeItemId],
    enabled: Boolean(productId),
    queryFn: async (): Promise<ProductHistoryEntry[]> => {
      let query = supabase
        .from('items')
        .select('id, started_date, finished_date, status')
        .eq('product_id', productId as string)
      if (excludeItemId) {
        query = query.neq('id', excludeItemId)
      }
      const { data, error } = await query.order('started_date', { ascending: false, nullsFirst: false }).limit(5)
      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id,
        label:
          row.status === 'stocked'
            ? 'Not started'
            : row.finished_date
              ? `${formatShortDate(row.started_date as string)} → ${formatShortDate(row.finished_date)}`
              : `${formatShortDate(row.started_date as string)} → In progress`,
      }))
    },
  })
}
