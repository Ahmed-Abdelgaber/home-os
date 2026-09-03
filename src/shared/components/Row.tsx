import { IonIcon } from '@ionic/react'
import { chevronForward } from 'ionicons/icons'
import type { ReactNode } from 'react'
import './Row.css'

export type RowTone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'

interface RowProps {
  icon: string
  /** Colors the media block. Carries meaning (danger/success), not decoration. */
  tone?: RowTone
  /** `thumb` is the 40px rounded square used by object rows; `badge` is the 36px circle used by event rows. */
  media?: 'thumb' | 'badge'
  title: string
  meta: string
  /** Sits between the text and the chevron — an amount, a count. Not interactive. */
  accessory?: ReactNode
  /** Replaces the chevron with a control of your own. Rendered outside the row's own button. */
  trailing?: ReactNode
  onClick?: () => void
}

/**
 * The one list row. Object rows (items, expenses, products, trips) and event rows (activity)
 * differ only in media shape and tone.
 *
 * When `onClick` is provided, the entire row is interactive and tappable.
 * If `trailing` is provided (e.g. a standalone button), clicks inside `trailing`
 * will not trigger the row's `onClick`.
 */
export function Row({ icon, tone = 'neutral', media = 'thumb', title, meta, accessory, trailing, onClick }: RowProps) {
  const body = (
    <>
      <span className={`homeos-row__media homeos-row__media--${media} homeos-row__media--${tone}`} aria-hidden="true">
        <IonIcon icon={icon} />
      </span>
      <span className="homeos-row__text">
        <span className="homeos-row__title">{title}</span>
        <span className="homeos-row__meta">{meta}</span>
      </span>
    </>
  )

  const handleRowClick = (e: React.MouseEvent) => {
    if (!onClick) return
    // If the click originated from inside a trailing control, don't trigger row onClick
    if (trailing && (e.target as HTMLElement).closest('.homeos-row__trailing')) {
      return
    }
    onClick()
  }

  return (
    <div
      className={`homeos-row ${onClick ? 'homeos-row--clickable' : ''}`}
      onClick={onClick ? handleRowClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {onClick ? (
        <button
          type="button"
          className="homeos-row__action"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          {body}
        </button>
      ) : (
        <span className="homeos-row__action homeos-row__action--static">{body}</span>
      )}
      {accessory && <span className="homeos-row__accessory">{accessory}</span>}
      {trailing ? (
        <span className="homeos-row__trailing">{trailing}</span>
      ) : (
        onClick && <IonIcon icon={chevronForward} className="homeos-row__chevron" aria-hidden="true" />
      )}
    </div>
  )
}
