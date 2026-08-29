import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface ExpenseInput {
  expenseDate: string
  amount: number
  description: string
  merchant: string | null
  categoryId: string
  scope: 'household' | 'personal'
  personId: string
  accountId: string
  notes: string | null
}

function toRow(input: ExpenseInput) {
  return {
    expense_date: input.expenseDate,
    amount: input.amount,
    description: input.description,
    merchant: input.merchant,
    category_id: input.categoryId,
    scope: input.scope,
    person_id: input.personId,
    account_id: input.accountId,
    notes: input.notes,
  }
}

/** Direct Expense create — may be edited/deleted freely per docs/01 §11 (no linked Item). */
export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ExpenseInput): Promise<{ id: string }> => {
      const { data, error } = await supabase.from('expenses').insert(toRow(input)).select('id').single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })
}

/** Editing is allowed for both Direct and Item-linked Expenses per docs/01 §12. */
export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ExpenseInput }) => {
      const { error } = await supabase.from('expenses').update(toRow(input)).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })
}

/** Direct Expense only — the DB FK (items.expense_id) blocks this for linked Expenses regardless of UI gating. */
export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })
}
