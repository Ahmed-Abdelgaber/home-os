import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ExpenseForm, type ExpenseFormValues } from '../../features/expenses/ExpenseForm'
import { useCreateExpense } from '../../features/expenses/useExpenseMutations'
import { useFulfillBankTransactionExpense } from '../../features/bank-transactions/useBankTransactions'
import { AppPage } from '../../shared/components/AppPage'

export interface ExpensePrefillState {
  amount?: number | string
  merchant?: string | null
  expenseDate?: string
  bankTransactionId?: string
}

export function AddExpensePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as ExpensePrefillState | null) ?? null
  const createExpense = useCreateExpense()
  const fulfillBankExpense = useFulfillBankTransactionExpense()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const defaultValues = prefill
    ? {
        amount: prefill.amount != null ? String(prefill.amount) : undefined,
        merchant: prefill.merchant ?? undefined,
        expenseDate: prefill.expenseDate ?? undefined,
      }
    : undefined

  const handleSubmit = async (values: ExpenseFormValues) => {
    setSubmitError(null)
    try {
      if (prefill?.bankTransactionId) {
        await fulfillBankExpense.mutateAsync({
          bankTransactionId: prefill.bankTransactionId,
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
        navigate(`/app/pending-transactions/${prefill.bankTransactionId}`, { replace: true })
      } else {
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
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this expense. Try again.')
    }
  }

  const isPending = createExpense.isPending || fulfillBankExpense.isPending
  const backHref = prefill?.bankTransactionId
    ? `/app/pending-transactions/${prefill.bankTransactionId}`
    : '/app/tabs/expenses'

  return (
    <AppPage title={prefill?.bankTransactionId ? 'Fulfill Expense' : 'Add Expense'} backHref={backHref}>
      <ExpenseForm
        defaultValues={defaultValues}
        submitLabel={prefill?.bankTransactionId ? 'Fulfill expense' : 'Add expense'}
        pendingLabel={prefill?.bankTransactionId ? 'Fulfilling…' : 'Adding…'}
        isPending={isPending}
        submitError={submitError}
        onSubmit={handleSubmit}
      />
    </AppPage>
  )
}
