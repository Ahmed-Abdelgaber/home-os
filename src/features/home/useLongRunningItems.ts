import { useQuery } from '@tanstack/react-query'
import { fetchActiveItems } from '../items/itemQueries'

/** Oldest 3 Active Items per docs/06_HOME_SCREEN_SPEC.md §3. */
export function useLongRunningItems() {
  return useQuery({
    queryKey: ['home', 'long-running-items'],
    queryFn: () => fetchActiveItems(3),
  })
}
