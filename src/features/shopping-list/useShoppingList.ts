import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import type { ShoppingListItem, ShoppingListSource } from './shoppingListTypes'

export function useShoppingList() {
  return useQuery({
    queryKey: ['shopping-list'],
    queryFn: async (): Promise<ShoppingListItem[]> => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select(`
          id,
          product_id,
          source,
          created_at,
          product:products (
            id,
            name,
            is_active,
            category:categories (name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        // If table doesn't exist yet before migration, degrade gracefully to empty array
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return []
        }
        throw error
      }

      return (data ?? []).map((row) => {
        const product = row.product as unknown as {
          id: string
          name: string
          is_active: boolean
          category: { name: string } | null
        } | null

        return {
          id: row.id,
          productId: row.product_id,
          productName: product?.name ?? 'Unknown product',
          categoryName: product?.category?.name ?? null,
          source: (row.source as ShoppingListSource) || 'manual',
          createdAt: row.created_at,
          isActive: product?.is_active ?? true,
        }
      })
    },
  })
}
