import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface LatestPurchaseInfo {
  itemId: string
  quantity: number
  merchant: string | null
  accountId: string | null
  amount: number
  expenseDate: string
}

/**
 * Finds the most recent valid purchase of a Product per docs/01 §13 and Buy Again requirements.
 * Relational join: items.product_id -> products.id, items.expense_id -> expenses.id.
 * Orders deterministically by purchase transaction date (expense_date desc),
 * creation timestamp desc as tie-breaker, and item id desc as stable tie-breaker.
 */
export async function fetchLatestProductPurchase(productId: string): Promise<LatestPurchaseInfo | null> {
  const { data, error } = await supabase
    .from('items')
    .select(`
      id,
      quantity,
      created_at,
      expense:expenses (
        id,
        amount,
        merchant,
        account_id,
        expense_date,
        created_at
      )
    `)
    .eq('product_id', productId)

  if (error) throw error
  if (!data || data.length === 0) return null

  const valid = data
    .map((item) => {
      const expense = item.expense as unknown as {
        id: string
        amount: number
        merchant: string | null
        account_id: string | null
        expense_date: string
        created_at: string
      } | null
      return {
        id: item.id,
        quantity: item.quantity,
        createdAt: item.created_at,
        expense,
      }
    })
    .filter((item): item is {
      id: string
      quantity: number
      createdAt: string
      expense: NonNullable<typeof item.expense>
    } => item.expense != null && Boolean(item.expense.expense_date))

  if (valid.length === 0) return null

  valid.sort((a, b) => {
    const dateComp = b.expense.expense_date.localeCompare(a.expense.expense_date)
    if (dateComp !== 0) return dateComp
    const timeA = a.expense.created_at || a.createdAt || ''
    const timeB = b.expense.created_at || b.createdAt || ''
    const timeComp = timeB.localeCompare(timeA)
    if (timeComp !== 0) return timeComp
    return b.id.localeCompare(a.id)
  })

  const latest = valid[0]
  return {
    itemId: latest.id,
    quantity: Number(latest.quantity) > 0 ? Number(latest.quantity) : 1,
    merchant: latest.expense.merchant ?? null,
    accountId: latest.expense.account_id ?? null,
    amount: Number(latest.expense.amount),
    expenseDate: latest.expense.expense_date,
  }
}

export function useLatestProductPurchase(productId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'latest-purchase', productId],
    enabled: Boolean(productId),
    queryFn: () => fetchLatestProductPurchase(productId as string),
  })
}
