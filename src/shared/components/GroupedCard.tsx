import type { ReactNode } from 'react'
import './GroupedCard.css'

/**
 * One outer card with dividers between rows, per docs/05_UI_UX_DESIGN_SYSTEM.md §7 —
 * not one floating card per row.
 */
export function GroupedCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`homeos-grouped-card ${className ?? ''}`}>{children}</div>
}
