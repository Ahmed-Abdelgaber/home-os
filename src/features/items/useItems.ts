import { useQuery } from '@tanstack/react-query'
import { fetchActiveItems, fetchStockedItems } from './itemQueries'

export function useActiveItems() {
  return useQuery({ queryKey: ['items', 'active'], queryFn: () => fetchActiveItems() })
}

export function useStockedItems() {
  return useQuery({ queryKey: ['items', 'stocked'], queryFn: () => fetchStockedItems() })
}
