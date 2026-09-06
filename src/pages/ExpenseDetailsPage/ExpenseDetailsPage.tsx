import { IonIcon, useIonAlert } from '@ionic/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  calendarOutline,
  cashOutline,
  documentTextOutline,
  peopleOutline,
  personOutline,
  pricetagOutline,
  storefrontOutline,
  walletOutline,
} from 'ionicons/icons'
import { formatShortDate } from '../../core/utils/cairoDate'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { ExpenseForm, type ExpenseFormValues } from '../../features/expenses/ExpenseForm'
import { useExpense } from '../../features/expenses/useExpenseDetails'
import { useDeleteExpense, useUpdateExpense } from '../../features/expenses/useExpenseMutations'
import { AppPage } from '../../shared/components/AppPage'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import { CompactRow, ListGroup } from '../../shared/components/CompactList'
import '../../shared/components/CompactLedger.css'
import '../../shared/components/CompactList.css'
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
  const [presentAlert] = useIonAlert()

  const handleConfirmSubmit = (values: ExpenseFormValues) => {
    presentAlert({
      header: 'Save Changes?',
      message: 'Are you sure you want to save these changes?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Save', handler: () => executeSubmit(values) }
      ]
    })
  }

  const executeSubmit = async (values: ExpenseFormValues) => {
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
    <AppPage
      title="Expense Details"
      backHref="/app/tabs/expenses"
      className="homeos-compact-ledger homeos-directory-page homeos-expense-details-page"
      fullscreen={false}
    >
      <QueryState query={expense} skeleton={<Skeleton height={300} />} error="Couldn't load this expense.">
        {(detail) => {
          const visual = resolveProductVisual(detail.description, detail.categoryName)

          return (
            <div className="homeos-expense-details-body">
              {detail.linkedItemId && (
                <button
                  type="button"
                  className="homeos-expense-details__linked-note"
                  onClick={() => navigate(`/app/items/${detail.linkedItemId}`)}
                >
                  Linked to a purchased item — tap to view it.
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
                    onSubmit={handleConfirmSubmit}
                  />
                  <SecondaryButton className="homeos-expense-details__cancel" onClick={() => setEditing(false)}>
                    Cancel
                  </SecondaryButton>
                </>
              ) : (
                <>
                  <div className="homeos-expense-details__identity">
                    <div className="homeos-expense-details__identity-main">
                      <span className={`homeos-list-glyph homeos-list-glyph--${visual.tone}`} aria-hidden="true">
                        {visual.ruleId ? visual.emoji : '🧾'}
                      </span>
                      <div className="homeos-expense-details__identity-copy">
                        <h1 className="homeos-expense-details__title">{detail.description}</h1>
                        <span className="homeos-expense-details__subtitle">
                          {formatShortDate(detail.expenseDate)} • {detail.categoryName}
                        </span>
                      </div>
                    </div>
                    <span className="homeos-expense-details__amount">
                      EGP {detail.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <section className="homeos-expense-details__section" aria-label="Expense details">
                    <div className="homeos-ledger-day__heading"><h2>Expense details</h2></div>
                    <ul className="homeos-tx-details-list">
                      <li className="homeos-tx-detail-row">
                        <span className="homeos-tx-detail-row__label">
                          <IonIcon icon={calendarOutline} aria-hidden="true" />
                          <span>Date</span>
                        </span>
                        <span className="homeos-tx-detail-row__value">{formatShortDate(detail.expenseDate)}</span>
                      </li>
                      <li className="homeos-tx-detail-row">
                        <span className="homeos-tx-detail-row__label">
                          <IonIcon icon={cashOutline} aria-hidden="true" />
                          <span>Amount</span>
                        </span>
                        <span className="homeos-tx-detail-row__value">
                          EGP {detail.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </li>
                      {detail.merchant && (
                        <li className="homeos-tx-detail-row">
                          <span className="homeos-tx-detail-row__label">
                            <IonIcon icon={storefrontOutline} aria-hidden="true" />
                            <span>Merchant</span>
                          </span>
                          <span className="homeos-tx-detail-row__value">{detail.merchant}</span>
                        </li>
                      )}
                      <li className="homeos-tx-detail-row">
                        <span className="homeos-tx-detail-row__label">
                          <IonIcon icon={pricetagOutline} aria-hidden="true" />
                          <span>Category</span>
                        </span>
                        <span className="homeos-tx-detail-row__value">{detail.categoryName}</span>
                      </li>
                      <li className="homeos-tx-detail-row">
                        <span className="homeos-tx-detail-row__label">
                          <IonIcon icon={peopleOutline} aria-hidden="true" />
                          <span>Scope</span>
                        </span>
                        <span className="homeos-tx-detail-row__value">{detail.scope === 'household' ? 'Household' : 'Personal'}</span>
                      </li>
                      <li className="homeos-tx-detail-row">
                        <span className="homeos-tx-detail-row__label">
                          <IonIcon icon={personOutline} aria-hidden="true" />
                          <span>Person</span>
                        </span>
                        <span className="homeos-tx-detail-row__value">{detail.personName}</span>
                      </li>
                      <li className="homeos-tx-detail-row">
                        <span className="homeos-tx-detail-row__label">
                          <IonIcon icon={walletOutline} aria-hidden="true" />
                          <span>Account</span>
                        </span>
                        <span className="homeos-tx-detail-row__value">{detail.accountName}</span>
                      </li>
                      {detail.notes && (
                        <li className="homeos-tx-detail-row">
                          <span className="homeos-tx-detail-row__label">
                            <IonIcon icon={documentTextOutline} aria-hidden="true" />
                            <span>Notes</span>
                          </span>
                          <span className="homeos-tx-detail-row__value">{detail.notes}</span>
                        </li>
                      )}
                    </ul>
                  </section>

                  {detail.linkedItem && (
                    <section className="homeos-expense-details__related">
                      <ListGroup title="Related" count={1}>
                        <li>
                          <CompactRow
                            title={detail.linkedItem.productName}
                            meta="View linked item"
                            glyph={resolveProductVisual(detail.linkedItem.productName).emoji}
                            tone={resolveProductVisual(detail.linkedItem.productName).tone}
                            to={`/app/items/${detail.linkedItem.id}`}
                          />
                        </li>
                      </ListGroup>
                    </section>
                  )}

                  <div className="homeos-expense-details__actions">
                    <PrimaryButton onClick={() => setEditing(true)}>Edit expense</PrimaryButton>

                    {!detail.linkedItemId && (
                      <SecondaryButton className="homeos-expense-details__delete" onClick={() => setConfirmingDelete(true)}>
                        Delete expense
                      </SecondaryButton>
                    )}
                  </div>
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
            </div>
          )
        }}
      </QueryState>
    </AppPage>
  )
}


