import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatShortDate } from '../../core/utils/cairoDate'
import { ExpenseForm, type ExpenseFormValues } from '../../features/expenses/ExpenseForm'
import { useExpense } from '../../features/expenses/useExpenseDetails'
import { useDeleteExpense, useUpdateExpense } from '../../features/expenses/useExpenseMutations'
import { AppPage } from '../../shared/components/AppPage'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'
import { FactRow } from '../../shared/components/FactRow'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import './ExpenseDetailsPage.css'

export function ExpenseDetailsPage() {
  const { expenseId } = useParams<{ expenseId: string }>()
  const navigate = useNavigate()
  const expense = useExpense(expenseId)
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const [editing, setEditing] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleSubmit = async (values: ExpenseFormValues) => {
    if (!expenseId) return
    setSubmitError(null)
    try {
      await updateExpense.mutateAsync({
        id: expenseId,
        input: {
          expenseDate: values.expenseDate,
          amount: Number(values.amount),
          description: values.description,
          merchant: values.merchant?.trim() || null,
          categoryId: values.categoryId,
          scope: values.scope,
          personId: values.personId,
          accountId: values.accountId,
          notes: values.notes?.trim() || null,
        },
      })
      setEditing(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save changes. Try again.')
    }
  }

  const handleDelete = () => {
    if (!expenseId) return
    setConfirmingDelete(false)
    deleteExpense.mutate(expenseId, { onSuccess: () => navigate('/app/tabs/expenses', { replace: true }) })
  }

  return (
    <AppPage title="Expense Details" backHref="/app/tabs/expenses">
      <QueryState query={expense} skeleton={<Skeleton height={300} />} error="Couldn't load this expense.">
        {(detail) => (
          <>
            {detail.linkedItemId && (
              <button
                type="button"
                className="homeos-expense-details__linked-note"
                onClick={() => navigate(`/app/items/${detail.linkedItemId}`)}
              >
                Linked to a purchased Item — delete the Item to remove this expense. Tap to view it.
              </button>
            )}

            {editing ? (
              <>
                <ExpenseForm
                  defaultValues={{
                    expenseDate: detail.expenseDate,
                    amount: String(detail.amount),
                    description: detail.description,
                    merchant: detail.merchant ?? '',
                    categoryId: detail.categoryId,
                    scope: detail.scope,
                    personId: detail.personId,
                    accountId: detail.accountId,
                    notes: detail.notes ?? '',
                  }}
                  submitLabel="Save changes"
                  pendingLabel="Saving…"
                  isPending={updateExpense.isPending}
                  submitError={submitError}
                  onSubmit={handleSubmit}
                />
                <SecondaryButton className="homeos-expense-details__cancel" onClick={() => setEditing(false)}>
                  Cancel
                </SecondaryButton>
              </>
            ) : (
              <>
                <GroupedCard className="homeos-expense-details__facts">
                  <FactRow label="Description" value={detail.description} />
                  <FactRow label="Date" value={formatShortDate(detail.expenseDate)} />
                  <FactRow label="Amount" value={`EGP ${detail.amount.toLocaleString('en-US')}`} />
                  {detail.merchant && <FactRow label="Merchant" value={detail.merchant} />}
                  <FactRow label="Category" value={detail.categoryName} />
                  <FactRow label="Scope" value={detail.scope === 'household' ? 'Household' : 'Personal'} />
                  <FactRow label="Person" value={detail.personName} />
                  <FactRow label="Account" value={detail.accountName} />
                  {detail.notes && <FactRow label="Notes" value={detail.notes} />}
                </GroupedCard>

                <PrimaryButton onClick={() => setEditing(true)}>Edit expense</PrimaryButton>

                {!detail.linkedItemId && (
                  <SecondaryButton className="homeos-expense-details__delete" onClick={() => setConfirmingDelete(true)}>
                    Delete expense
                  </SecondaryButton>
                )}
              </>
            )}

            <ConfirmationSheet
              isOpen={confirmingDelete}
              header="Delete this expense?"
              message="This can't be undone."
              confirmLabel="Delete"
              onConfirm={handleDelete}
              onCancel={() => setConfirmingDelete(false)}
            />
          </>
        )}
      </QueryState>
    </AppPage>
  )
}

