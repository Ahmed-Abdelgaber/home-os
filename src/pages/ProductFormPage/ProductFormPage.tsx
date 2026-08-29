import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useActiveCategories } from '../../features/master-data/useCategories'
import { useActivePeople } from '../../features/master-data/usePeople'
import { CONSUMPTION_MODES, CONSUMPTION_MODE_LABELS } from '../../features/products/consumptionMode'
import { useProduct } from '../../features/products/useProductDetail'
import { useCreateProduct, useUpdateProduct } from '../../features/products/useProductMutations'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import './ProductFormPage.css'

const productSchema = z.object({
  name: z.string().min(1, 'Enter a product name'),
  categoryId: z.string().min(1, 'Select a category'),
  consumerId: z.string().min(1, 'Select a consumer'),
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

  const stillLoading = categories.isLoading || people.isLoading || (isEdit && existing.isLoading)
  const loadFailed = categories.isError || people.isError || !categories.data || !people.data || (isEdit && (existing.isError || !existing.data))

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitError(null)
    const input = {
      name: values.name,
      categoryId: values.categoryId,
      consumerId: values.consumerId,
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
    <AppPage title={isEdit ? 'Edit Product' : 'Add Product'} backHref={isEdit && productId ? `/app/products/${productId}` : '/app/products'}>
      {stillLoading ? (
        <div className="homeos-product-form-skeleton-stack">
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
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
                  consumptionMode: existing.data.consumptionMode,
                  notes: existing.data.notes ?? '',
                }
              : undefined
          }
          submitLabel={isEdit ? 'Save changes' : 'Add product'}
          pendingLabel={isEdit ? 'Saving…' : 'Adding…'}
          isPending={isEdit ? updateProduct.isPending : createProduct.isPending}
          submitError={submitError}
          onSubmit={handleSubmit}
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
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { consumptionMode: 'never_pause', ...defaultValues },
  })

  return (
    <form className="homeos-product-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="homeos-field">
        <span className="homeos-field__label">Name</span>
        <input type="text" className="homeos-field__input" {...register('name')} />
        {errors.name && <span className="homeos-field__error">{errors.name.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Category</span>
        <select className="homeos-field__input" defaultValue={defaultValues?.categoryId ?? ''} {...register('categoryId')}>
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <span className="homeos-field__error">{errors.categoryId.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Consumer</span>
        <select className="homeos-field__input" defaultValue={defaultValues?.consumerId ?? ''} {...register('consumerId')}>
          <option value="" disabled>
            Select a consumer
          </option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
        {errors.consumerId && <span className="homeos-field__error">{errors.consumerId.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Consumption</span>
        <select className="homeos-field__input" {...register('consumptionMode')}>
          {CONSUMPTION_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {CONSUMPTION_MODE_LABELS[mode]}
            </option>
          ))}
        </select>
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Notes</span>
        <textarea className="homeos-field__input homeos-field__input--textarea" rows={3} {...register('notes')} />
      </label>

      {submitError && (
        <p className="homeos-product-form__error" role="alert">
          {submitError}
        </p>
      )}

      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </PrimaryButton>
    </form>
  )
}
