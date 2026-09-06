import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cairoToday } from '../../core/utils/cairoDate'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { useActiveAccounts } from '../master-data/useAccounts'
import { useActiveCategories } from '../master-data/useCategories'
import { useActivePeople } from '../master-data/usePeople'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import { EmptyState } from '../../shared/components/EmptyState'
import '../../shared/components/CompactLedger.css'
import '../../shared/components/CompactList.css'
import './ExpenseForm.css'

const expenseSchema = z.object({
  expenseDate: z.string().min(1, 'Select a date'),
  amount: z.string().refine((value) => Number(value) > 0, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Enter a description'),
  merchant: z.string().optional(),
  categoryId: z.string().min(1, 'Select a category'),
  scope: z.enum(['household', 'personal']),
  personId: z.string().min(1, 'Select a person'),
  accountId: z.string().min(1, 'Select an account'),
  notes: z.string().optional(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseFormValues>
  submitLabel: string
  pendingLabel: string
  isPending: boolean
  submitError: string | null
  onSubmit: (values: ExpenseFormValues) => void
}

/**
 * Shared by AddExpensePage and ExpenseDetailsPage's edit mode.
 * Waits for master data to load before mounting the form — uncontrolled <select>s registered via
 * RHF only apply a prefilled value if the matching <option> already exists at mount.
 */
export function ExpenseForm({ defaultValues, submitLabel, pendingLabel, isPending, submitError, onSubmit }: ExpenseFormProps) {
  const categories = useActiveCategories()
  const people = useActivePeople()
  const accounts = useActiveAccounts()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { expenseDate: cairoToday(), scope: 'personal', ...defaultValues },
  })

  const watchedDesc = watch('description')
  const watchedCategoryId = watch('categoryId')
  const watchedAmount = watch('amount')
  const selectedCategory = categories.data?.find((c) => c.id === watchedCategoryId)?.name
  const visual = resolveProductVisual(watchedDesc || defaultValues?.description || '', selectedCategory)

  if (categories.isLoading || people.isLoading || accounts.isLoading) {
    return (
      <div className="homeos-expense-form-skeleton-stack">
        <Skeleton height={64} />
        <Skeleton height={50} />
        <Skeleton height={50} />
        <Skeleton height={50} />
      </div>
    )
  }

  if (categories.isError || people.isError || accounts.isError || !categories.data || !people.data || !accounts.data) {
    return <EmptyState message="Couldn't load categories, people, or accounts." />
  }

  return (
    <form className="homeos-expense-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Live Preview Hero Card */}
      <div className="homeos-expense-form__preview">
        <div className="homeos-expense-form__preview-main">
          <span className={`homeos-list-glyph homeos-list-glyph--${visual.tone}`} aria-hidden="true">
            {visual.emoji}
          </span>
          <div className="homeos-expense-form__preview-copy">
            <strong className="homeos-expense-form__preview-title">
              {watchedDesc?.trim() || defaultValues?.description || 'New Expense'}
            </strong>
            <span className="homeos-expense-form__preview-subtitle">
              {selectedCategory || 'Select a category'}
            </span>
          </div>
        </div>
        {watchedAmount && Number(watchedAmount) > 0 && (
          <span className="homeos-expense-form__preview-amount">
            EGP {Number(watchedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </div>

      <div className="homeos-expense-form__fields">
        <label className="homeos-field">
          <span className="homeos-field__label">Date</span>
          <input type="date" className="homeos-field__input" {...register('expenseDate')} />
          {errors.expenseDate && <span className="homeos-field__error">{errors.expenseDate.message}</span>}
        </label>

        <label className="homeos-field">
          <span className="homeos-field__label">Amount (EGP)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="homeos-field__input"
            placeholder="0.00"
            {...register('amount')}
          />
          {errors.amount && <span className="homeos-field__error">{errors.amount.message}</span>}
        </label>

        <label className="homeos-field">
          <span className="homeos-field__label">Description</span>
          <input
            type="text"
            className="homeos-field__input"
            placeholder="What was this expense for?"
            autoComplete="off"
            {...register('description')}
          />
          {errors.description && <span className="homeos-field__error">{errors.description.message}</span>}
        </label>

        <label className="homeos-field">
          <span className="homeos-field__label">Merchant</span>
          <input
            type="text"
            className="homeos-field__input"
            placeholder="e.g. Carrefour, Metro, Amazon…"
            autoComplete="off"
            {...register('merchant')}
          />
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
              {categories.data.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {errors.categoryId && <span className="homeos-field__error">{errors.categoryId.message}</span>}
        </label>

        <label className="homeos-field">
          <span className="homeos-field__label">Scope</span>
          <div className="homeos-field__select-wrap">
            <select className="homeos-field__input homeos-field__select" {...register('scope')}>
              <option value="household">Household</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </label>

        <label className="homeos-field">
          <span className="homeos-field__label">Person</span>
          <div className="homeos-field__select-wrap">
            <select
              className="homeos-field__input homeos-field__select"
              defaultValue={defaultValues?.personId ?? ''}
              {...register('personId')}
            >
              <option value="" disabled>
                Select a person
              </option>
              {people.data.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          {errors.personId && <span className="homeos-field__error">{errors.personId.message}</span>}
        </label>

        <label className="homeos-field">
          <span className="homeos-field__label">Account</span>
          <div className="homeos-field__select-wrap">
            <select
              className="homeos-field__input homeos-field__select"
              defaultValue={defaultValues?.accountId ?? ''}
              {...register('accountId')}
            >
              <option value="" disabled>
                Select an account
              </option>
              {accounts.data.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          {errors.accountId && <span className="homeos-field__error">{errors.accountId.message}</span>}
        </label>

        <label className="homeos-field">
          <span className="homeos-field__label">Notes (Optional)</span>
          <textarea
            className="homeos-field__input homeos-field__input--textarea"
            rows={3}
            placeholder="Any additional notes…"
            {...register('notes')}
          />
        </label>
      </div>

      {submitError && (
        <p className="homeos-expense-form__error" role="alert">
          {submitError}
        </p>
      )}

      <div className="homeos-expense-form__actions">
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </PrimaryButton>
      </div>
    </form>
  )
}
