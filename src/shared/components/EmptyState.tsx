import { IonIcon } from '@ionic/react'
import type { ReactNode } from 'react'
import './EmptyState.css'

interface EmptyStateProps {
  icon?: string
  title?: string
  message: string
  action?: ReactNode
}

/** Deliberate, refined empty state per HomeOS visual polish pass. */
export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="homeos-empty-state">
      {icon && (
        <div className="homeos-empty-state__icon-container" aria-hidden="true">
          <IonIcon icon={icon} className="homeos-empty-state__icon" />
        </div>
      )}
      {title && <h3 className="homeos-empty-state__title">{title}</h3>}
      <p className="homeos-empty-state__message">{message}</p>
      {action && <div className="homeos-empty-state__action">{action}</div>}
    </div>
  )
}
