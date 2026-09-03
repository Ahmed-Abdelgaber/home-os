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
          const cardHint = tx.cardLast4 ? `Card •••• ${tx.cardLast4}` : null

          const formattedAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
          const merchant = tx.merchantRaw || 'Unknown Merchant'
          const isPartial = tx.status === 'partially_fulfilled'
          const meta = [cardHint, displayDate].filter(Boolean).join(' • ')

          const accessoryNode = isPartial ? (
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
          ) : (
            <span className="homeos-tx-row-amount">{formattedAmount}</span>
          )

          return (
            <Row
              key={tx.id}
              icon={cardOutline}
              tone="warning"
              title={merchant}
              meta={meta}
              accessory={accessoryNode}
              onClick={() => navigate(`/app/pending-transactions/${tx.id}`)}
            />
          )
        })}
      </GroupedCard>
    </section>
  )
}
