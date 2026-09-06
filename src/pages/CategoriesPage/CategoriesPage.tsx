import { ManagementList } from '../../shared/components/ManagementList'
import { zodResolver } from '@hookform/resolvers/zod'
import { useIonAlert } from '@ionic/react'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  type CategoryDetail,
  useAllCategories,
  useCreateCategory,
  useUpdateCategory,
} from '../../features/master-data/useCategories'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QuickAddSheet } from '../../shared/components/QuickAddSheet'

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
    <ManagementList title="Categories" singular="category" query={categories}
      onAdd={() => setSheet({ mode: 'add' })}
      onEdit={(category) => setSheet({ mode: 'edit', category })}
      describe={() => 'Products & expenses'}
      visual={(category) => { const visual = resolveProductVisual('', category.name); return { glyph: visual.emoji, tone: visual.tone } }}>
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
    </ManagementList>
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

  const [presentAlert] = useIonAlert()

  const onSubmit = async (values: CategoryFormValues) => {
    if (initial) {
      presentAlert({
        header: 'Save changes?',
        message: 'The new details replace the current ones everywhere this appears.',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Save', handler: () => executeSubmit(values) }
        ]
      })
    } else {
      executeSubmit(values)
    }
  }

  const executeSubmit = async (values: CategoryFormValues) => {
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
