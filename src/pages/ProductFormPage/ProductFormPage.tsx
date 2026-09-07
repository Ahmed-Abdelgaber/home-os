import { zodResolver } from '@hookform/resolvers/zod'
import { useIonAlert } from '@ionic/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { useActiveCategories } from '../../features/master-data/useCategories'
import { useActivePeople } from '../../features/master-data/usePeople'
import { CONSUMPTION_MODES, CONSUMPTION_MODE_LABELS } from '../../features/products/consumptionMode'
import { USAGE_MODES, USAGE_MODE_LABELS, USAGE_MODE_DESCRIPTIONS } from '../../features/products/usageMode'
import { useProduct } from '../../features/products/useProductDetail'
import { useCreateProduct, useUpdateProduct } from '../../features/products/useProductMutations'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import '../../shared/components/CompactLedger.css'
import '../../shared/components/CompactList.css'
import './ProductFormPage.css'

const productSchema = z.object({
  name: z.string().min(1, 'Enter a product name'),
  categoryId: z.string().min(1, 'Select a category'),
  consumerId: z.string().min(1, 'Select a consumer'),
  usageMode: z.enum(USAGE_MODES),
  consumptionMode: z.enum(CONSUMPTION_MODES),
  notes: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export function ProductFormPage() {
  const { productId } = useParams<{ productId?: string }>()
  const isEdit = Boolean(productId)
  const navigate = useNavigate()

  const existing = useProduct(productId)
  const categories = useActiveCategories()
  const people = useActivePeople()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [presentAlert] = useIonAlert()

  const stillLoading = categories.isLoading || people.isLoading || (isEdit && existing.isLoading)
  const loadFailed = categories.isError || people.isError || !categories.data || !people.data || (isEdit && (existing.isError || !existing.data))

  const handleConfirmSubmit = (values: ProductFormValues) => {
    if (isEdit) {
      presentAlert({
        header: 'Save Changes?',
        message: 'Are you sure you want to save these changes?',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Save', handler: () => executeSubmit(values) }
        ]
      })
    } else {
      executeSubmit(values)
    }
  }

  const executeSubmit = async (values: ProductFormValues) => {
    setSubmitError(null)
    const input = {
      name: values.name,
      categoryId: values.categoryId,
      consumerId: values.consumerId,
      usageMode: values.usageMode,
      consumptionMode: values.consumptionMode,
      notes: values.notes?.trim() || null,
    }
    try {
      if (isEdit && productId) {
        await updateProduct.mutateAsync({ id: productId, input })
        navigate(`/app/products/${productId}`, { replace: true })
      } else {
        const result = await createProduct.mutateAsync(input)
        navigate(`/app/products/${result.id}`, { replace: true })
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this product. Try again.')
    }
  }

  return (
    <AppPage
      title={isEdit ? 'Edit Product' : 'Add Product'}
      backHref={isEdit && productId ? `/app/products/${productId}` : '/app/products'}
      className="homeos-compact-ledger homeos-directory-page homeos-product-form-page"
      fullscreen={false}
    >
      {stillLoading ? (
        <div className="homeos-product-form-skeleton-stack">
          <Skeleton height={64} />
          <Skeleton height={50} />
          <Skeleton height={50} />
          <Skeleton height={50} />
        </div>
      ) : loadFailed ? (
        <EmptyState message="Couldn't load categories or people." />
      ) : (
        <ProductForm
          categories={categories.data ?? []}
          people={people.data ?? []}
          defaultValues={
            existing.data
              ? {
                  name: existing.data.name,
                  categoryId: existing.data.categoryId,
                  consumerId: existing.data.consumerId,
                  usageMode: existing.data.usageMode,
                  consumptionMode: existing.data.consumptionMode,
                  notes: existing.data.notes ?? '',
                }
              : undefined
          }
          submitLabel={isEdit ? 'Save changes' : 'Add product'}
          pendingLabel={isEdit ? 'Saving…' : 'Adding…'}
          isPending={isEdit ? updateProduct.isPending : createProduct.isPending}
          submitError={submitError}
          onSubmit={handleConfirmSubmit}
        />
      )}
    </AppPage>
  )
}

function ProductForm({
  categories,
  people,
  defaultValues,
  submitLabel,
  pendingLabel,
  isPending,
  submitError,
  onSubmit,
}: {
  categories: { id: string; name: string }[]
  people: { id: string; name: string }[]
  defaultValues?: Partial<ProductFormValues>
  submitLabel: string
  pendingLabel: string
  isPending: boolean
  submitError: string | null
  onSubmit: (values: ProductFormValues) => void
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { usageMode: 'duration', consumptionMode: 'never_pause', ...defaultValues },
  })

  const watchedName = watch('name')
  const watchedCategoryId = watch('categoryId')
  const watchedUsageMode = watch('usageMode')
  const selectedCategory = categories.find((c) => c.id === watchedCategoryId)?.name
  const visual = resolveProductVisual(watchedName || defaultValues?.name || '', selectedCategory)

  return (
    <form className="homeos-product-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Live Preview Card */}
      <div className="homeos-product-form__preview">
        <span className={`homeos-list-glyph homeos-list-glyph--${visual.tone}`} aria-hidden="true">
          {visual.emoji}
        </span>
        <div className="homeos-product-form__preview-copy">
          <strong className="homeos-product-form__preview-title">
            {watchedName?.trim() || defaultValues?.name || 'New Product'}
          </strong>
          <span className="homeos-product-form__preview-subtitle">
            {selectedCategory || 'Select a category'}
          </span>
        </div>
      </div>

      <div className="homeos-product-form__fields">
        <label className="homeos-field">
          <span className="homeos-field__label">Product Name</span>
          <input
            type="text"
            className="homeos-field__input"
            placeholder="e.g. Greek Yogurt, Olive Oil…"
            autoComplete="off"
            {...register('name')}
          />
          {errors.name && <span className="homeos-field__error">{errors.name.message}</span>}
        </label>

        <label className="homeos-field">
          <span className="homeos-field__label">Category</span>
          <div className="homeos-field__select-wrap">
            <select
              className="homeos-field__input homeos-field__select"
              defaultValue={defaultValues?.categoryId ?? ''}
              {...register('categoryId')}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {errors.categoryId && <span className="homeos-field__error">{errors.categoryId.message}</span>}
        </label>

        <label className="homeos-field">
          <span className="homeos-field__label">Consumer</span>
          <div className="homeos-field__select-wrap">
            <select
              className="homeos-field__input homeos-field__select"
              defaultValue={defaultValues?.consumerId ?? ''}
              {...register('consumerId')}
            >
              <option value="" disabled>
                Select a consumer
              </option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          {errors.consumerId && <span className="homeos-field__error">{errors.consumerId.message}</span>}
        </label>

        <div className="homeos-field">
          <span className="homeos-field__label">Usage</span>
          <div className="homeos-usage-mode-options" role="radiogroup" aria-label="Usage mode">
            {USAGE_MODES.map((mode) => {
              const isSelected = watchedUsageMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`homeos-usage-mode-option ${
                    isSelected ? 'homeos-usage-mode-option--selected' : ''
                  }`}
                  onClick={() => setValue('usageMode', mode, { shouldValidate: true })}
                >
                  <strong className="homeos-usage-mode-option__title">{USAGE_MODE_LABELS[mode]}</strong>
                  <span className="homeos-usage-mode-option__desc">{USAGE_MODE_DESCRIPTIONS[mode]}</span>
                </button>
              )
            })}
          </div>
          {errors.usageMode && <span className="homeos-field__error">{errors.usageMode.message}</span>}
        </div>

        {watchedUsageMode === 'duration' && (
          <label className="homeos-field">
            <span className="homeos-field__label">Consumption Mode</span>
            <div className="homeos-field__select-wrap">
              <select className="homeos-field__input homeos-field__select" {...register('consumptionMode')}>
                {CONSUMPTION_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {CONSUMPTION_MODE_LABELS[mode]}
                  </option>
                ))}
              </select>
            </div>
          </label>
        )}

        <label className="homeos-field">
          <span className="homeos-field__label">Notes (Optional)</span>
          <textarea
            className="homeos-field__input homeos-field__input--textarea"
            rows={3}
            placeholder="Brand preferences, store location, size…"
            {...register('notes')}
          />
        </label>
      </div>

      {submitError && (
        <p className="homeos-product-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="homeos-product-form__actions">
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </PrimaryButton>
      </div>
    </form>
  )
}
