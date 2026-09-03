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
 * The tappable region is a real <button> rather than a div with role="button", so focus,
 * Enter and Space come from the platform. It deliberately wraps only the media and text:
 * that keeps `trailing` a sibling instead of a nested control, which is invalid inside a
 * button and previously needed a stopPropagation to work around.
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

  return (
    <div className="homeos-row">
      {onClick ? (
        <button type="button" className="homeos-row__action" onClick={onClick}>
          {body}
        </button>
      ) : (
        <span className="homeos-row__action homeos-row__action--static">{body}</span>
      )}
      {accessory && <span className="homeos-row__accessory">{accessory}</span>}
      {trailing ?? (onClick && <IonIcon icon={chevronForward} className="homeos-row__chevron" aria-hidden="true" />)}
    </div>
  )
}
