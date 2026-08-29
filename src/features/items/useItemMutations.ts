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
    },
  })
}

/** Stocked → Active per docs/02 §3 `start_item` RPC — start date defaults to current Cairo date. */
export function useStartItem() {
  return useItemLifecycleMutation('start_item')
}

/** Active → Finished per docs/02 §3 `finish_item` RPC — finish date defaults to current Cairo date. */
export function useFinishItem() {
  return useItemLifecycleMutation('finish_item')
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
