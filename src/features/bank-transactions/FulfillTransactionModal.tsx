import { useState } from 'react'
import { IonIcon, IonModal, IonRadio, IonRadioGroup } from '@ionic/react'
import { cardOutline, close, cubeOutline } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
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
        `Amount cannot exceed remaining unallocated ${transaction.currency} ${remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
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

    // Format transaction date if available (YYYY-MM-DD)
    const txDate = transaction.transactionAt
      ? transaction.transactionAt.split('T')[0]
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

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.85}
      breakpoints={[0, 0.85, 1]}
    >
      <div className="homeos-fulfill-modal">
        <div className="homeos-fulfill-modal__header">
          <h2 className="homeos-fulfill-modal__title">Where did this money go?</h2>
          <button
            type="button"
            className="homeos-fulfill-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            <IonIcon icon={close} />
          </button>
        </div>

        <div className="homeos-fulfill-modal__body">
          {/* Summary Card */}
          <div className="homeos-fulfill-modal__summary">
            <div className="homeos-fulfill-modal__summary-row">
              <span className="homeos-fulfill-modal__summary-label">Transaction Total</span>
              <span className="homeos-fulfill-modal__summary-value">
                {transaction.currency}{' '}
                {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            {totalAllocated > 0 && (
              <div className="homeos-fulfill-modal__summary-row">
                <span className="homeos-fulfill-modal__summary-label">Already Allocated</span>
                <span className="homeos-fulfill-modal__summary-value">
                  {transaction.currency}{' '}
                  {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="homeos-fulfill-modal__summary-row homeos-fulfill-modal__summary-row--highlight">
              <span className="homeos-fulfill-modal__summary-label">Remaining to Allocate</span>
              <span className="homeos-fulfill-modal__summary-value">
                {transaction.currency}{' '}
                {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Allocation Amount Mode */}
          <div className="homeos-fulfill-modal__section">
            <label className="homeos-fulfill-modal__section-title">Allocation Amount</label>
            <div className="homeos-fulfill-modal__mode-toggle" role="tablist">
              <button
                type="button"
                className={`homeos-fulfill-modal__mode-btn ${
                  allocationMode === 'full' ? 'homeos-fulfill-modal__mode-btn--selected' : ''
                }`}
                onClick={() => handleModeChange('full')}
              >
                Full ({transaction.currency} {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
              </button>
              <button
                type="button"
                className={`homeos-fulfill-modal__mode-btn ${
                  allocationMode === 'split' ? 'homeos-fulfill-modal__mode-btn--selected' : ''
                }`}
                onClick={() => handleModeChange('split')}
              >
                Split / Partial
              </button>
            </div>

            {allocationMode === 'split' && (
              <div className="homeos-fulfill-modal__input-wrapper">
                <div className="homeos-fulfill-modal__input-field">
                  <span className="homeos-fulfill-modal__input-prefix">{transaction.currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingAmount}
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="homeos-fulfill-modal__input"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                {amountError && (
                  <p className="homeos-fulfill-modal__input-error">{amountError}</p>
                )}
                <p className="homeos-fulfill-modal__hint">
                  The remaining {transaction.currency}{' '}
                  {Math.max(0, remainingAmount - (Number(customAmount) || 0)).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}{' '}
                  will stay available to fulfill later.
                </p>
              </div>
            )}
          </div>

          {/* Destination Type */}
          <div className="homeos-fulfill-modal__section">
            <label className="homeos-fulfill-modal__section-title">Interpretation</label>
            <IonRadioGroup
              value={destination}
              onIonChange={(e) => setDestination(e.detail.value)}
            >
              <div
                className={`homeos-fulfill-modal__choice ${
                  destination === 'expense' ? 'homeos-fulfill-modal__choice--selected' : ''
                }`}
                onClick={() => setDestination('expense')}
              >
                <div className="homeos-fulfill-modal__choice-icon">
                  <IonIcon icon={cardOutline} />
                </div>
                <div className="homeos-fulfill-modal__choice-info">
                  <span className="homeos-fulfill-modal__choice-title">Regular Expense</span>
                  <span className="homeos-fulfill-modal__choice-desc">
                    Record as a household or personal expense
                  </span>
                </div>
                <IonRadio value="expense" aria-label="Regular Expense" />
              </div>

              <div
                className={`homeos-fulfill-modal__choice ${
                  destination === 'purchase' ? 'homeos-fulfill-modal__choice--selected' : ''
                }`}
                onClick={() => setDestination('purchase')}
              >
                <div className="homeos-fulfill-modal__choice-icon homeos-fulfill-modal__choice-icon--product">
                  <IonIcon icon={cubeOutline} />
                </div>
                <div className="homeos-fulfill-modal__choice-info">
                  <span className="homeos-fulfill-modal__choice-title">Product Purchase</span>
                  <span className="homeos-fulfill-modal__choice-desc">
                    Purchase an inventory product and start or stock an item
                  </span>
                </div>
                <IonRadio value="purchase" aria-label="Product Purchase" />
              </div>
            </IonRadioGroup>
          </div>

          <div className="homeos-fulfill-modal__footer">
            <p className="homeos-fulfill-modal__footer-note">
              HomeOS will prefill the amount, date, and merchant. You will select the account, category, and person manually.
            </p>
            <PrimaryButton
              disabled={Boolean(amountError) || effectiveAmount <= 0}
              onClick={handleProceed}
            >
              Continue with {transaction.currency}{' '}
              {effectiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </IonModal>
  )
}
