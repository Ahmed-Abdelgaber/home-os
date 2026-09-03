import { cardOutline } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { formatTimestampDate } from '../../core/utils/cairoDate'
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
          const txDate = formatTimestampDate(tx.transactionAt)
          const recvDate = formatTimestampDate(tx.receivedAt)
          const displayDate = txDate || recvDate || null

          const cardHint = tx.cardLast4 ? `Card •••• ${tx.cardLast4}` : 'Card'
          const formattedAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
          const merchant = tx.merchantRaw || 'Unknown Merchant'

          const isPartial = tx.status === 'partially_fulfilled'
          const metaParts: string[] = [merchant]
          if (isPartial) {
            metaParts.push('Partially Fulfilled')
          } else if (tx.cardLast4) {
            metaParts.push(cardHint)
          }
          if (displayDate) {
            metaParts.push(displayDate)
          }
          const meta = metaParts.join(' • ')

          return (
            <Row
              key={tx.id}
              icon={cardOutline}
              tone="warning"
              title={formattedAmount}
              meta={meta}
              accessory={
                <span className="homeos-status-chip homeos-status-chip--warning">
                  {isPartial ? 'Partially Fulfilled' : 'Pending'}
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
