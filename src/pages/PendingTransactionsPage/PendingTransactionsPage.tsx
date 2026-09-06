import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IonIcon } from '@ionic/react'
import { cardOutline, checkmarkCircleOutline, chevronForward } from 'ionicons/icons'
import { useQueryClient } from '@tanstack/react-query'
import { formatTimestampDate } from '../../core/utils/cairoDate'
import {
  useCompletedBankTransactions,
  usePendingBankTransactions,
} from '../../features/bank-transactions/useBankTransactions'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Skeleton } from '../../shared/components/Skeleton'
import '../../shared/components/CompactLedger.css'
import '../../shared/components/CompactList.css'
import './PendingTransactionsPage.css'

type TabFilter = 'actionable' | 'completed'

export function PendingTransactionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabFilter>('actionable')

  const pendingQuery = usePendingBankTransactions()
  const completedQuery = useCompletedBankTransactions()

  const currentQuery = tab === 'actionable' ? pendingQuery : completedQuery
  const actionableCount = pendingQuery.data?.length ?? 0

  return (
    <AppPage
      title="Pending Transactions"
      className="homeos-compact-ledger homeos-directory-page homeos-pending-page"
      fullscreen={false}
      backHref="/app/tabs/more"
      onRefresh={async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['bank_transactions'] }),
          queryClient.invalidateQueries({ queryKey: ['bank_transaction_allocations'] }),
        ])
      }}
    >
      <div className="homeos-transactions-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'actionable'}
          className={`homeos-transactions-toggle__option ${
            tab === 'actionable' ? 'homeos-transactions-toggle__option--selected' : ''
          }`}
          onClick={() => setTab('actionable')}
        >
          <span className="homeos-transactions-toggle__label">Actionable</span>
          {actionableCount > 0 && (
            <span
              className={`homeos-transactions-toggle__badge${actionableCount > 5 ? ' homeos-transactions-toggle__badge--danger' : ''}`}
              aria-label={`${actionableCount} actionable`}
            >
              {actionableCount}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'completed'}
          className={`homeos-transactions-toggle__option ${
            tab === 'completed' ? 'homeos-transactions-toggle__option--selected' : ''
          }`}
          onClick={() => setTab('completed')}
        >
          <span className="homeos-transactions-toggle__label">Completed</span>
        </button>
      </div>

      <QueryState
        query={currentQuery}
        skeleton={
          <div className="homeos-transactions-skeleton-stack">
            <Skeleton height={92} />
            <Skeleton height={92} />
            <Skeleton height={92} />
          </div>
        }
        error="Couldn't load bank transactions."
      >
        {(items) =>
          items.length === 0 ? (
            <div className="homeos-tx-empty-wrap">
              <GroupedCard>
                {tab === 'actionable' ? (
                  <EmptyState
                    icon={checkmarkCircleOutline}
                    title="All caught up"
                    message="No pending bank transactions to review."
                  />
                ) : (
                  <EmptyState
                    icon={cardOutline}
                    title="No completed transactions"
                    message="Transactions will appear here once fulfilled or ignored."
                  />
                )}
              </GroupedCard>
            </div>
          ) : (
            <div className="homeos-tx-card-list">
              {items.map((tx) => {
                const txDate = formatTimestampDate(tx.transactionAt)
                const recvDate = formatTimestampDate(tx.receivedAt)
                const displayDate = txDate || recvDate || null
                const cardHint = tx.cardLast4 ? `•••• ${tx.cardLast4}` : null

                const formattedAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
                const merchant = tx.merchantRaw || 'Unknown Merchant'

                const isPartiallyFulfilled = tx.status === 'partially_fulfilled'
                const isFulfilled = tx.status === 'fulfilled'
                const isIgnored = tx.status === 'ignored'
                const isPending = !isPartiallyFulfilled && !isFulfilled && !isIgnored

                const statusModifier = isFulfilled
                  ? 'fulfilled'
                  : isPartiallyFulfilled
                  ? 'partial'
                  : isIgnored
                  ? 'ignored'
                  : 'pending'

                // Allocation progress for partially fulfilled
                const remaining = tx.remainingAmount ?? 0
                const allocPercent =
                  isPartiallyFulfilled && tx.remainingAmount !== undefined
                    ? Math.min(100, Math.max(0, ((tx.amount - tx.remainingAmount) / tx.amount) * 100))
                    : 0

                const formattedRemaining = remaining.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })

                return (
                  <div
                    key={tx.id}
                    className={`homeos-tx-card homeos-tx-card--${statusModifier}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/app/pending-transactions/${tx.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/app/pending-transactions/${tx.id}`)
                      }
                    }}
                  >
                    <div className="homeos-tx-card__header">
                      <div className={`homeos-tx-card__icon homeos-tx-card__icon--${statusModifier}`} aria-hidden="true">
                        <IonIcon icon={isFulfilled ? checkmarkCircleOutline : cardOutline} />
                      </div>

                      <div className="homeos-tx-card__title-area">
                        <div className="homeos-tx-card__primary-row">
                          <span className="homeos-tx-card__merchant" title={merchant}>
                            {merchant}
                          </span>
                          <span className="homeos-tx-card__amount">
                            {formattedAmount}
                          </span>
                        </div>

                        <div className="homeos-tx-card__secondary-row">
                          <span className="homeos-tx-card__meta">
                            {displayDate && (
                              <span className="homeos-tx-card__meta-item">{displayDate}</span>
                            )}
                            {displayDate && cardHint && (
                              <span className="homeos-tx-card__meta-separator" aria-hidden="true">•</span>
                            )}
                            {cardHint && (
                              <span className="homeos-tx-card__meta-item">{cardHint}</span>
                            )}
                          </span>

                          {isPartiallyFulfilled && (
                            <span className="homeos-tx-badge homeos-tx-badge--partial">
                              Partial
                              <IonIcon icon={chevronForward} className="homeos-tx-badge__chevron" aria-hidden="true" />
                            </span>
                          )}
                          {isPending && (
                            <span className="homeos-tx-badge homeos-tx-badge--pending">
                              Not allocated
                              <IonIcon icon={chevronForward} className="homeos-tx-badge__chevron" aria-hidden="true" />
                            </span>
                          )}
                          {isFulfilled && (
                            <span className="homeos-tx-badge homeos-tx-badge--fulfilled">
                              Fulfilled
                            </span>
                          )}
                          {isIgnored && (
                            <span className="homeos-tx-badge homeos-tx-badge--ignored">
                              Ignored
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isPartiallyFulfilled && allocPercent > 0 && (
                      <div className="homeos-tx-card__allocation">
                        <div
                          className="homeos-tx-card__progress-track"
                          role="progressbar"
                          aria-valuenow={Math.round(allocPercent)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="homeos-tx-card__progress-fill"
                            style={{ width: `${allocPercent}%` }}
                          />
                        </div>
                        <div className="homeos-tx-card__allocation-details">
                          <span className="homeos-tx-card__remaining-text">
                            <strong>
                              {tx.currency} {formattedRemaining}
                            </strong>{' '}
                            left to allocate
                          </span>
                          <span className="homeos-tx-card__allocated-text">
                            {Math.round(allocPercent)}% allocated
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        }
      </QueryState>
    </AppPage>
  )
}
