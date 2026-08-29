import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface Account {
  id: string
  name: string
}

export interface AccountDetail extends Account {
  type: string | null
  ownerId: string | null
  ownerName: string | null
  isActive: boolean
}

export function useActiveAccounts() {
  return useQuery({
    queryKey: ['accounts', 'active'],
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase.from('accounts').select('id, name').eq('is_active', true).order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

/** For the Accounts management page — includes inactive/archived, per docs/01 §1 archive-not-delete. */
export function useAllAccounts() {
  return useQuery({
    queryKey: ['accounts', 'all'],
    queryFn: async (): Promise<AccountDetail[]> => {
      const { data, error } = await supabase.from('accounts').select('id, name, type, is_active, owner:people(id, name)').order('name')
      if (error) throw error
      return (data ?? []).map((row) => {
        const owner = row.owner as unknown as { id: string; name: string } | null
        return { id: row.id, name: row.name, type: row.type, ownerId: owner?.id ?? null, ownerName: owner?.name ?? null, isActive: row.is_active }
      })
    },
  })
}

interface AccountInput {
  name: string
  type: string | null
  ownerId: string | null
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AccountInput): Promise<{ id: string }> => {
      const { data, error } = await supabase
        .from('accounts')
        .insert({ name: input.name, type: input.type, owner_id: input.ownerId })
        .select('id')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input, isActive }: { id: string; input: AccountInput; isActive: boolean }) => {
      const { error } = await supabase
        .from('accounts')
        .update({ name: input.name, type: input.type, owner_id: input.ownerId, is_active: isActive })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  })
}
