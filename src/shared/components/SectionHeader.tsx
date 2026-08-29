import { IonIcon } from '@ionic/react'
import './SectionHeader.css'

interface SectionHeaderProps {
  icon: string
  title: string
  /** Rendered only alongside `onAction` — a label with nothing behind it is a control that lies. */
  actionLabel?: string
  onAction?: () => void
}

export function SectionHeader({ icon, title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <div className="homeos-section-header">
      <div className="homeos-section-header__title">
        <IonIcon icon={icon} />
        <h2>{title}</h2>
      </div>
      {actionLabel && onAction && (
        <button type="button" className="homeos-section-header__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
