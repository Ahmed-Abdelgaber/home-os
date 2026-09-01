import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface ExpenseDetail {
  id: string
  expenseDate: string
  amount: number
  description: string
  merchant: string | null
  categoryId: string
  categoryName: string
  scope: 'household' | 'personal'
  personId: string
  personName: string
  accountId: string
  accountName: string
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
        .select('id, expense_date, amount, description, merchant, category_id, scope, person_id, account_id, notes, items(id), category:categories(name), person:people(name), account:accounts(name)')
        .eq('id', expenseId as string)
        .single()
      if (error) throw error

      const items = data.items as unknown as { id: string }[] | null
      const category = data.category as unknown as { name: string } | null
      const person = data.person as unknown as { name: string } | null
      const account = data.account as unknown as { name: string } | null

      return {
        id: data.id,
        expenseDate: data.expense_date,
        amount: Number(data.amount),
        description: data.description,
        merchant: data.merchant,
        categoryId: data.category_id,
        categoryName: category?.name ?? 'Unknown',
        scope: data.scope,
        personId: data.person_id,
        personName: person?.name ?? 'Unknown',
        accountId: data.account_id,
        accountName: account?.name ?? 'Unknown',
        notes: data.notes,
        linkedItemId: items && items.length > 0 ? items[0].id : null,
      }
    },
  })
}

