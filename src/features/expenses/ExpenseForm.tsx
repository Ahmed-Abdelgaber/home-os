import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cairoToday } from '../../core/utils/cairoDate'
import { useActiveAccounts } from '../master-data/useAccounts'
import { useActiveCategories } from '../master-data/useCategories'
import { useActivePeople } from '../master-data/usePeople'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import { EmptyState } from '../../shared/components/EmptyState'
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
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { expenseDate: cairoToday(), scope: 'personal', ...defaultValues },
  })

  if (categories.isLoading || people.isLoading || accounts.isLoading) {
    return (
      <div className="homeos-expense-form-skeleton-stack">
        <Skeleton height={48} />
        <Skeleton height={48} />
        <Skeleton height={48} />
        <Skeleton height={48} />
      </div>
    )
  }

  if (categories.isError || people.isError || accounts.isError || !categories.data || !people.data || !accounts.data) {
    return <EmptyState message="Couldn't load categories, people, or accounts." />
  }

  return (
    <form className="homeos-expense-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="homeos-field">
        <span className="homeos-field__label">Date</span>
        <input type="date" className="homeos-field__input" {...register('expenseDate')} />
        {errors.expenseDate && <span className="homeos-field__error">{errors.expenseDate.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Amount (EGP)</span>
        <input type="number" step="0.01" min="0" className="homeos-field__input" {...register('amount')} />
        {errors.amount && <span className="homeos-field__error">{errors.amount.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Description</span>
        <input type="text" className="homeos-field__input" {...register('description')} />
        {errors.description && <span className="homeos-field__error">{errors.description.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Merchant</span>
        <input type="text" className="homeos-field__input" {...register('merchant')} />
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Category</span>
        <select className="homeos-field__input" defaultValue={defaultValues?.categoryId ?? ''} {...register('categoryId')}>
          <option value="" disabled>
            Select a category
          </option>
          {categories.data.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <span className="homeos-field__error">{errors.categoryId.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Scope</span>
        <select className="homeos-field__input" {...register('scope')}>
          <option value="household">Household</option>
          <option value="personal">Personal</option>
        </select>
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Person</span>
        <select className="homeos-field__input" defaultValue={defaultValues?.personId ?? ''} {...register('personId')}>
          <option value="" disabled>
            Select a person
          </option>
          {people.data.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
        {errors.personId && <span className="homeos-field__error">{errors.personId.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Account</span>
        <select className="homeos-field__input" defaultValue={defaultValues?.accountId ?? ''} {...register('accountId')}>
          <option value="" disabled>
            Select an account
          </option>
          {accounts.data.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {errors.accountId && <span className="homeos-field__error">{errors.accountId.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Notes</span>
        <textarea className="homeos-field__input homeos-field__input--textarea" rows={3} {...register('notes')} />
      </label>

      {submitError && (
        <p className="homeos-expense-form__error" role="alert">
          {submitError}
        </p>
      )}

      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </PrimaryButton>
    </form>
  )
}
