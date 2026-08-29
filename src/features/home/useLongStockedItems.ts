import { useQuery } from '@tanstack/react-query'
import { fetchStockedItems } from '../items/itemQueries'

/** Stocked Items purchased >= 30 days ago per docs/06_HOME_SCREEN_SPEC.md §4. */
export function useLongStockedItems() {
  return useQuery({
    queryKey: ['home', 'long-stocked-items'],
    queryFn: () => fetchStockedItems(),
  })
}
