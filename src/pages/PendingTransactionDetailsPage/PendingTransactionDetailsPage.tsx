import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IonIcon, useIonToast } from '@ionic/react'
import {
  addOutline,
  businessOutline,
  calendarOutline,
  cardOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  informationCircleOutline,
  pricetagOutline,
  receiptOutline,
  timeOutline,
} from 'ionicons/icons'
import { formatTimestampDate, formatTimestampDateTime } from '../../core/utils/cairoDate'
import { BankTransactionAllocationsList } from '../../features/bank-transactions/BankTransactionAllocationsList'
import { FulfillTransactionModal } from '../../features/bank-transactions/FulfillTransactionModal'
import {
  calculateAllocationSummary,
  useBankTransactionAllocations,
  useBankTransactionDetails,
  useIgnoreBankTransaction,
} from '../../features/bank-transactions/useBankTransactions'
import { AppPage } from '../../shared/components/AppPage'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { Skeleton } from '../../shared/components/Skeleton'
import '../../shared/components/CompactLedger.css'
import '../../shared/components/CompactList.css'
import './PendingTransactionDetailsPage.css'

function money(currency: string, value: number): string {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Calculates a progressive color from unallocated Red (#c23553)
 * through Amber (#d8891d) to fully fulfilled Green (#147a52).
 */
function getFulfillProgressColor(percent: number, isIgnored: boolean): string {
  if (isIgnored) return 'var(--ledger-muted)'
  if (percent <= 0) return '#c23553'
  if (percent >= 100) return '#147a52'

  if (percent < 50) {
    const t = percent / 50
    // Red (194, 53, 83) to Amber (216, 137, 29)
    const r = Math.round(194 + (216 - 194) * t)
    const g = Math.round(53 + (137 - 53) * t)
    const b = Math.round(83 + (29 - 83) * t)
    return `rgb(${r}, ${g}, ${b})`
  } else {
    const t = (percent - 50) / 50
    // Amber (216, 137, 29) to Green (20, 122, 82)
    const r = Math.round(216 + (20 - 216) * t)
    const g = Math.round(137 + (122 - 137) * t)
    const b = Math.round(29 + (82 - 29) * t)
    return `rgb(${r}, ${g}, ${b})`
  }
}


/**
 * The receipt splitter. One bank transaction is reconciled against one or more HomeOS
 * expenses; this screen's whole job is to keep the remaining balance in view while the
 * user adds allocations one at a time.
 *
 * Every write still goes through the existing fulfil/allocate RPCs — the modal hands off to
 * the expense and purchase forms exactly as before, and this page only reads the totals back.
 */
export function PendingTransactionDetailsPage() {
  const { id, transactionId } = useParams<{ id?: string; transactionId?: string }>()
  const effectiveId = transactionId ?? id
  const navigate = useNavigate()
  const [presentToast] = useIonToast()
  const [showFulfillModal, setShowFulfillModal] = useState(false)
  const [showIgnoreConfirm, setShowIgnoreConfirm] = useState(false)

  const transactionQuery = useBankTransactionDetails(effectiveId)
  const allocationsQuery = useBankTransactionAllocations(effectiveId)
  const ignoreMutation = useIgnoreBankTransaction()

  const tx = transactionQuery.data
  const allocations = allocationsQuery.data ?? []
  const summary = tx ? calculateAllocationSummary(tx.amount, allocations) : null

  const canFulfill = Boolean(
    tx &&
      summary &&
      tx.status !== 'ignored' &&
      tx.status !== 'fulfilled' &&
      !summary.isFullyAllocated &&
      summary.remaining > 0,
  )

  // Sticky above the safe area so the next allocation is always one thumb-reach away,
  // however far down the allocation list has grown.
  const footer =
    canFulfill && tx && summary ? (
      <div className="homeos-splitter__footer">
        <PrimaryButton className="homeos-splitter__add" onClick={() => setShowFulfillModal(true)}>
          <IonIcon icon={addOutline} aria-hidden="true" />
          <span>Allocate {money(tx.currency, summary.remaining)}</span>
        </PrimaryButton>
      </div>
    ) : null

  const handleIgnore = async (transaction: NonNullable<typeof tx>) => {
    try {
      await ignoreMutation.mutateAsync(transaction.id)
      setShowIgnoreConfirm(false)
      presentToast({ message: 'Transaction marked as ignored', duration: 2000, position: 'bottom' })
      navigate('/app/pending-transactions', { replace: true })
    } catch (err) {
      presentToast({
        message: err instanceof Error ? err.message : 'Could not ignore transaction',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      })
    }
  }

  return (
    <AppPage
      className="homeos-compact-ledger homeos-directory-page homeos-transaction-page"
      fullscreen={false}
      title="Transaction"
      backHref="/app/pending-transactions"
      footer={footer}
    >
      <QueryState
        query={transactionQuery}
        skeleton={
          <div className="homeos-splitter__skeleton">
            <Skeleton height={24} width="55%" variant="text" />
            <Skeleton height={188} />
            <Skeleton height={140} />
          </div>
        }
        error="Transaction not found or could not be loaded."
      >
        {(transaction) => {
          const { totalAllocated, remaining, isFullyAllocated } = calculateAllocationSummary(
            transaction.amount,
            allocations,
          )

          const allocatedPercent =
            transaction.amount > 0
              ? Math.min(100, Math.max(0, (totalAllocated / transaction.amount) * 100))
              : 0

          const isIgnored = transaction.status === 'ignored'
          const settled = isFullyAllocated || transaction.status === 'fulfilled'
          const isPartiallyFulfilled = !settled && !isIgnored && totalAllocated > 0

          const statusModifier = settled
            ? 'fulfilled'
            : isPartiallyFulfilled
            ? 'partial'
            : isIgnored
            ? 'ignored'
            : 'pending'

          const statusLabel = settled
            ? 'Fulfilled'
            : isIgnored
            ? 'Ignored'
            : isPartiallyFulfilled
            ? 'Partial'
            : 'Not allocated'

          const canIgnore = transaction.status === 'pending' && totalAllocated === 0

          const progressColor = getFulfillProgressColor(allocatedPercent, isIgnored)

          return (
            <div className="homeos-splitter">
              <section
                className={`homeos-splitter__ledger homeos-splitter__ledger--${statusModifier}`}
              >
                <div className="homeos-splitter__identity">
                  <div className="homeos-splitter__identity-main">
                    <div
                      className={`homeos-tx-card__icon homeos-tx-card__icon--${statusModifier}`}
                      aria-hidden="true"
                    >
                      <IonIcon icon={settled ? checkmarkCircleOutline : cardOutline} />
                    </div>
                    <div className="homeos-splitter__identity-copy">
                      <h1 className="homeos-splitter__merchant">
                        {transaction.merchantRaw || 'Unknown Merchant'}
                      </h1>
                      <span className="homeos-splitter__meta-line">
                        {formatTimestampDate(transaction.transactionAt) ||
                          formatTimestampDate(transaction.receivedAt) ||
                          'Bank Transaction'}
                        {transaction.bank ? ` • ${transaction.bank}` : ''}
                        {transaction.cardLast4 ? ` • •••• ${transaction.cardLast4}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className={`homeos-tx-badge homeos-tx-badge--${statusModifier}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="homeos-splitter__balance">
                  <p className="homeos-splitter__headline-label">
                    {settled
                      ? 'Fully allocated'
                      : isIgnored
                      ? 'Transaction amount'
                      : isPartiallyFulfilled
                      ? 'Remaining to allocate'
                      : 'To allocate'}
                  </p>
                  <p
                    className={`homeos-splitter__headline-amount homeos-splitter__headline-amount--${statusModifier}`}
                    style={{ color: progressColor }}
                  >
                    {money(
                      transaction.currency,
                      settled ? transaction.amount : isIgnored ? transaction.amount : remaining,
                    )}
                  </p>
                </div>

                {(isPartiallyFulfilled || settled) && (
                  <div
                    className="homeos-splitter__track"
                    role="progressbar"
                    aria-label="Amount allocated"
                    aria-valuenow={Math.round(allocatedPercent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`homeos-splitter__fill homeos-splitter__fill--${statusModifier}`}
                      style={{ width: `${allocatedPercent}%`, backgroundColor: progressColor }}
                    />
                  </div>
                )}

                <dl className="homeos-splitter__tally">
                  <div className="homeos-splitter__tally-cell">
                    <dt>Total</dt>
                    <dd>{money(transaction.currency, transaction.amount)}</dd>
                  </div>
                  <div className="homeos-splitter__tally-cell">
                    <dt>Allocated</dt>
                    <dd>{money(transaction.currency, totalAllocated)}</dd>
                  </div>
                  {isPartiallyFulfilled && (
                    <div className="homeos-splitter__tally-cell">
                      <dt>Remaining</dt>
                      <dd className="homeos-splitter__tally-remaining">
                        {money(transaction.currency, remaining)}
                      </dd>
                    </div>
                  )}
                </dl>

                {settled && (
                  <div className="homeos-splitter__note homeos-splitter__note--settled">
                    <IonIcon icon={checkmarkCircle} aria-hidden="true" />
                    <span>Every pound on this transaction is accounted for in HomeOS.</span>
                  </div>
                )}

                {isIgnored && (
                  <div className="homeos-splitter__note homeos-splitter__note--ignored">
                    <IonIcon icon={informationCircleOutline} aria-hidden="true" />
                    <span>This transaction is marked as ignored and will not create an expense in HomeOS.</span>
                  </div>
                )}
              </section>

              {allocations.length > 0 ? (
                <BankTransactionAllocationsList allocations={allocations} currency={transaction.currency} />
              ) : (
                canFulfill && (
                  <section className="homeos-splitter__start">
                    <span className="homeos-splitter__start-icon" aria-hidden="true">
                      <IonIcon icon={receiptOutline} />
                    </span>
                    <p className="homeos-splitter__start-title">Split this receipt</p>
                    <p className="homeos-splitter__start-copy">
                      Add each purchase or expense it paid for. The remaining balance drops as you go,
                      and you can stop and come back at any point.
                    </p>
                  </section>
                )
              )}

              <section className="homeos-splitter__section" aria-label="Transaction details">
                <div className="homeos-ledger-day__heading">
                  <h2>Transaction details</h2>
                </div>
                <ul className="homeos-tx-details-list">
                  {formatTimestampDate(transaction.transactionAt) && (
                    <li className="homeos-tx-detail-row">
                      <span className="homeos-tx-detail-row__label">
                        <IonIcon icon={calendarOutline} aria-hidden="true" />
                        <span>Date</span>
                      </span>
                      <span className="homeos-tx-detail-row__value">
                        {formatTimestampDate(transaction.transactionAt)}
                      </span>
                    </li>
                  )}
                  {(formatTimestampDateTime(transaction.receivedAt) || formatTimestampDate(transaction.receivedAt)) && (
                    <li className="homeos-tx-detail-row">
                      <span className="homeos-tx-detail-row__label">
                        <IonIcon icon={timeOutline} aria-hidden="true" />
                        <span>Received</span>
                      </span>
                      <span className="homeos-tx-detail-row__value">
                        {formatTimestampDateTime(transaction.receivedAt) || formatTimestampDate(transaction.receivedAt)}
                      </span>
                    </li>
                  )}
                  <li className="homeos-tx-detail-row">
                    <span className="homeos-tx-detail-row__label">
                      <IonIcon icon={businessOutline} aria-hidden="true" />
                      <span>Bank</span>
                    </span>
                    <span className="homeos-tx-detail-row__value">{transaction.bank}</span>
                  </li>
                  <li className="homeos-tx-detail-row">
                    <span className="homeos-tx-detail-row__label">
                      <IonIcon icon={cardOutline} aria-hidden="true" />
                      <span>Card</span>
                    </span>
                    <span className="homeos-tx-detail-row__value">
                      {transaction.cardLast4 ? `•••• ${transaction.cardLast4}` : 'N/A'}
                    </span>
                  </li>
                  {transaction.transactionType && (
                    <li className="homeos-tx-detail-row">
                      <span className="homeos-tx-detail-row__label">
                        <IonIcon icon={pricetagOutline} aria-hidden="true" />
                        <span>Type</span>
                      </span>
                      <span className="homeos-tx-detail-row__value">
                        {transaction.transactionType.toUpperCase()}
                      </span>
                    </li>
                  )}
                </ul>
              </section>

              {transaction.rawMessage && (
                <details className="homeos-splitter__source">
                  <summary className="homeos-splitter__source-summary">Original bank message</summary>
                  <div className="homeos-splitter__raw">{transaction.rawMessage}</div>
                </details>
              )}

              {canIgnore && (
                <SecondaryButton
                  className="homeos-splitter__ignore"
                  disabled={ignoreMutation.isPending}
                  onClick={() => setShowIgnoreConfirm(true)}
                >
                  {ignoreMutation.isPending ? 'Updating…' : 'Ignore this transaction'}
                </SecondaryButton>
              )}

              <FulfillTransactionModal
                isOpen={showFulfillModal}
                onClose={() => setShowFulfillModal(false)}
                transaction={transaction}
                remainingAmount={remaining}
                totalAllocated={totalAllocated}
              />

              <ConfirmationSheet
                isOpen={showIgnoreConfirm}
                header="Ignore Transaction?"
                message="This bank transaction will be marked as ignored. It will not create an Expense or Item in HomeOS."
                confirmLabel="Ignore"
                onConfirm={() => handleIgnore(transaction)}
                onCancel={() => setShowIgnoreConfirm(false)}
              />
            </div>
          )
        }}
      </QueryState>
    </AppPage>
  )
}

