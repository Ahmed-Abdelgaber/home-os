import './StatusChip.css'

export type ItemStatus = 'stocked' | 'active' | 'finished'

const LABELS: Record<ItemStatus, string> = {
  stocked: 'Stocked',
  active: 'Active',
  finished: 'Finished',
}

export function StatusChip({ status }: { status: ItemStatus }) {
  return <span className={`homeos-status-chip homeos-status-chip--${status}`}>{LABELS[status]}</span>
}
