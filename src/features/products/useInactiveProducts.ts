import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import type { ProductSummary } from './useProductCatalog'

/** Inactive products only — for the dedicated Inactive Products page. */
export function useInactiveProducts() {
  return useQuery({
    queryKey: ['products', 'inactive'],
    queryFn: async (): Promise<ProductSummary[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, is_active, category:categories(name)')
        .eq('is_active', false)
        .order('name')
      if (error) throw error

      return (data ?? []).map((row) => {
        const category = row.category as unknown as { name: string } | null
        return { id: row.id, title: row.name, meta: category?.name ?? '', isActive: row.is_active }
      })
    },
  })
}
