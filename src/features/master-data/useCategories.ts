import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface Category {
  id: string
  name: string
}

export interface CategoryDetail extends Category {
  isActive: boolean
}

export function useActiveCategories() {
  return useQuery({
    queryKey: ['categories', 'active'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from('categories').select('id, name').eq('is_active', true).order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

/** For the Categories management page — includes inactive/archived, per docs/01 §1 archive-not-delete. */
export function useAllCategories() {
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async (): Promise<CategoryDetail[]> => {
      const { data, error } = await supabase.from('categories').select('id, name, is_active').order('name')
      if (error) throw error
      return (data ?? []).map((row) => ({ id: row.id, name: row.name, isActive: row.is_active }))
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<{ id: string }> => {
      const { data, error } = await supabase.from('categories').insert({ name }).select('id').single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name, isActive }: { id: string; name: string; isActive: boolean }) => {
      const { error } = await supabase.from('categories').update({ name, is_active: isActive }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}
