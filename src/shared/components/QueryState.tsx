import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { GroupedCard } from './GroupedCard'

/** Structural, so this works with any TanStack query result without dragging its generics in. */
interface QueryLike<T> {
  isLoading: boolean
  isError: boolean
  data: T | undefined
}

interface QueryStateProps<T> {
  query: QueryLike<T>
  /** Shown while loading. Sized per screen, so callers own it. */
  skeleton: ReactNode
  /** What to say when the fetch failed. Name the thing that didn't load. */
  error: string
  /** What to say when the fetch succeeded with nothing in it. Omit for data that is never empty. */
  empty?: string
  children: (data: T) => ReactNode
}

/**
 * The loading → error → empty → content ladder, which every list screen was spelling out
 * by hand. Keeping it in one place means skeleton behavior and error copy stay consistent
 * as screens are added.
 */
export function QueryState<T>({ query, skeleton, error, empty, children }: QueryStateProps<T>) {
  if (query.isLoading) return <>{skeleton}</>
  if (query.isError || query.data === undefined) return <EmptyState message={error} />

  if (empty !== undefined && Array.isArray(query.data) && query.data.length === 0) {
    return (
      <GroupedCard>
        <EmptyState message={empty} />
      </GroupedCard>
    )
  }

  return <>{children(query.data)}</>
}
