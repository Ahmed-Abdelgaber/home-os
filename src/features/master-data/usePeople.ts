import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export type PersonKind = 'person' | 'household'

export interface Person {
  id: string
  name: string
}

export interface PersonDetail extends Person {
  kind: PersonKind
  isActive: boolean
}

export function useActivePeople() {
  return useQuery({
    queryKey: ['people', 'active'],
    queryFn: async (): Promise<Person[]> => {
      const { data, error } = await supabase.from('people').select('id, name').eq('is_active', true).order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

/** For the People management page — includes inactive/archived, per docs/01 §1 archive-not-delete. */
export function useAllPeople() {
  return useQuery({
    queryKey: ['people', 'all'],
    queryFn: async (): Promise<PersonDetail[]> => {
      const { data, error } = await supabase.from('people').select('id, name, kind, is_active').order('name')
      if (error) throw error
      return (data ?? []).map((row) => ({ id: row.id, name: row.name, kind: row.kind, isActive: row.is_active }))
    },
  })
}

interface PersonInput {
  name: string
  kind: PersonKind
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PersonInput): Promise<{ id: string }> => {
      const { data, error } = await supabase.from('people').insert({ name: input.name, kind: input.kind }).select('id').single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['people'] }),
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input, isActive }: { id: string; input: PersonInput; isActive: boolean }) => {
      const { error } = await supabase.from('people').update({ name: input.name, kind: input.kind, is_active: isActive }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['people'] }),
  })
}
