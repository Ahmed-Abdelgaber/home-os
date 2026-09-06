import { ManagementList } from '../../shared/components/ManagementList'
import { zodResolver } from '@hookform/resolvers/zod'
import { IonIcon, useIonAlert } from '@ionic/react'
import { walletOutline, cashOutline, cardOutline } from 'ionicons/icons'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { type AccountDetail, useAllAccounts, useCreateAccount, useUpdateAccount } from '../../features/master-data/useAccounts'
import { useActivePeople } from '../../features/master-data/usePeople'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QuickAddSheet } from '../../shared/components/QuickAddSheet'

type SheetState = { mode: 'add' } | { mode: 'edit'; account: AccountDetail } | null

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Enter an account name'),
  type: z.string().trim(),
  ownerId: z.string(),
  isActive: z.boolean(),
})

type AccountFormValues = z.infer<typeof accountSchema>

export function AccountsPage() {
  const accounts = useAllAccounts()
  const [sheet, setSheet] = useState<SheetState>(null)

  return (
    <ManagementList title="Accounts" singular="account" query={accounts}
      onAdd={() => setSheet({ mode: 'add' })}
      onEdit={(account) => setSheet({ mode: 'edit', account })}
      describe={(account) => [account.type, account.ownerName].filter(Boolean).join(' · ') || 'Payment account'}
      visual={(account) => ({ glyph: <IonIcon icon={/cash/i.test(account.type ?? '') ? cashOutline : /card/i.test(account.type ?? '') ? cardOutline : walletOutline} />, tone: /cash/i.test(account.type ?? '') ? 'green' : 'blue' })}>
      <QuickAddSheet
        isOpen={sheet !== null}
        title={sheet?.mode === 'edit' ? 'Edit account' : 'Add account'}
        onClose={() => setSheet(null)}
      >
        {sheet && (
          <AccountForm
            key={sheet.mode === 'edit' ? sheet.account.id : 'new'}
            initial={sheet.mode === 'edit' ? sheet.account : undefined}
            onSaved={() => setSheet(null)}
          />
        )}
      </QuickAddSheet>
    </ManagementList>
  )
}

function AccountForm({ initial, onSaved }: { initial?: AccountDetail; onSaved: () => void }) {
  const people = useActivePeople()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const isPending = createAccount.isPending || updateAccount.isPending

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: initial?.name ?? '',
      type: initial?.type ?? '',
      ownerId: initial?.ownerId ?? '',
      isActive: initial?.isActive ?? true,
    },
  })

  const [presentAlert] = useIonAlert()

  const onSubmit = async (values: AccountFormValues) => {
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

  const executeSubmit = async (values: AccountFormValues) => {
    setSubmitError(null)
    // Empty strings mean "not set" in the form but must reach the database as null.
    const input = { name: values.name, type: values.type || null, ownerId: values.ownerId || null }
    try {
      if (initial) {
        await updateAccount.mutateAsync({ id: initial.id, input, isActive: values.isActive })
      } else {
        await createAccount.mutateAsync(input)
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

      <label className="homeos-field">
        <span className="homeos-field__label">Type</span>
        <input type="text" className="homeos-field__input" placeholder="e.g. Cash, Card" {...register('type')} />
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Owner</span>
        <Controller name="ownerId" control={control} render={({ field }) => (
          <select className="homeos-field__input" {...field}>
            <option value="">No specific owner</option>
            {initial?.ownerId && !people.data?.some(person => person.id === initial.ownerId) && <option value={initial.ownerId}>{initial.ownerName ?? 'Current owner'}</option>}
            {people.data?.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        )} />
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
