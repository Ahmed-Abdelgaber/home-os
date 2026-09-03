import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatShortDate } from '../../core/utils/cairoDate'
import { BankTransactionAllocationsList } from '../../features/bank-transactions/BankTransactionAllocationsList'
import { FulfillTransactionModal } from '../../features/bank-transactions/FulfillTransactionModal'
import {
  calculateAllocationSummary,
  useBankTransactionAllocations,
  useBankTransactionDetails,
} from '../../features/bank-transactions/useBankTransactions'
import { AppPage } from '../../shared/components/AppPage'
import { FactRow } from '../../shared/components/FactRow'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { Skeleton } from '../../shared/components/Skeleton'
import './PendingTransactionDetailsPage.css'

export function PendingTransactionDetailsPage() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const transaction = useBankTransactionDetails(transactionId)
  const allocations = useBankTransactionAllocations(transactionId)
  const [showFulfillModal, setShowFulfillModal] = useState(false)

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
          const allocList = allocations.data ?? []
          const { totalAllocated, remaining, isFullyAllocated } = calculateAllocationSummary(
            tx.amount,
            allocList
          )

          const formattedAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`

          const formattedAllocated = `${tx.currency} ${totalAllocated.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`

          const formattedRemaining = `${tx.currency} ${remaining.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`

          const displayStatus =
            tx.status === 'fulfilled' || isFullyAllocated
              ? 'Fulfilled'
              : tx.status === 'partially_fulfilled' || totalAllocated > 0
              ? 'Partially Fulfilled'
              : tx.status === 'ignored'
              ? 'Ignored'
              : 'Pending'

          const statusTone =
            displayStatus === 'Fulfilled'
              ? 'active'
              : displayStatus === 'Partially Fulfilled'
              ? 'warning'
              : displayStatus === 'Ignored'
              ? 'finished'
              : 'warning'

          const canFulfill =
            tx.status !== 'ignored' && tx.status !== 'fulfilled' && !isFullyAllocated && remaining > 0

          return (
            <div className="homeos-tx-details">
              <div className="homeos-tx-details__identity">
                <h1 className="homeos-tx-details__title">{tx.merchantRaw || 'Unknown Merchant'}</h1>
                <span className={`homeos-status-chip homeos-status-chip--${statusTone}`}>
                  {displayStatus}
                </span>
              </div>

              <div className="homeos-tx-details__amount-card">
                <div className="homeos-tx-details__amount-main">
                  <p className="homeos-tx-details__amount-label">Transaction Amount</p>
                  <p className="homeos-tx-details__amount-value">{formattedAmount}</p>
                </div>

                {(totalAllocated > 0 || tx.status === 'partially_fulfilled') && (
                  <div className="homeos-tx-details__amount-breakdown">
                    <div className="homeos-tx-details__amount-sub">
                      <span className="homeos-tx-details__sub-label">Allocated</span>
                      <span className="homeos-tx-details__sub-value">{formattedAllocated}</span>
                    </div>
                    <div className="homeos-tx-details__amount-sub homeos-tx-details__amount-sub--remaining">
                      <span className="homeos-tx-details__sub-label">Remaining</span>
                      <span className="homeos-tx-details__sub-value">{formattedRemaining}</span>
                    </div>
                  </div>
                )}
              </div>

              {canFulfill && (
                <div className="homeos-tx-details__action-bar">
                  <PrimaryButton onClick={() => setShowFulfillModal(true)}>
                    Fulfill Transaction
                  </PrimaryButton>
                </div>
              )}

              {displayStatus === 'Fulfilled' && (
                <div className="homeos-tx-details__fulfilled-notice">
                  <span>✓ Fully allocated to HomeOS expenses</span>
                </div>
              )}

              <BankTransactionAllocationsList allocations={allocList} currency={tx.currency} />

              <GroupedCard className="homeos-tx-details__facts">
                <FactRow label="Bank" value={tx.bank} />
                <FactRow label="Card" value={tx.cardLast4 ? `•••• ${tx.cardLast4}` : 'N/A'} />
                {tx.transactionType && <FactRow label="Type" value={tx.transactionType.toUpperCase()} />}
                {tx.transactionAt && <FactRow label="Date" value={formatShortDate(tx.transactionAt)} />}
                <FactRow label="Received" value={formatShortDate(tx.receivedAt)} />
                {tx.merchantRaw && <FactRow label="Raw merchant" value={tx.merchantRaw} />}
                <FactRow label="Status" value={displayStatus} />
                <FactRow label="Allocated" value={formattedAllocated} />
                <FactRow label="Remaining" value={formattedRemaining} />
              </GroupedCard>

              <details className="homeos-tx-details__source-expandable">
                <summary className="homeos-tx-details__source-summary">Original bank message</summary>
                <div className="homeos-tx-details__raw-message">
                  {tx.rawMessage}
                </div>
              </details>

              <FulfillTransactionModal
                isOpen={showFulfillModal}
                onClose={() => setShowFulfillModal(false)}
                transaction={tx}
                remainingAmount={remaining}
                totalAllocated={totalAllocated}
              />
            </div>
          )
        }}
      </QueryState>
    </AppPage>
  )
}
