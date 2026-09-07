import type { UsageMode } from '../../features/products/usageMode'
import './StatusChip.css'

export type ItemStatus = 'stocked' | 'active' | 'finished'

const LABELS: Record<ItemStatus, string> = {
  stocked: 'Stocked',
  active: 'Active',
  finished: 'Finished',
}

export function StatusChip({
  status,
  usageMode,
  label,
}: {
  status: ItemStatus
  usageMode?: UsageMode
  label?: string
}) {
  let displayLabel = label ?? LABELS[status]
  if (!label && status === 'finished' && usageMode === 'one_time') {
    displayLabel = 'Used'
  }
  return <span className={`homeos-status-chip homeos-status-chip--${status}`}>{displayLabel}</span>
}
