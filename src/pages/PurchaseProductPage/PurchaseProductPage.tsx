import { zodResolver } from '@hookform/resolvers/zod'
import { cubeOutline } from 'ionicons/icons'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { cairoToday } from '../../core/utils/cairoDate'
import { useActiveAccounts } from '../../features/master-data/useAccounts'
import { useProduct } from '../../features/products/useProductDetail'
import { type ActiveProduct, useActiveProducts } from '../../features/products/useProducts'
import { usePurchaseProduct } from '../../features/products/usePurchaseProduct'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { Row } from '../../shared/components/Row'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import './PurchaseProductPage.css'

export interface PurchasePrefillState {
  productId?: string
  productName?: string
  quantity?: number | string
  merchant?: string | null
  accountId?: string | null
  previousAmount?: number | null
}

const purchaseSchema = z.object({
  quantity: z.string().refine((value) => Number(value) > 0, 'Quantity must be greater than 0'),
  amount: z.string().refine((value) => Number(value) > 0, 'Amount must be greater than 0'),
  merchant: z.string().optional(),
  accountId: z.string().min(1, 'Select an account'),
  purchaseDate: z.string().min(1, 'Select a date'),
  notes: z.string().optional(),
  startNow: z.boolean(),
})

type PurchaseFormValues = z.infer<typeof purchaseSchema>

export function PurchaseProductPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as PurchasePrefillState | null) ?? null

  const [pickedProduct, setPickedProduct] = useState<ActiveProduct | null>(null)
  const [clearedPrefill, setClearedPrefill] = useState(false)

  const activePrefill = clearedPrefill ? null : prefill
  const prefillProductId = activePrefill?.productId

  const productQuery = useProduct(prefillProductId)

  const handleChangeProduct = () => {
    setClearedPrefill(true)
    setPickedProduct(null)
  }

  // If prefilled with a productId, validate against product status
  if (prefillProductId && !clearedPrefill) {
    if (productQuery.isLoading) {
      return (
        <AppPage title="Buy Product" backHref="/app/tabs/home">
          <div className="homeos-purchase-skeleton-stack">
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={60} />
          </div>
        </AppPage>
      )
    }

    if (productQuery.isError || !productQuery.data) {
      return (
        <AppPage title="Buy Product" backHref="/app/tabs/home">
          <EmptyState message="Couldn't load product for purchase." />
        </AppPage>
      )
    }

    if (!productQuery.data.isActive) {
      return (
        <AppPage title="Buy Product" backHref="/app/tabs/home">
          <div className="homeos-purchase-inactive-card">
            <h2 className="homeos-purchase-inactive-title">{productQuery.data.name} is archived</h2>
            <p className="homeos-purchase-inactive-desc">
              This product is currently inactive and cannot be purchased. Reactivate it from Product Details or select another product.
            </p>
            <div className="homeos-purchase-inactive-actions">
              <PrimaryButton onClick={() => navigate(`/app/products/${productQuery.data.id}`)}>
                View product
              </PrimaryButton>
              <SecondaryButton onClick={handleChangeProduct}>
                Choose another product
              </SecondaryButton>
            </div>
          </div>
        </AppPage>
      )
    }

    const prefilledActiveProduct: ActiveProduct = {
      id: productQuery.data.id,
      name: productQuery.data.name,
      categoryName: productQuery.data.categoryName,
    }

    return (
      <AppPage title="Buy Product" backHref="/app/tabs/home">
        <PurchaseForm
          product={prefilledActiveProduct}
          prefill={activePrefill}
          onChangeProduct={handleChangeProduct}
          onPurchased={(itemId) => navigate(`/app/items/${itemId}`, { replace: true })}
        />
      </AppPage>
    )
  }

  return (
    <AppPage title="Buy Product" backHref="/app/tabs/home">
      {pickedProduct ? (
        <PurchaseForm
          product={pickedProduct}
          prefill={null}
          onChangeProduct={() => setPickedProduct(null)}
          onPurchased={(itemId) => navigate(`/app/items/${itemId}`, { replace: true })}
        />
      ) : (
        <ProductPicker onSelect={setPickedProduct} />
      )}
    </AppPage>
  )
}

