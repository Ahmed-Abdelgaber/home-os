import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IonIcon, useIonToast } from '@ionic/react'
import { addOutline, checkmarkCircle, informationCircleOutline, receiptOutline } from 'ionicons/icons'
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
import { FactRow } from '../../shared/components/FactRow'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { SectionHeader } from '../../shared/components/SectionHeader'
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
          Allocate {money(tx.currency, summary.remaining)}
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
    <AppPage className="homeos-compact-ledger homeos-directory-page homeos-transaction-page" fullscreen={false} title="Transaction" backHref="/app/pending-transactions" footer={footer}>
      <QueryState
        query={transactionQuery}
        skeleton={
          <div className="homeos-splitter__skeleton">
            <Skeleton height={18} width="55%" variant="text" />
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

          const statusLabel = settled
            ? 'Fulfilled'
            : isIgnored
            ? 'Ignored'
            : totalAllocated > 0
            ? 'Partially fulfilled'
            : 'Not allocated'

          const statusTone = settled ? 'active' : isIgnored ? 'finished' : totalAllocated > 0 ? 'warning' : 'danger'

          const canIgnore = transaction.status === 'pending' && totalAllocated === 0

          return (
            <div className="homeos-splitter">
              <section
                className={`homeos-splitter__ledger ${settled ? 'homeos-splitter__ledger--settled' : ''}`}
              >
                <div className="homeos-splitter__identity">
                  <h1 className="homeos-splitter__merchant">
                    {transaction.merchantRaw || 'Unknown merchant'}
                  </h1>
                  <span className={`homeos-status-chip homeos-status-chip--${statusTone}`}>{statusLabel}</span>
                </div>

                <p className="homeos-splitter__headline-label">
                  {settled ? 'Fully allocated' : totalAllocated > 0 ? 'Remaining' : 'To allocate'}
                </p>
                <p className="homeos-splitter__headline-amount">
                  {money(transaction.currency, settled ? transaction.amount : remaining)}
                </p>

                <div
                  className="homeos-splitter__track"
                  role="progressbar"
                  aria-label="Amount allocated"
                  aria-valuenow={Math.round(allocatedPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="homeos-splitter__fill" style={{ width: `${allocatedPercent}%` }} />
                </div>

                <dl className="homeos-splitter__tally">
                  <div className="homeos-splitter__tally-cell">
                    <dt>Total</dt>
                    <dd>{money(transaction.currency, transaction.amount)}</dd>
                  </div>
                  <div className="homeos-splitter__tally-cell">
                    <dt>Allocated</dt>
                    <dd>{money(transaction.currency, totalAllocated)}</dd>
                  </div>
                </dl>

                {settled && (
                  <p className="homeos-splitter__settled-note">
                    <IonIcon icon={checkmarkCircle} aria-hidden="true" />
                    Every pound on this transaction is accounted for in HomeOS.
                  </p>
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

              <section className="homeos-splitter__section">
                <SectionHeader icon={informationCircleOutline} title="Transaction details" />
                <GroupedCard>
                  {formatTimestampDate(transaction.transactionAt) && (
                    <FactRow label="Date" value={formatTimestampDate(transaction.transactionAt)} />
                  )}
                  {formatTimestampDateTime(transaction.receivedAt) ? (
                    <FactRow label="Received" value={formatTimestampDateTime(transaction.receivedAt)} />
                  ) : formatTimestampDate(transaction.receivedAt) ? (
                    <FactRow label="Received" value={formatTimestampDate(transaction.receivedAt)} />
                  ) : null}
                  <FactRow label="Bank" value={transaction.bank} />
                  <FactRow label="Card" value={transaction.cardLast4 ? `•••• ${transaction.cardLast4}` : 'N/A'} />
                  {transaction.transactionType && (
                    <FactRow label="Type" value={transaction.transactionType.toUpperCase()} />
                  )}
                </GroupedCard>
              </section>

              <details className="homeos-splitter__source">
                <summary className="homeos-splitter__source-summary">Original bank message</summary>
                <div className="homeos-splitter__raw">{transaction.rawMessage}</div>
              </details>

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
