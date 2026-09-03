import { cardOutline } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { formatShortDate } from '../../core/utils/cairoDate'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { Row } from '../../shared/components/Row'
import { SectionHeader } from '../../shared/components/SectionHeader'
import { usePendingBankTransactions } from './useBankTransactions'
import './PendingTransactionsSection.css'

interface PendingTransactionsSectionProps {
  /** If true, renders section header; default true */
  showHeader?: boolean
}

export function PendingTransactionsSection({ showHeader = true }: PendingTransactionsSectionProps) {
  const navigate = useNavigate()
  const { data: pendingItems, isLoading } = usePendingBankTransactions()

  if (isLoading || !pendingItems || pendingItems.length === 0) {
    return null
  }

  return (
    <section className="homeos-pending-transactions-section">
      {showHeader && (
        <SectionHeader
          icon={cardOutline}
          title={`Pending Bank Transactions (${pendingItems.length})`}
        />
      )}
      <GroupedCard>
        {pendingItems.map((tx) => {
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
    </section>
  )
}
