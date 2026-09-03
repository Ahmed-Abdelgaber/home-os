import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

interface PurchaseProductInput {
  productId: string
  purchaseDate: string
  amount: number
  merchant: string | null
  accountId: string
  quantity: number
  notes: string | null
  startNow: boolean
}

interface PurchaseProductResult {
  item_id: string
  expense_id: string
}

/** Atomic Expense+Item creation via the purchase_product RPC per docs/02 §3 — never split into separate client requests. */
export function usePurchaseProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PurchaseProductInput): Promise<PurchaseProductResult> => {
      const { data, error } = await supabase.rpc('purchase_product', {
        p_product_id: input.productId,
        p_purchase_date: input.purchaseDate,
        p_amount: input.amount,
        p_merchant: input.merchant,
        p_account_id: input.accountId,
        p_quantity: input.quantity,
        p_notes: input.notes,
        p_start_now: input.startNow,
      })
      if (error) throw error
      return data as PurchaseProductResult
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ])
    },
  })
}
