import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cairoToday, formatShortDate } from '../../core/utils/cairoDate'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QuickAddSheet } from '../../shared/components/QuickAddSheet'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import './FinishItemSheet.css'

interface FinishItemSheetProps {
  isOpen: boolean
  startedDate: string | null
  isPending: boolean
  onClose: () => void
  onConfirmFinish: (finishedDate: string) => Promise<void>
}

export function FinishItemSheet({
  isOpen,
  startedDate,
  isPending,
  onClose,
  onConfirmFinish,
}: FinishItemSheetProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const schema = z.object({
    finishedDate: z
      .string()
      .min(1, 'Select a finish date')
      .refine(
        (date) => !startedDate || date >= startedDate,
        `Finish date cannot be before start date (${startedDate ? formatShortDate(startedDate) : ''})`,
      ),
  })

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      finishedDate: cairoToday(),
    },
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await onConfirmFinish(values.finishedDate)
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not finish item. Try again.')
    }
  }

  return (
    <QuickAddSheet isOpen={isOpen} title="Finish item" onClose={onClose}>
      <form className="homeos-finish-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="homeos-finish-form__desc">When did you finish using this item?</p>

        <label className="homeos-field">
          <span className="homeos-field__label">Finish date</span>
          <input type="date" className="homeos-field__input" {...register('finishedDate')} />
          {errors.finishedDate && <span className="homeos-field__error">{errors.finishedDate.message}</span>}
        </label>

        {submitError && (
          <p className="homeos-finish-form__error" role="alert">
            {submitError}
          </p>
        )}

        <div className="homeos-finish-form__actions">
          <PrimaryButton type="submit" disabled={isPending}>
            {isPending ? 'Finishing…' : 'Finish item'}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </QuickAddSheet>
  )
}
