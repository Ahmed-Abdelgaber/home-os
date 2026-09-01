import { zodResolver } from '@hookform/resolvers/zod'
import { walletOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { type AccountDetail, useAllAccounts, useCreateAccount, useUpdateAccount } from '../../features/master-data/useAccounts'
import { useActivePeople } from '../../features/master-data/usePeople'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { QuickAddSheet } from '../../shared/components/QuickAddSheet'
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
import './AccountsPage.css'

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
    <AppPage title="Accounts" backHref="/app/tabs/more" onRefresh={async () => { await accounts.refetch() }}>
      <PrimaryButton className="homeos-accounts__add" onClick={() => setSheet({ mode: 'add' })}>
        Add account
      </PrimaryButton>

      <QueryState query={accounts} skeleton={<Skeleton height={64} />} error="Couldn't load accounts." empty="No accounts yet.">
        {(items) => (
          <GroupedCard>
            {items.map((account) => (
              <Row
                key={account.id}
                icon={walletOutline}
                title={account.name}
                meta={[account.type, account.ownerName, account.isActive ? null : 'Inactive'].filter(Boolean).join(' • ')}
                onClick={() => setSheet({ mode: 'edit', account })}
              />
            ))}
          </GroupedCard>
        )}
      </QueryState>

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
    </AppPage>
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

  const onSubmit = async (values: AccountFormValues) => {
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
        <select className="homeos-field__input" {...register('ownerId')}>
          <option value="">No specific owner</option>
          {people.data?.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
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
