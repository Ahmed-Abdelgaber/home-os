import { useNavigate } from 'react-router-dom'
import { cardOutline } from 'ionicons/icons'
import { useQueryClient } from '@tanstack/react-query'
import { formatShortDate } from '../../core/utils/cairoDate'
import { usePendingBankTransactions } from '../../features/bank-transactions/useBankTransactions'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
import './PendingTransactionsPage.css'

export function PendingTransactionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const transactions = usePendingBankTransactions()

  return (
    <AppPage
      title="Pending Transactions"
      backHref="/app/tabs/more"
      onRefresh={async () => {
        await queryClient.invalidateQueries({ queryKey: ['bank_transactions'] })
      }}
    >
      <QueryState
        query={transactions}
        skeleton={
          <div className="homeos-transactions-skeleton-stack">
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
          </div>
        }
        error="Couldn't load bank transactions."
        empty="No pending bank transactions."
      >
        {(items) => (
          <GroupedCard>
            {items.map((tx) => {
              const dateStr = tx.transactionAt ? formatShortDate(tx.transactionAt) : formatShortDate(tx.receivedAt)
              const cardHint = tx.cardLast4 ? `Card •••• ${tx.cardLast4}` : 'Card'
              const formattedAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              const merchant = tx.merchantRaw || 'Unknown Merchant'
              const meta = `${merchant} • ${cardHint} • ${dateStr}`

              return (
                <Row
                  key={tx.id}
                  icon={cardOutline}
                  tone="warning"
                  title={formattedAmount}
                  meta={meta}
                  accessory={
                    <span className="homeos-status-chip homeos-status-chip--warning">
                      Pending
                    </span>
                  }
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
