import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase/client'
import { useAuth } from './useAuth'

/** Resolves the signed-in Supabase Auth user to their HomeOS Person via app_users. */
export function useCurrentPerson() {
  const { session } = useAuth()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['current-person', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_users')
        .select('person:people(name)')
        .eq('user_id', userId as string)
        .single()
      if (error) throw error
      const person = data.person as unknown as { name: string } | null
      return person?.name ?? null
    },
  })
}
