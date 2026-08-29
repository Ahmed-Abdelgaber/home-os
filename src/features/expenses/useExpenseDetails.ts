import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface ExpenseDetail {
  id: string
  expenseDate: string
  amount: number
  description: string
  merchant: string | null
  categoryId: string
  scope: 'household' | 'personal'
  personId: string
  accountId: string
  notes: string | null
  /** Set when this Expense was created by purchase_product — direct delete is blocked per docs/01 §11. */
  linkedItemId: string | null
}

export function useExpense(expenseId: string | undefined) {
  return useQuery({
    queryKey: ['expenses', 'detail', expenseId],
    enabled: Boolean(expenseId),
    queryFn: async (): Promise<ExpenseDetail> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, expense_date, amount, description, merchant, category_id, scope, person_id, account_id, notes, items(id)')
        .eq('id', expenseId as string)
        .single()
      if (error) throw error

      const items = data.items as unknown as { id: string }[] | null

      return {
        id: data.id,
        expenseDate: data.expense_date,
        amount: Number(data.amount),
        description: data.description,
        merchant: data.merchant,
        categoryId: data.category_id,
        scope: data.scope,
        personId: data.person_id,
        accountId: data.account_id,
        notes: data.notes,
        linkedItemId: items && items.length > 0 ? items[0].id : null,
      }
    },
  })
}
