import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import { formatShortDate } from '../../core/utils/cairoDate'

export interface PeriodSummary {
  id: string
  startDate: string
  endDate: string | null
  isActive: boolean
  title: string
  meta: string
}

export function usePeriods() {
  return useQuery({
    queryKey: ['periods'],
    queryFn: async (): Promise<PeriodSummary[]> => {
      const { data, error } = await supabase
        .from('periods')
        .select('id, start_date, end_date, is_active')
        .order('is_active', { ascending: false }) // Active first
        .order('start_date', { ascending: false })
      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: row.is_active,
        title: row.is_active ? 'Current Period' : 'Past Period',
        meta: row.is_active
          ? `Started ${formatShortDate(row.start_date)}`
          : `${formatShortDate(row.start_date)} → ${formatShortDate(row.end_date!)}`,
      }))
    },
  })
}
