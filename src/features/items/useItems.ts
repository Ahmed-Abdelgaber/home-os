import { useQuery } from '@tanstack/react-query'
import { fetchActiveItems, fetchAllStockedItems, fetchFinishedItems } from './itemQueries'

export function useActiveItems() {
  return useQuery({ queryKey: ['items', 'active'], queryFn: () => fetchActiveItems() })
}

export function useStockedItems() {
  return useQuery({ queryKey: ['items', 'stocked'], queryFn: () => fetchAllStockedItems() })
}

export function useFinishedItems() {
  return useQuery({ queryKey: ['items', 'finished'], queryFn: () => fetchFinishedItems() })
}
