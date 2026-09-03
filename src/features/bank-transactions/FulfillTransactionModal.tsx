import { useState } from 'react'
import { IonIcon, IonModal } from '@ionic/react'
import { cardOutline, close, cubeOutline } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { cairoDateOnlyFromTimestamp } from '../../core/utils/cairoDate'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { type BankTransaction } from './useBankTransactions'
import './FulfillTransactionModal.css'

interface FulfillTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: BankTransaction
  remainingAmount: number
  totalAllocated: number
}

type AllocationMode = 'full' | 'split'
type DestinationType = 'expense' | 'purchase'

export function FulfillTransactionModal({
  isOpen,
  onClose,
  transaction,
  remainingAmount,
  totalAllocated,
}: FulfillTransactionModalProps) {
  const navigate = useNavigate()
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('full')
  const [customAmount, setCustomAmount] = useState<string>(String(remainingAmount))
  const [destination, setDestination] = useState<DestinationType>('expense')
  const [amountError, setAmountError] = useState<string | null>(null)

  const effectiveAmount =
    allocationMode === 'full'
      ? remainingAmount
      : Number(customAmount) > 0
      ? Number(customAmount)
      : 0

  const handleModeChange = (mode: AllocationMode) => {
    setAllocationMode(mode)
    setAmountError(null)
    if (mode === 'full') {
      setCustomAmount(String(remainingAmount))
    }
  }

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val)
    const num = Number(val)
    if (isNaN(num) || num <= 0) {
      setAmountError('Enter a valid amount greater than 0')
    } else if (num > remainingAmount) {
      setAmountError(
        `Amount cannot exceed remaining ${transaction.currency} ${remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      )
    } else {
      setAmountError(null)
    }
  }

  const handleProceed = () => {
    if (effectiveAmount <= 0) {
      setAmountError('Amount must be greater than 0')
      return
    }
    if (effectiveAmount > remainingAmount) {
      setAmountError('Amount exceeds remaining unallocated amount')
      return
    }

    onClose()

    // Format transaction date if available (YYYY-MM-DD in Cairo timezone)
    const txDate = transaction.transactionAt
      ? cairoDateOnlyFromTimestamp(transaction.transactionAt) || undefined
      : undefined

    if (destination === 'expense') {
      navigate('/app/expenses/new', {
        state: {
          amount: effectiveAmount,
          merchant: transaction.merchantRaw,
          expenseDate: txDate,
          bankTransactionId: transaction.id,
        },
      })
    } else {
      navigate('/app/purchase', {
        state: {
          amount: effectiveAmount,
          merchant: transaction.merchantRaw,
          purchaseDate: txDate,
          bankTransactionId: transaction.id,
        },
      })
    }
  }

  const isPartiallyAllocated = totalAllocated > 0

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.88}
      breakpoints={[0, 0.88, 1]}
    >
      <div className="homeos-fulfill-modal">
        <header className="homeos-fulfill-modal__header">
          <h2 className="homeos-fulfill-modal__title">Where did this money go?</h2>
          <button
            type="button"
            className="homeos-fulfill-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            <IonIcon icon={close} />
          </button>
        </header>

        <div className="homeos-fulfill-modal__body homeos-page-rise">
          {/* Summary Card */}
          {!isPartiallyAllocated ? (
            <div className="homeos-fulfill-summary">
              <div className="homeos-fulfill-summary__meta">
                <span className="homeos-fulfill-summary__caption">Transaction Amount</span>
                {transaction.merchantRaw && (
                  <span className="homeos-fulfill-summary__merchant">{transaction.merchantRaw}</span>
                )}
              </div>
              <div className="homeos-fulfill-summary__amount-wrap">
                <span className="homeos-fulfill-summary__currency">{transaction.currency}</span>
                <span className="homeos-fulfill-summary__amount">
                  {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div className="homeos-fulfill-summary homeos-fulfill-summary--partial">
              <div className="homeos-fulfill-summary__meta">
                <span className="homeos-fulfill-summary__caption">Remaining to Allocate</span>
                {transaction.merchantRaw && (
                  <span className="homeos-fulfill-summary__merchant">{transaction.merchantRaw}</span>
                )}
              </div>
              <div className="homeos-fulfill-summary__amount-wrap">
                <span className="homeos-fulfill-summary__currency">{transaction.currency}</span>
                <span className="homeos-fulfill-summary__amount homeos-fulfill-summary__amount--highlight">
                  {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="homeos-fulfill-summary__context">
                <span>Total {transaction.currency} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="homeos-fulfill-summary__dot">•</span>
                <span>{transaction.currency} {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })} allocated</span>
              </div>
            </div>
          )}

          {/* Allocation Amount Mode */}
          <div className="homeos-fulfill-section">
            <span className="homeos-fulfill-section__title">Allocation Amount</span>
            <div className="homeos-fulfill-seg" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={allocationMode === 'full'}
                className={`homeos-fulfill-seg__btn ${
                  allocationMode === 'full' ? 'homeos-fulfill-seg__btn--active' : ''
                }`}
                onClick={() => handleModeChange('full')}
              >
                Full ({transaction.currency} {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={allocationMode === 'split'}
                className={`homeos-fulfill-seg__btn ${
                  allocationMode === 'split' ? 'homeos-fulfill-seg__btn--active' : ''
                }`}
                onClick={() => handleModeChange('split')}
              >
                Split / Partial
              </button>
            </div>

            {allocationMode === 'split' && (
              <div className="homeos-fulfill-split">
                <div className={`homeos-fulfill-split__field ${amountError ? 'homeos-fulfill-split__field--error' : ''}`}>
                  <span className="homeos-fulfill-split__prefix">{transaction.currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingAmount}
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="homeos-fulfill-split__input"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                {amountError ? (
                  <p className="homeos-fulfill-split__error" role="alert">{amountError}</p>
                ) : (
                  <p className="homeos-fulfill-split__hint">
                    Remaining {transaction.currency}{' '}
                    {Math.max(0, remainingAmount - (Number(customAmount) || 0)).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    stays available to fulfill later.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Destination Type */}
          <div className="homeos-fulfill-section">
            <span className="homeos-fulfill-section__title">Interpretation</span>
            <div className="homeos-fulfill-options" role="radiogroup" aria-label="Transaction Interpretation">
              <button
                type="button"
                role="radio"
                aria-checked={destination === 'expense'}
                className={`homeos-fulfill-option ${
                  destination === 'expense' ? 'homeos-fulfill-option--selected' : ''
                }`}
                onClick={() => setDestination('expense')}
              >
                <div className="homeos-fulfill-option__icon-wrap">
                  <IonIcon icon={cardOutline} className="homeos-fulfill-option__icon" aria-hidden="true" />
                </div>
                <div className="homeos-fulfill-option__text">
                  <span className="homeos-fulfill-option__title">Regular Expense</span>
                  <span className="homeos-fulfill-option__desc">
                    Record as a household or personal expense
                  </span>
                </div>
                <div className="homeos-fulfill-option__indicator" aria-hidden="true">
                  <span className="homeos-fulfill-option__dot" />
                </div>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={destination === 'purchase'}
                className={`homeos-fulfill-option ${
                  destination === 'purchase' ? 'homeos-fulfill-option--selected' : ''
                }`}
                onClick={() => setDestination('purchase')}
              >
                <div className="homeos-fulfill-option__icon-wrap homeos-fulfill-option__icon-wrap--product">
                  <IonIcon icon={cubeOutline} className="homeos-fulfill-option__icon" aria-hidden="true" />
                </div>
                <div className="homeos-fulfill-option__text">
                  <span className="homeos-fulfill-option__title">Product Purchase</span>
                  <span className="homeos-fulfill-option__desc">
                    Purchase inventory and start or stock an item
                  </span>
                </div>
                <div className="homeos-fulfill-option__indicator" aria-hidden="true">
                  <span className="homeos-fulfill-option__dot" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <footer className="homeos-fulfill-modal__footer">
          <p className="homeos-fulfill-modal__footer-note">
            HomeOS prefills amount, merchant, and date. You will choose category, account, and person next.
          </p>
          <PrimaryButton
            disabled={Boolean(amountError) || effectiveAmount <= 0}
            onClick={handleProceed}
          >
            Continue with {transaction.currency}{' '}
            {effectiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </PrimaryButton>
        </footer>
      </div>
    </IonModal>
  )
}
