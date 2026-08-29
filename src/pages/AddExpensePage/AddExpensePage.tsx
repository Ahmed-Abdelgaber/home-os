import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExpenseForm, type ExpenseFormValues } from '../../features/expenses/ExpenseForm'
import { useCreateExpense } from '../../features/expenses/useExpenseMutations'
import { AppPage } from '../../shared/components/AppPage'

export function AddExpensePage() {
  const navigate = useNavigate()
  const createExpense = useCreateExpense()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (values: ExpenseFormValues) => {
    setSubmitError(null)
    try {
      const result = await createExpense.mutateAsync({
        expenseDate: values.expenseDate,
        amount: Number(values.amount),
        description: values.description,
        merchant: values.merchant?.trim() || null,
        categoryId: values.categoryId,
        scope: values.scope,
        personId: values.personId,
        accountId: values.accountId,
        notes: values.notes?.trim() || null,
      })
      navigate(`/app/expenses/${result.id}`, { replace: true })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this expense. Try again.')
    }
  }

  return (
    <AppPage title="Add Expense" backHref="/app/tabs/expenses">
      <ExpenseForm
        submitLabel="Add expense"
        pendingLabel="Adding…"
        isPending={createExpense.isPending}
        submitError={submitError}
        onSubmit={handleSubmit}
      />
    </AppPage>
  )
}
