import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

function useItemLifecycleMutation(rpc: 'start_item' | 'finish_item') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.rpc(rpc, { p_item_id: itemId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}

/** Stocked → Active per docs/02 §3 `start_item` RPC — start date defaults to current Cairo date. */
export function useStartItem() {
  return useItemLifecycleMutation('start_item')
}

interface FinishItemInput {
  itemId: string
  finishedDate?: string
}

/** Active → Finished per docs/02 §3 `finish_item` RPC — supports optional custom finished_date. */
export function useFinishItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, finishedDate }: FinishItemInput) => {
      const { error } = await supabase.rpc('finish_item', {
        p_item_id: itemId,
        p_finished_date: finishedDate || null,
      })
      if (error) throw error

      // Client-side fallback for automatic shopping suggestion if no active/stocked item remains
      try {
        const { data: itemData } = await supabase.from('items').select('product_id').eq('id', itemId).single()
        if (itemData?.product_id) {
          const { count } = await supabase
            .from('items')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', itemData.product_id)
            .in('status', ['active', 'stocked'])
          if (!count || count === 0) {
            await supabase
              .from('shopping_list_items')
              .upsert({ product_id: itemData.product_id, source: 'automatic' }, { onConflict: 'product_id', ignoreDuplicates: true })
          }
        }
      } catch {
        // Table may not exist yet if migration has not been applied
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}

interface UpdateItemFinishedDateInput {
  itemId: string
  finishedDate: string
}

/** Updates ONLY finished_date for an already Finished Item per v2.1 specifications. */
export function useUpdateItemFinishedDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, finishedDate }: UpdateItemFinishedDateInput) => {
      const { error } = await supabase.rpc('update_item_finished_date', {
        p_item_id: itemId,
        p_finished_date: finishedDate,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/** Deleting an Item cascades to delete its linked Expense per docs/01 §11. */
export function useDeleteItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })
}
