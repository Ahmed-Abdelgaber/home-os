import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import type { ConsumptionMode } from './consumptionMode'

export interface ProductDetail {
  id: string
  name: string
  categoryId: string
  categoryName: string
  consumerId: string
  consumerName: string
  consumptionMode: ConsumptionMode
  notes: string | null
  isActive: boolean
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'detail', productId],
    enabled: Boolean(productId),
    queryFn: async (): Promise<ProductDetail> => {
      const { data, error } = await supabase
        .from('products')
        .select(
          'id, name, category_id, consumer_id, consumption_mode, notes, is_active, category:categories(name), consumer:people(name)',
        )
        .eq('id', productId as string)
        .single()
      if (error) throw error

      const category = data.category as unknown as { name: string } | null
      const consumer = data.consumer as unknown as { name: string } | null

      return {
        id: data.id,
        name: data.name,
        categoryId: data.category_id,
        categoryName: category?.name ?? 'Uncategorized',
        consumerId: data.consumer_id,
        consumerName: consumer?.name ?? 'Unknown',
        consumptionMode: data.consumption_mode,
        notes: data.notes,
        isActive: data.is_active,
      }
    },
  })
}
