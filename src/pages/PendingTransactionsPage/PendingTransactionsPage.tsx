import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cardOutline, checkmarkCircleOutline } from 'ionicons/icons'
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
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
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
            <Skeleton height={68} />
            <Skeleton height={68} />
          </div>
        }
        error="Couldn't load bank transactions."
      >
        {(items) =>
          items.length === 0 ? (
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
          ) : (
            <GroupedCard>
              {items.map((tx) => {
                const txDate = formatTimestampDate(tx.transactionAt)
                const recvDate = formatTimestampDate(tx.receivedAt)
                const displayDate = txDate || recvDate || null
                const cardHint = tx.cardLast4 ? `Card •••• ${tx.cardLast4}` : null

                const formattedAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
                const merchant = tx.merchantRaw || 'Unknown Merchant'

                const isPartiallyFulfilled = tx.status === 'partially_fulfilled'
                const isFulfilled = tx.status === 'fulfilled'
                const isIgnored = tx.status === 'ignored'

                const meta = [cardHint, displayDate].filter(Boolean).join(' • ')

                const rowTone = isFulfilled
                  ? 'success'
                  : isPartiallyFulfilled
                  ? 'warning'
                  : isIgnored
                  ? 'neutral'
                  : 'warning'

                let accessoryNode
                if (isPartiallyFulfilled) {
                  accessoryNode = (
                    <div className="homeos-tx-row-aside">
                      <span className="homeos-tx-remaining-badge">
                        {tx.remainingAmount !== undefined
                          ? `${tx.currency} ${tx.remainingAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} remaining`
                          : 'Partially fulfilled'}
                      </span>
                      <span className="homeos-tx-row-amount-sub">of {formattedAmount}</span>
                    </div>
                  )
                } else if (isFulfilled) {
                  accessoryNode = (
                    <div className="homeos-tx-row-aside">
                      <span className="homeos-tx-row-amount">{formattedAmount}</span>
                      <span className="homeos-status-chip homeos-status-chip--active">Fulfilled</span>
                    </div>
                  )
                } else if (isIgnored) {
                  accessoryNode = (
                    <div className="homeos-tx-row-aside">
                      <span className="homeos-tx-row-amount homeos-tx-row-amount--ignored">{formattedAmount}</span>
                      <span className="homeos-status-chip homeos-status-chip--finished">Ignored</span>
                    </div>
                  )
                } else {
                  accessoryNode = <span className="homeos-tx-row-amount">{formattedAmount}</span>
                }

                return (
                  <Row
                    key={tx.id}
                    icon={cardOutline}
                    tone={rowTone}
                    title={merchant}
                    meta={meta}
                    accessory={accessoryNode}
                    onClick={() => navigate(`/app/pending-transactions/${tx.id}`)}
                  />
                )
              })}
            </GroupedCard>
          )
        }
      </QueryState>
    </AppPage>
  )
}
