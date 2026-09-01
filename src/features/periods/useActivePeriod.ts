import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface ActivePeriod {
  id: string
  startDate: string
}

export function useActivePeriod() {
  return useQuery({
    queryKey: ['periods', 'active'],
    queryFn: async (): Promise<ActivePeriod | null> => {
      const { data, error } = await supabase
        .from('periods')
        .select('id, start_date')
        .eq('is_active', true)
        .maybeSingle()
      if (error) throw error

      if (!data) return null
      return {
        id: data.id,
        startDate: data.start_date,
      }
    },
  })
}
