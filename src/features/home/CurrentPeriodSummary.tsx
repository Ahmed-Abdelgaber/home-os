import { IonIcon } from '@ionic/react'
import { calendarOutline, chevronForward, swapHorizontalOutline } from 'ionicons/icons'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatShortDate } from '../../core/utils/cairoDate'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'

interface CurrentPeriodSummaryProps {
  currency: string
  amount: string
  startDate: string | null
  percentVsPreviousPeriod: number | null
  isCycling: boolean
  onCyclePeriod: () => void
}

export function CurrentPeriodSummary({ currency, amount, startDate, percentVsPreviousPeriod, isCycling, onCyclePeriod }: CurrentPeriodSummaryProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <div className="homeos-period-summary__heading">
        <h2 className="homeos-home-label">This period</h2>
        {startDate && <span className="homeos-period-summary__date"><IonIcon icon={calendarOutline} aria-hidden="true" />Since {formatShortDate(startDate)}</span>}
      </div>
      <div className="homeos-period-summary">
        <div>
          {startDate ? (
            <>
              <p className="homeos-period-summary__caption">Spent so far</p>
              <p className="homeos-period-summary__amount"><span>{currency}</span> {amount}</p>
            </>
          ) : <p className="homeos-home-meta">No active tracking period.</p>}
        </div>
        {startDate ? (
          <button
            type="button"
            className="homeos-home-link homeos-period-summary__end"
            disabled={isCycling}
            aria-busy={isCycling}
            onClick={() => setConfirmOpen(true)}
          >
            {isCycling ? 'Ending…' : 'End period'}<IonIcon icon={chevronForward} aria-hidden="true" />
          </button>
        ) : <Link className="homeos-home-link" to="/app/periods">Start a period<IonIcon icon={chevronForward} aria-hidden="true" /></Link>}
      </div>
      {startDate && (
        <Link className="homeos-period-summary__comparison" to="/app/periods">
          <IonIcon icon={swapHorizontalOutline} aria-hidden="true" />
          <span>
          {percentVsPreviousPeriod === null
            ? 'No previous-period spend to compare'
            : percentVsPreviousPeriod === 0
              ? 'Same spend as the previous period'
              : <><strong>{Math.abs(percentVsPreviousPeriod)}% {percentVsPreviousPeriod > 0 ? 'more' : 'less'}</strong> than the previous period</>}
          </span>
          <IonIcon icon={chevronForward} aria-hidden="true" />
        </Link>
      )}
      <ConfirmationSheet
        isOpen={confirmOpen}
        header="End Current Period?"
        message="Are you sure you want to seal the current period and start a new one? This will finalize all current expenses."
        confirmLabel="End Period"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); onCyclePeriod() }}
      />
    </>
  )
}
