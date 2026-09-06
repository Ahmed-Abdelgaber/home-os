import { Skeleton } from './Skeleton'
import './RowSkeleton.css'

/**
 * The loading shape of a GroupedCard: stacked row-height bars behind one card outline,
 * hairline-divided the way real rows are. Screens were each writing this stack in their
 * own stylesheet, and the ones that didn't fell back to a single bar that collapsed into
 * a full card on load.
 */
export function RowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="homeos-row-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={64} />
      ))}
    </div>
  )
}
