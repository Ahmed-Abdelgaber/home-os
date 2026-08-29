import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface ProductSummary {
  id: string
  title: string
  meta: string
  isActive: boolean
}

export function useProductCatalog(includeInactive: boolean) {
  return useQuery({
    queryKey: ['products', 'catalog', includeInactive],
    queryFn: async (): Promise<ProductSummary[]> => {
      let query = supabase.from('products').select('id, name, is_active, category:categories(name)').order('name')
      if (!includeInactive) query = query.eq('is_active', true)

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row) => {
        const category = row.category as unknown as { name: string } | null
        return { id: row.id, title: row.name, meta: category?.name ?? '', isActive: row.is_active }
      })
    },
  })
}
