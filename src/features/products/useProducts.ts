import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface ActiveProduct {
  id: string
  name: string
  categoryName: string | null
}

export function useActiveProducts() {
  return useQuery({
    queryKey: ['products', 'active'],
    queryFn: async (): Promise<ActiveProduct[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category:categories(name)')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data ?? []).map((row) => {
        const category = row.category as unknown as { name: string } | null
        return { id: row.id, name: row.name, categoryName: category?.name ?? null }
      })
    },
  })
}
