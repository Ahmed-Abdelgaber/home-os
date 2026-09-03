import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import type { ShoppingListSource } from './shoppingListTypes'

interface AddToShoppingListInput {
  productId: string
  source?: ShoppingListSource
}

export function useAddToShoppingList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, source = 'manual' }: AddToShoppingListInput) => {
      const { error } = await supabase.from('shopping_list_items').upsert(
        {
          product_id: productId,
          source,
        },
        { onConflict: 'product_id', ignoreDuplicates: true },
      )
      if (error) {
        // If table doesn't exist yet, do not throw in unmigrated environment
        if (error.code === '42P01' || error.message?.includes('does not exist')) return
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}

export function useRemoveFromShoppingList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shopping_list_items').delete().eq('id', id)
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) return
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}

export function useRemoveProductFromShoppingList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from('shopping_list_items').delete().eq('product_id', productId)
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) return
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}