function ProductPicker({ onSelect }: { onSelect: (product: ActiveProduct) => void }) {
  const products = useActiveProducts()

  if (products.isLoading) {
    return (
      <div className="homeos-purchase-skeleton-stack">
        <Skeleton height={60} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </div>
    )
  }

  if (products.isError || !products.data) {
    return <EmptyState message="Couldn't load products." />
  }

  if (products.data.length === 0) {
    return <EmptyState message="No products yet. Add one from More → Product Catalog." />
  }

  return (
    <GroupedCard>
      {products.data.map((product) => (
        <Row
          key={product.id}
          icon={cubeOutline}
          title={product.name}
          meta={product.categoryName ?? ''}
          onClick={() => onSelect(product)}
        />
      ))}
    </GroupedCard>
  )
}

function PurchaseForm({
  product,
  prefill,
  onChangeProduct,
  onPurchased,
}: {
  product: ActiveProduct
  prefill?: PurchasePrefillState | null
  onChangeProduct: () => void
  onPurchased: (itemId: string) => void
}) {
  const accounts = useActiveAccounts()
  const purchaseProduct = usePurchaseProduct()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const initialQuantity =
    prefill?.quantity != null && Number(prefill.quantity) > 0 ? String(prefill.quantity) : '1'

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      quantity: initialQuantity,
      amount: '',
      merchant: prefill?.merchant ?? '',
      accountId: prefill?.accountId ?? '',
      purchaseDate: cairoToday(),
      notes: '',
      startNow: true,
    },
  })

  // Ensure account selection is synced only if the account is active
  useEffect(() => {
    if (prefill?.accountId && accounts.data) {
      const isAccountActive = accounts.data.some((a) => a.id === prefill.accountId)
      if (isAccountActive) {
        setValue('accountId', prefill.accountId)
      } else {
        setValue('accountId', '')
      }
    }
  }, [accounts.data, prefill?.accountId, setValue])

  const onSubmit = async (values: PurchaseFormValues) => {
    setSubmitError(null)
    try {
      const result = await purchaseProduct.mutateAsync({
        productId: product.id,
        purchaseDate: values.purchaseDate,
        amount: Number(values.amount),
        merchant: values.merchant?.trim() || null,
        accountId: values.accountId,
        quantity: Number(values.quantity),
        notes: values.notes?.trim() || null,
        startNow: values.startNow,
      })
      onPurchased(result.item_id)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Purchase failed. Try again.')
    }
  }

  return (
    <form className="homeos-purchase-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <button type="button" className="homeos-purchase-form__product" onClick={onChangeProduct}>
        <span className="homeos-purchase-form__product-label">Product</span>
        <span className="homeos-purchase-form__product-value">{product.name} · Change</span>
      </button>

      <label className="homeos-field">
        <span className="homeos-field__label">Quantity</span>
        <input type="number" step="1" min="1" className="homeos-field__input" {...register('quantity')} />
        {errors.quantity && <span className="homeos-field__error">{errors.quantity.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Amount (EGP)</span>
        <input type="number" step="0.01" min="0" className="homeos-field__input" {...register('amount')} />
        {prefill?.previousAmount != null && prefill.previousAmount > 0 && (
          <span className="homeos-field__hint">
            Last paid EGP {prefill.previousAmount.toLocaleString('en-US')}
          </span>
        )}
        {errors.amount && <span className="homeos-field__error">{errors.amount.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Merchant</span>
        <input type="text" className="homeos-field__input" {...register('merchant')} />
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Account</span>
        <select className="homeos-field__input" {...register('accountId')} defaultValue={prefill?.accountId ?? ''}>
          <option value="" disabled>
            {accounts.isLoading ? 'Loading accounts…' : 'Select an account'}
          </option>
          {accounts.data?.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {errors.accountId && <span className="homeos-field__error">{errors.accountId.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Purchase date</span>
        <input type="date" className="homeos-field__input" {...register('purchaseDate')} />
        {errors.purchaseDate && <span className="homeos-field__error">{errors.purchaseDate.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Notes</span>
        <textarea className="homeos-field__input homeos-field__input--textarea" rows={3} {...register('notes')} />
      </label>

      <label className="homeos-purchase-form__toggle">
        <input type="checkbox" {...register('startNow')} />
        <span>Start using now</span>
      </label>

      {submitError && (
        <p className="homeos-purchase-form__error" role="alert">
          {submitError}
        </p>
      )}

      <PrimaryButton type="submit" disabled={isSubmitting || accounts.isLoading}>
        {isSubmitting ? 'Buying…' : `Buy ${product.name}`}
      </PrimaryButton>
    </form>
  )
}
