import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'
import { cairoMonthRange, cairoToday, formatShortDate } from '../../core/utils/cairoDate'
import type { TravelStatus } from '../../shared/components/HeroSnapshotCard'

interface HomeSnapshot {
  currency: string
  amount: string
  percentVsLastMonth: number | null
  travel: TravelStatus
}

async function fetchMonthSpend(start: string, end: string): Promise<number> {
  const { data, error } = await supabase.from('expenses').select('amount').gte('expense_date', start).lt('expense_date', end)
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
}

function personLabel(person: { name: string; kind: string } | null): string {
  if (!person) return 'Someone'
  return person.kind === 'household' ? 'Household' : person.name
}

/** Priority per docs/02 §7: current trip, else next upcoming trip, else "Everyone is home". */
async function fetchTravel(): Promise<TravelStatus> {
  const today = cairoToday()

  const { data: currentTrip, error: currentErr } = await supabase
    .from('trips')
    .select('name, return_date, person:people(name, kind)')
    .lte('departure_date', today)
    .gt('return_date', today)
    .limit(1)
    .maybeSingle()
  if (currentErr) throw currentErr

  if (currentTrip) {
    const person = currentTrip.person as unknown as { name: string; kind: string } | null
    return {
      kind: 'away',
      who: personLabel(person),
      destination: currentTrip.name,
      returnLabel: formatShortDate(currentTrip.return_date),
    }
  }

  const { data: upcomingTrip, error: upcomingErr } = await supabase
    .from('trips')
    .select('name, departure_date, return_date, person:people(name, kind)')
    .gt('departure_date', today)
    .order('departure_date', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (upcomingErr) throw upcomingErr

  if (!upcomingTrip) return { kind: 'home' }

  const person = upcomingTrip.person as unknown as { name: string; kind: string } | null
  return {
    kind: 'home',
    upcoming: {
      person: personLabel(person),
      destination: upcomingTrip.name,
      rangeLabel: `${formatShortDate(upcomingTrip.departure_date)} – ${formatShortDate(upcomingTrip.return_date)}`,
    },
  }
}

/** Monthly spend + travel status per docs/06_HOME_SCREEN_SPEC.md §2. */
export function useHomeSnapshot() {
  return useQuery({
    queryKey: ['home', 'snapshot'],
    queryFn: async (): Promise<HomeSnapshot> => {
      const current = cairoMonthRange(0)
      const previous = cairoMonthRange(-1)
      const [currentSpend, previousSpend, travel] = await Promise.all([
        fetchMonthSpend(current.start, current.end),
        fetchMonthSpend(previous.start, previous.end),
        fetchTravel(),
      ])

      return {
        currency: 'EGP',
        amount: currentSpend.toLocaleString('en-US'),
        percentVsLastMonth: previousSpend === 0 ? null : Math.round(((currentSpend - previousSpend) / previousSpend) * 100),
        travel,
      }
    },
  })
}
