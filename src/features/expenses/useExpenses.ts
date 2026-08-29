import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import { formatShortDate } from '../../core/utils/cairoDate'

export interface ExpenseSummary {
  id: string
  title: string
  meta: string
  amount: string
}

// ponytail: flat cap instead of real pagination — revisit if a household's expense history outgrows this.
const LIST_LIMIT = 100

/** All Expenses (Direct and Item-linked), most recent first. */
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses', 'list'],
    queryFn: async (): Promise<ExpenseSummary[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, expense_date, amount, description, category:categories(name)')
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(LIST_LIMIT)
      if (error) throw error

      return (data ?? []).map((row) => {
        const category = row.category as unknown as { name: string } | null
        return {
          id: row.id,
          title: row.description,
          meta: `${category?.name ?? 'Uncategorized'} • ${formatShortDate(row.expense_date)}`,
          amount: `EGP ${Number(row.amount).toLocaleString('en-US')}`,
        }
      })
    },
  })
}
