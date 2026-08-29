import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import { cairoToday, formatShortDate } from '../../core/utils/cairoDate'

export type TripStatus = 'current' | 'upcoming' | 'past'

export interface TripSummary {
  id: string
  title: string
  meta: string
  status: TripStatus
  departureDate: string
}

function personLabel(person: { name: string; kind: string } | null): string {
  if (!person) return 'Someone'
  return person.kind === 'household' ? 'Household' : person.name
}

/** Current/upcoming/past distinction per docs/07 Phase 9 — interval is [departure, return) per docs/01 §5. */
export function useTrips() {
  return useQuery({
    queryKey: ['trips', 'list'],
    queryFn: async (): Promise<TripSummary[]> => {
      const { data, error } = await supabase
        .from('trips')
        .select('id, name, departure_date, return_date, person:people(name, kind)')
        .order('departure_date', { ascending: true })
      if (error) throw error

      const today = cairoToday()

      return (data ?? []).map((row) => {
        const person = row.person as unknown as { name: string; kind: string } | null
        const status: TripStatus = row.departure_date <= today && row.return_date > today ? 'current' : row.departure_date > today ? 'upcoming' : 'past'

        return {
          id: row.id,
          title: row.name,
          meta: `${personLabel(person)} • ${formatShortDate(row.departure_date)} – ${formatShortDate(row.return_date)}`,
          status,
          departureDate: row.departure_date,
        }
      })
    },
  })
}
