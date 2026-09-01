import { zodResolver } from '@hookform/resolvers/zod'
import { personOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { type PersonDetail, useAllPeople, useCreatePerson, useUpdatePerson } from '../../features/master-data/usePeople'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { QuickAddSheet } from '../../shared/components/QuickAddSheet'
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
import './PeoplePage.css'

type SheetState = { mode: 'add' } | { mode: 'edit'; person: PersonDetail } | null

const personSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  kind: z.enum(['person', 'household']),
  isActive: z.boolean(),
})

type PersonFormValues = z.infer<typeof personSchema>

export function PeoplePage() {
  const people = useAllPeople()
  const [sheet, setSheet] = useState<SheetState>(null)

  return (
    <AppPage title="People" backHref="/app/tabs/more" onRefresh={async () => { await people.refetch() }}>
      <PrimaryButton className="homeos-people__add" onClick={() => setSheet({ mode: 'add' })}>
        Add person
      </PrimaryButton>

      <QueryState query={people} skeleton={<Skeleton height={64} />} error="Couldn't load people." empty="No people yet.">
        {(items) => (
          <GroupedCard>
            {items.map((person) => (
              <Row
                key={person.id}
                icon={personOutline}
                title={person.name}
                meta={[person.kind === 'household' ? 'Household' : 'Person', person.isActive ? null : 'Inactive']
                  .filter(Boolean)
                  .join(' • ')}
                onClick={() => setSheet({ mode: 'edit', person })}
              />
            ))}
          </GroupedCard>
        )}
      </QueryState>

      <QuickAddSheet
        isOpen={sheet !== null}
        title={sheet?.mode === 'edit' ? 'Edit person' : 'Add person'}
        onClose={() => setSheet(null)}
      >
        {sheet && (
          <PersonForm
            key={sheet.mode === 'edit' ? sheet.person.id : 'new'}
            initial={sheet.mode === 'edit' ? sheet.person : undefined}
            onSaved={() => setSheet(null)}
          />
        )}
      </QuickAddSheet>
    </AppPage>
  )
}

function PersonForm({ initial, onSaved }: { initial?: PersonDetail; onSaved: () => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const createPerson = useCreatePerson()
  const updatePerson = useUpdatePerson()
  const isPending = createPerson.isPending || updatePerson.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: { name: initial?.name ?? '', kind: initial?.kind ?? 'person', isActive: initial?.isActive ?? true },
  })

  const onSubmit = async (values: PersonFormValues) => {
    setSubmitError(null)
    const input = { name: values.name, kind: values.kind }
    try {
      if (initial) {
        await updatePerson.mutateAsync({ id: initial.id, input, isActive: values.isActive })
      } else {
        await createPerson.mutateAsync(input)
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
        <span className="homeos-field__label">Kind</span>
        <select className="homeos-field__input" {...register('kind')}>
          <option value="person">Person</option>
          <option value="household">Household</option>
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
