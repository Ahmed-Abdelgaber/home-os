import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export interface TripDetail {
  id: string
  name: string
  departureDate: string
  returnDate: string
  personId: string
  notes: string | null
}

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trips', 'detail', tripId],
    enabled: Boolean(tripId),
    queryFn: async (): Promise<TripDetail> => {
      const { data, error } = await supabase
        .from('trips')
        .select('id, name, departure_date, return_date, person_id, notes')
        .eq('id', tripId as string)
        .single()
      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        departureDate: data.departure_date,
        returnDate: data.return_date,
        personId: data.person_id,
        notes: data.notes,
      }
    },
  })
}
