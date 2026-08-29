import { zodResolver } from '@hookform/resolvers/zod'
import { pricetagOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  type CategoryDetail,
  useAllCategories,
  useCreateCategory,
  useUpdateCategory,
} from '../../features/master-data/useCategories'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { QuickAddSheet } from '../../shared/components/QuickAddSheet'
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
import './CategoriesPage.css'

type SheetState = { mode: 'add' } | { mode: 'edit'; category: CategoryDetail } | null

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Enter a category name'),
  isActive: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

export function CategoriesPage() {
  const categories = useAllCategories()
  const [sheet, setSheet] = useState<SheetState>(null)

  return (
    <AppPage title="Categories" backHref="/app/tabs/more">
      <PrimaryButton className="homeos-categories__add" onClick={() => setSheet({ mode: 'add' })}>
        Add category
      </PrimaryButton>

      <QueryState
        query={categories}
        skeleton={<Skeleton height={64} />}
        error="Couldn't load categories."
        empty="No categories yet."
      >
        {(items) => (
          <GroupedCard>
            {items.map((category) => (
              <Row
                key={category.id}
                icon={pricetagOutline}
                title={category.name}
                meta={category.isActive ? 'Active' : 'Inactive'}
                onClick={() => setSheet({ mode: 'edit', category })}
              />
            ))}
          </GroupedCard>
        )}
      </QueryState>

      <QuickAddSheet
        isOpen={sheet !== null}
        title={sheet?.mode === 'edit' ? 'Edit category' : 'Add category'}
        onClose={() => setSheet(null)}
      >
        {sheet && (
          <CategoryForm
            key={sheet.mode === 'edit' ? sheet.category.id : 'new'}
            initial={sheet.mode === 'edit' ? sheet.category : undefined}
            onSaved={() => setSheet(null)}
          />
        )}
      </QuickAddSheet>
    </AppPage>
  )
}

function CategoryForm({ initial, onSaved }: { initial?: CategoryDetail; onSaved: () => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isPending = createCategory.isPending || updateCategory.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: initial?.name ?? '', isActive: initial?.isActive ?? true },
  })

  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitError(null)
    try {
      if (initial) {
        await updateCategory.mutateAsync({ id: initial.id, name: values.name, isActive: values.isActive })
      } else {
        await createCategory.mutateAsync(values.name)
      }
      onSaved()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save. Try again.')
    }
  }

  return (
    <form className="homeos-master-data-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="homeos-field">
        <span className="homeos-field__label">Name</span>
        <input type="text" className="homeos-field__input" autoFocus {...register('name')} />
        {errors.name && <span className="homeos-field__error">{errors.name.message}</span>}
      </label>

      {initial && (
        <label className="homeos-master-data-form__toggle">
          <input type="checkbox" {...register('isActive')} />
          <span>Active</span>
        </label>
      )}

      {submitError && (
        <p className="homeos-master-data-form__error" role="alert">
          {submitError}
        </p>
      )}

      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </PrimaryButton>
    </form>
  )
}
