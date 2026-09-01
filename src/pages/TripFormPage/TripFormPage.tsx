import { zodResolver } from '@hookform/resolvers/zod'
import { useIonAlert } from '@ionic/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useActivePeople } from '../../features/master-data/usePeople'
import { useTrip } from '../../features/trips/useTripDetail'
import { useCreateTrip, useUpdateTrip } from '../../features/trips/useTripMutations'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import './TripFormPage.css'

const tripSchema = z
  .object({
    name: z.string().min(1, 'Enter a destination'),
    departureDate: z.string().min(1, 'Select a departure date'),
    returnDate: z.string().min(1, 'Select a return date'),
    personId: z.string().min(1, 'Select who is traveling'),
    notes: z.string().optional(),
  })
  .refine((data) => data.returnDate >= data.departureDate, {
    message: 'Return date must be on or after the departure date',
    path: ['returnDate'],
  })

type TripFormValues = z.infer<typeof tripSchema>

export function TripFormPage() {
  const { tripId } = useParams<{ tripId?: string }>()
  const isEdit = Boolean(tripId)
  const navigate = useNavigate()

  const existing = useTrip(tripId)
  const people = useActivePeople()
  const createTrip = useCreateTrip()
  const updateTrip = useUpdateTrip()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [presentAlert] = useIonAlert()

  const stillLoading = people.isLoading || (isEdit && existing.isLoading)
  const loadFailed = people.isError || !people.data || (isEdit && (existing.isError || !existing.data))

  const handleConfirmSubmit = (values: TripFormValues) => {
    if (isEdit) {
      presentAlert({
        header: 'Save Changes?',
        message: 'Are you sure you want to save these changes?',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Save', handler: () => executeSubmit(values) }
        ]
      })
    } else {
      executeSubmit(values)
    }
  }

  const executeSubmit = async (values: TripFormValues) => {
    setSubmitError(null)
    const input = {
      name: values.name,
      departureDate: values.departureDate,
      returnDate: values.returnDate,
      personId: values.personId,
      notes: values.notes?.trim() || null,
    }
    try {
      if (isEdit && tripId) {
        await updateTrip.mutateAsync({ id: tripId, input })
      } else {
        await createTrip.mutateAsync(input)
      }
      navigate('/app/trips', { replace: true })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save this trip. Try again.')
    }
  }

  return (
    <AppPage title={isEdit ? 'Edit Trip' : 'Add Trip'} backHref="/app/trips">
      {stillLoading ? (
        <div className="homeos-trip-form-skeleton-stack">
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </div>
      ) : loadFailed ? (
        <EmptyState message="Couldn't load this trip or the people list." />
      ) : (
        <TripForm
          people={people.data ?? []}
          defaultValues={
            existing.data
              ? {
                  name: existing.data.name,
                  departureDate: existing.data.departureDate,
                  returnDate: existing.data.returnDate,
                  personId: existing.data.personId,
                  notes: existing.data.notes ?? '',
                }
              : undefined
          }
          submitLabel={isEdit ? 'Save changes' : 'Add trip'}
          pendingLabel={isEdit ? 'Saving…' : 'Adding…'}
          isPending={isEdit ? updateTrip.isPending : createTrip.isPending}
          submitError={submitError}
          onSubmit={handleConfirmSubmit}
        />
      )}
    </AppPage>
  )
}

function TripForm({
  people,
  defaultValues,
  submitLabel,
  pendingLabel,
  isPending,
  submitError,
  onSubmit,
}: {
  people: { id: string; name: string }[]
  defaultValues?: Partial<TripFormValues>
  submitLabel: string
  pendingLabel: string
  isPending: boolean
  submitError: string | null
  onSubmit: (values: TripFormValues) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues,
  })

  return (
    <form className="homeos-trip-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="homeos-field">
        <span className="homeos-field__label">Destination</span>
        <input type="text" className="homeos-field__input" {...register('name')} />
        {errors.name && <span className="homeos-field__error">{errors.name.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Departure date</span>
        <input type="date" className="homeos-field__input" {...register('departureDate')} />
        {errors.departureDate && <span className="homeos-field__error">{errors.departureDate.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Return date</span>
        <input type="date" className="homeos-field__input" {...register('returnDate')} />
        {errors.returnDate && <span className="homeos-field__error">{errors.returnDate.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Person</span>
        <select className="homeos-field__input" defaultValue={defaultValues?.personId ?? ''} {...register('personId')}>
          <option value="" disabled>
            Select who is traveling
          </option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
        {errors.personId && <span className="homeos-field__error">{errors.personId.message}</span>}
      </label>

      <label className="homeos-field">
        <span className="homeos-field__label">Notes</span>
        <textarea className="homeos-field__input homeos-field__input--textarea" rows={3} {...register('notes')} />
      </label>

      {submitError && (
        <p className="homeos-trip-form__error" role="alert">
          {submitError}
        </p>
      )}

      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </PrimaryButton>
    </form>
  )
}
