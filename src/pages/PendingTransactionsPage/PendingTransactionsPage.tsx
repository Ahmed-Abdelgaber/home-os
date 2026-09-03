import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cardOutline } from 'ionicons/icons'
import { useQueryClient } from '@tanstack/react-query'
import { formatTimestampDate } from '../../core/utils/cairoDate'
import {
  useCompletedBankTransactions,
  usePendingBankTransactions,
} from '../../features/bank-transactions/useBankTransactions'
import { AppPage } from '../../shared/components/AppPage'
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
          Actionable
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
          Completed
        </button>
      </div>

      <QueryState
        query={currentQuery}
        skeleton={
          <div className="homeos-transactions-skeleton-stack">
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
          </div>
        }
        error="Couldn't load bank transactions."
        empty={
          tab === 'actionable'
            ? 'No pending bank transactions to review. You’re all caught up.'
            : 'No completed bank transactions yet.'
        }
      >
        {(items) => (
          <GroupedCard>
            {items.map((tx) => {
              const txDate = formatTimestampDate(tx.transactionAt)
              const recvDate = formatTimestampDate(tx.receivedAt)
              const displayDate = txDate || recvDate || null

              const cardHint = tx.cardLast4 ? `Card •••• ${tx.cardLast4}` : 'Card'
              const formattedAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
              const merchant = tx.merchantRaw || 'Unknown Merchant'

              const isPartiallyFulfilled = tx.status === 'partially_fulfilled'
              const isFulfilled = tx.status === 'fulfilled'
              const isIgnored = tx.status === 'ignored'

              const metaParts: string[] = [merchant]
              if (isPartiallyFulfilled) {
                metaParts.push('Partially Fulfilled')
              } else if (isFulfilled) {
                metaParts.push('Fulfilled')
              } else if (isIgnored) {
                metaParts.push('Ignored')
              } else if (tx.cardLast4) {
                metaParts.push(cardHint)
              }

              if (displayDate) {
                metaParts.push(displayDate)
              }

              const meta = metaParts.join(' • ')

              const chipClass = isFulfilled
                ? 'homeos-status-chip--active'
                : isPartiallyFulfilled
                ? 'homeos-status-chip--warning'
                : isIgnored
                ? 'homeos-status-chip--finished'
                : 'homeos-status-chip--warning'

              const chipLabel = isPartiallyFulfilled
                ? 'Partially Fulfilled'
                : isFulfilled
                ? 'Fulfilled'
                : isIgnored
                ? 'Ignored'
                : 'Pending'

              const rowTone = isFulfilled
                ? 'success'
                : isPartiallyFulfilled
                ? 'warning'
                : isIgnored
                ? 'neutral'
                : 'warning'

              return (
                <Row
                  key={tx.id}
                  icon={cardOutline}
                  tone={rowTone}
                  title={formattedAmount}
                  meta={meta}
                  accessory={<span className={`homeos-status-chip ${chipClass}`}>{chipLabel}</span>}
                  onClick={() => navigate(`/app/pending-transactions/${tx.id}`)}
                />
              )
            })}
          </GroupedCard>
        )}
      </QueryState>
    </AppPage>
  )
}
