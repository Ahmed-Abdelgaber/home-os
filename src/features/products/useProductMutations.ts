import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import type { ConsumptionMode } from './consumptionMode'

export interface ProductInput {
  name: string
  categoryId: string
  consumerId: string
  consumptionMode: ConsumptionMode
  notes: string | null
}

function toRow(input: ProductInput) {
  return {
    name: input.name,
    category_id: input.categoryId,
    consumer_id: input.consumerId,
    consumption_mode: input.consumptionMode,
    notes: input.notes,
  }
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProductInput): Promise<{ id: string }> => {
      const { data, error } = await supabase.from('products').insert(toRow(input)).select('id').single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProductInput }) => {
      const { error } = await supabase.from('products').update(toRow(input)).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/** Products cannot be deleted per docs/01 §1 — is_active is the archive mechanism instead. */
export function useSetProductActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
