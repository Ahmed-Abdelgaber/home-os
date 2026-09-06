import { IonIcon } from '@ionic/react'
import { cardOutline, chevronForward } from 'ionicons/icons'
import { Link } from 'react-router-dom'
import { formatTimestampDate } from '../../core/utils/cairoDate'
import { Skeleton } from '../../shared/components/Skeleton'
import { usePendingBankTransactions } from '../bank-transactions/useBankTransactions'
import { formatExpenseAmount } from './expenseLedger'

export function ExpensePendingCards() {
  const pending = usePendingBankTransactions()
  if (pending.isLoading) return <Skeleton height={96} />
  if (pending.isError) return <p className="homeos-ledger-feedback" role="alert">Couldn't load pending transactions. <button type="button" onClick={() => void pending.refetch()}>Retry</button></p>
  if (!pending.data?.length) return null
  return <section aria-label="Pending transactions" className="homeos-ledger-pending">
    {pending.data.map((tx) => {
      const isPartial = tx.status === 'partially_fulfilled'
      const knownRemaining = !isPartial || tx.remainingAmount !== undefined
      const date = formatTimestampDate(tx.transactionAt) || formatTimestampDate(tx.receivedAt)
      return <Link className="homeos-ledger-pending__card" key={tx.id} to={`/app/pending-transactions/${tx.id}`}>
        <span className="homeos-ledger-pending__icon"><IonIcon icon={cardOutline} aria-hidden="true" /></span>
        <span className="homeos-ledger-pending__copy">
          <span className="homeos-ledger-pending__label">Pending transaction</span>
          <strong dir="auto">{tx.merchantRaw || 'Unknown merchant'}</strong>
          <span className="homeos-ledger-meta">{[tx.cardLast4 ? `Card •••• ${tx.cardLast4}` : null, date].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="homeos-ledger-pending__amount"><strong>{formatExpenseAmount(tx.remainingAmount ?? tx.amount, tx.currency)}</strong><span>{knownRemaining ? 'remaining' : 'total · partially allocated'}</span></span>
        <IonIcon className="homeos-ledger-chevron" icon={chevronForward} aria-hidden="true" />
      </Link>
    })}
  </section>
}
