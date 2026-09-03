import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useIonToast } from '@ionic/react'
import { cardOutline, cartOutline } from 'ionicons/icons'
import { cairoToday } from '../../core/utils/cairoDate'
import { useActiveAccounts } from '../../features/master-data/useAccounts'
import { usePurchaseProduct } from '../../features/products/usePurchaseProduct'
import { useRemoveFromShoppingList } from '../../features/shopping-list/useShoppingListMutations'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { SectionHeader } from '../../shared/components/SectionHeader'
import type { ShoppingListItem } from '../../features/shopping-list/shoppingListTypes'
import './BuySelectedPage.css'

interface PerProductState {
  amount: string
  quantity: number
  state: 'active' | 'stocked'
  error?: string
}

export function BuySelectedPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [presentToast] = useIonToast()
  const accounts = useActiveAccounts()
  const purchaseProduct = usePurchaseProduct()
  const removeFromShoppingList = useRemoveFromShoppingList()

  const initialItems = (location.state as { selectedItems?: ShoppingListItem[] } | null)?.selectedItems ?? []
  const [itemsToBuy, setItemsToBuy] = useState<ShoppingListItem[]>(initialItems)

  const [sharedPurchaseDate, setSharedPurchaseDate] = useState(cairoToday())
  const [sharedMerchant, setSharedMerchant] = useState('')
  const [sharedAccountId, setSharedAccountId] = useState('')
  const [sharedAccountError, setSharedAccountError] = useState<string | null>(null)

  const [productsState, setProductsState] = useState<Record<string, PerProductState>>(() => {
    const state: Record<string, PerProductState> = {}
    for (const item of initialItems) {
      state[item.id] = {
        amount: '',
        quantity: 1,
        state: 'active',
      }
    }
    return state
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-select first active account once loaded
  useEffect(() => {
    if (!sharedAccountId && accounts.data && accounts.data.length > 0) {
      setSharedAccountId(accounts.data[0].id)
    }
  }, [accounts.data, sharedAccountId])

  if (itemsToBuy.length === 0) {
    return (
      <AppPage title="Buy Selected" backHref="/app/shopping-list">
        <GroupedCard className="homeos-buy-selected__shared">
          <p>No products selected for purchase.</p>
          <PrimaryButton onClick={() => navigate('/app/shopping-list', { replace: true })}>
            Return to shopping list
          </PrimaryButton>
        </GroupedCard>
      </AppPage>
    )
  }

  const handleFieldChange = (itemId: string, patch: Partial<PerProductState>) => {
    setProductsState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...patch,
        error: undefined, // Clear error when user edits
      },
    }))
  }

  const handleConfirmPurchases = async () => {
    if (!sharedAccountId) {
      setSharedAccountError('Select an account')
      return
    }
    setSharedAccountError(null)

    // Validate all amounts and quantities
    let hasValidationError = false
    const validatedState = { ...productsState }

    for (const item of itemsToBuy) {
      const p = validatedState[item.id]
      const numAmount = parseFloat(p.amount)
      if (!p.amount || isNaN(numAmount) || numAmount <= 0) {
        validatedState[item.id] = { ...p, error: 'Enter a valid amount > 0' }
        hasValidationError = true
      } else if (!p.quantity || p.quantity <= 0) {
        validatedState[item.id] = { ...p, error: 'Quantity must be at least 1' }
        hasValidationError = true
      }
    }

    if (hasValidationError) {
      setProductsState(validatedState)
      return
    }

    setIsSubmitting(true)
    const succeededItemIds: string[] = []
    const updatedState = { ...productsState }

    for (const item of itemsToBuy) {
      const p = productsState[item.id]
      const numAmount = parseFloat(p.amount)

      try {
        await purchaseProduct.mutateAsync({
          productId: item.productId,
          purchaseDate: sharedPurchaseDate,
          amount: numAmount,
          merchant: sharedMerchant.trim() || null,
          accountId: sharedAccountId,
          quantity: p.quantity,
          notes: null,
          startNow: p.state === 'active',
        })

        // Remove from shopping list only upon successful purchase
        await removeFromShoppingList.mutateAsync(item.id)
        succeededItemIds.push(item.id)
      } catch (err) {
        updatedState[item.id] = {
          ...p,
          error: err instanceof Error ? err.message : 'Purchase failed. Try again.',
        }
      }
    }

    setIsSubmitting(false)
    setProductsState(updatedState)

    if (succeededItemIds.length === itemsToBuy.length) {
      presentToast({
        message: 'All purchases recorded successfully',
        duration: 2000,
        position: 'bottom',
      })
      navigate('/app/shopping-list', { replace: true })
    } else {
      // Partial failure: remove succeeded items from the form view
      setItemsToBuy((prev) => prev.filter((item) => !succeededItemIds.includes(item.id)))
      presentToast({
        message: `${succeededItemIds.length} purchased. ${itemsToBuy.length - succeededItemIds.length} failed.`,
        duration: 3000,
        position: 'bottom',
      })
    }
  }

  return (
    <AppPage title="Buy Selected" backHref="/app/shopping-list">
      <div className="homeos-buy-selected">
        <section>
          <SectionHeader icon={cardOutline} title="Shared purchase details" />
          <GroupedCard className="homeos-buy-selected__shared">
            <label className="homeos-field">
              <span className="homeos-field__label">Purchase date</span>
              <input
                type="date"
                className="homeos-field__input"
                value={sharedPurchaseDate}
                onChange={(e) => setSharedPurchaseDate(e.target.value)}
              />
            </label>

            <label className="homeos-field">
              <span className="homeos-field__label">Merchant (optional)</span>
              <input
                type="text"
                className="homeos-field__input"
                placeholder="Store or vendor"
                value={sharedMerchant}
                onChange={(e) => setSharedMerchant(e.target.value)}
              />
            </label>

            <label className="homeos-field">
              <span className="homeos-field__label">Paid from account</span>
              <select
                className="homeos-field__input"
                value={sharedAccountId}
                onChange={(e) => setSharedAccountId(e.target.value)}
              >
                <option value="" disabled>
                  Select an account
                </option>
                {(accounts.data ?? []).map((acc: { id: string; name: string }) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              {sharedAccountError && <span className="homeos-field__error">{sharedAccountError}</span>}
            </label>
          </GroupedCard>
        </section>

        <section>
          <SectionHeader icon={cartOutline} title={`Selected products (${itemsToBuy.length})`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--homeos-space-16)' }}>
            {itemsToBuy.map((item) => {
              const p = productsState[item.id] || { amount: '', quantity: 1, state: 'active' }
              return (
                <GroupedCard key={item.id} className="homeos-buy-selected__product-card">
                  <div className="homeos-buy-selected__product-header">
                    <div>
                      <h3 className="homeos-buy-selected__product-title">{item.productName}</h3>
                      {item.categoryName && (
                        <span className="homeos-buy-selected__product-meta">{item.categoryName}</span>
                      )}
                    </div>
                  </div>

                  <div className="homeos-buy-selected__row-fields">
                    <label className="homeos-field">
                      <span className="homeos-field__label">Amount (EGP)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="homeos-field__input"
                        value={p.amount}
                        onChange={(e) => handleFieldChange(item.id, { amount: e.target.value })}
                      />
                    </label>

                    <label className="homeos-field">
                      <span className="homeos-field__label">Quantity</span>
                      <input
                        type="number"
                        min="1"
                        className="homeos-field__input"
                        value={p.quantity}
                        onChange={(e) =>
                          handleFieldChange(item.id, { quantity: parseInt(e.target.value, 10) || 1 })
                        }
                      />
                    </label>
                  </div>

                  <div className="homeos-buy-selected__state-selector">
                    <span className="homeos-buy-selected__state-label">Item status</span>
                    <div className="homeos-buy-selected__state-options">
                      <button
                        type="button"
                        className={`homeos-buy-selected__state-btn ${
                          p.state === 'active' ? 'homeos-buy-selected__state-btn--active' : ''
                        }`}
                        onClick={() => handleFieldChange(item.id, { state: 'active' })}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        className={`homeos-buy-selected__state-btn ${
                          p.state === 'stocked' ? 'homeos-buy-selected__state-btn--active' : ''
                        }`}
                        onClick={() => handleFieldChange(item.id, { state: 'stocked' })}
                      >
                        Stocked
                      </button>
                    </div>
                  </div>

                  {p.error && (
                    <p className="homeos-buy-selected__product-error" role="alert">
                      {p.error}
                    </p>
                  )}
                </GroupedCard>
              )
            })}
          </div>
        </section>

        <div className="homeos-buy-selected__footer">
          <PrimaryButton onClick={handleConfirmPurchases} disabled={isSubmitting}>
            {isSubmitting ? 'Processing purchases…' : `Confirm purchases (${itemsToBuy.length})`}
          </PrimaryButton>
        </div>
      </div>
    </AppPage>
  )
}
