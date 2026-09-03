import { useParams } from 'react-router-dom'
import { formatShortDate } from '../../core/utils/cairoDate'
import { useBankTransactionDetails } from '../../features/bank-transactions/useBankTransactions'
import { AppPage } from '../../shared/components/AppPage'
import { FactRow } from '../../shared/components/FactRow'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Skeleton } from '../../shared/components/Skeleton'
import './PendingTransactionDetailsPage.css'

export function PendingTransactionDetailsPage() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const transaction = useBankTransactionDetails(transactionId)

  return (
    <AppPage title="Transaction" backHref="/app/pending-transactions">
      <QueryState
        query={transaction}
        skeleton={
          <div className="homeos-tx-details-skeleton">
            <Skeleton height={40} />
            <Skeleton height={90} />
            <Skeleton height={200} />
          </div>
        }
        error="Couldn't load bank transaction details."
      >
        {(tx) => {
          const formattedAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

          return (
            <div className="homeos-tx-details">
              <div className="homeos-tx-details__identity">
                <h1 className="homeos-tx-details__title">{tx.merchantRaw || 'Unknown Merchant'}</h1>
                <span
                  className={`homeos-status-chip ${
                    tx.status === 'pending'
                      ? 'homeos-status-chip--warning'
                      : tx.status === 'ignored'
                      ? 'homeos-status-chip--finished'
                      : 'homeos-status-chip--active'
                  }`}
                >
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </span>
              </div>

              <div className="homeos-tx-details__amount-card">
                <p className="homeos-tx-details__amount-label">Amount</p>
                <p className="homeos-tx-details__amount-value">{formattedAmount}</p>
              </div>

              <GroupedCard className="homeos-tx-details__facts">
                <FactRow label="Bank" value={tx.bank} />
                <FactRow label="Card" value={tx.cardLast4 ? `•••• ${tx.cardLast4}` : 'N/A'} />
                {tx.transactionType && <FactRow label="Type" value={tx.transactionType.toUpperCase()} />}
                {tx.transactionAt && <FactRow label="Date" value={formatShortDate(tx.transactionAt)} />}
                <FactRow label="Received" value={formatShortDate(tx.receivedAt)} />
                {tx.merchantRaw && <FactRow label="Raw merchant" value={tx.merchantRaw} />}
                <FactRow label="Status" value={tx.status.charAt(0).toUpperCase() + tx.status.slice(1)} />
              </GroupedCard>

              <details className="homeos-tx-details__source-expandable">
                <summary className="homeos-tx-details__source-summary">Show original SMS</summary>
                <div className="homeos-tx-details__raw-message">
                  {tx.rawMessage}
                </div>
              </details>
            </div>
          )
        }}
      </QueryState>
    </AppPage>
  )
}
