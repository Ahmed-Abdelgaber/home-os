import { zodResolver } from '@hookform/resolvers/zod'
import { cubeOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { cairoToday } from '../../core/utils/cairoDate'
import { useActiveAccounts } from '../../features/master-data/useAccounts'
import { type ActiveProduct, useActiveProducts } from '../../features/products/useProducts'
import { usePurchaseProduct } from '../../features/products/usePurchaseProduct'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
import './PurchaseProductPage.css'

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
  const [product, setProduct] = useState<ActiveProduct | null>(null)

  return (
    <AppPage title="Buy Product" backHref="/app/tabs/home">
      {product ? (
        <PurchaseForm
          product={product}
          onChangeProduct={() => setProduct(null)}
          onPurchased={(itemId) => navigate(`/app/items/${itemId}`, { replace: true })}
        />
      ) : (
        <ProductPicker onSelect={setProduct} />
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
  onChangeProduct,
  onPurchased,
}: {
  product: ActiveProduct
  onChangeProduct: () => void
  onPurchased: (itemId: string) => void
}) {
  const accounts = useActiveAccounts()
  const purchaseProduct = usePurchaseProduct()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { quantity: '1', purchaseDate: cairoToday(), startNow: true },
  })

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
        {errors.amount && <span className="homeos-field__error">{errors.amount.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Merchant</span>
        <input type="text" className="homeos-field__input" {...register('merchant')} />
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Account</span>
        <select className="homeos-field__input" {...register('accountId')} defaultValue="">
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
