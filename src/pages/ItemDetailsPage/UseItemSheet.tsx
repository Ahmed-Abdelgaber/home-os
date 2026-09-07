import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cairoToday } from '../../core/utils/cairoDate'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QuickAddSheet } from '../../shared/components/QuickAddSheet'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import './FinishItemSheet.css'

interface UseItemSheetProps {
  isOpen: boolean
  isPending: boolean
  onClose: () => void
  onConfirmUse: (usedDate: string) => Promise<void>
}

export function UseItemSheet({
  isOpen,
  isPending,
  onClose,
  onConfirmUse,
}: UseItemSheetProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const schema = z.object({
    usedDate: z.string().min(1, 'Select a date'),
  })

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      usedDate: cairoToday(),
    },
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null)
    try {
      await onConfirmUse(values.usedDate)
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not use item. Try again.')
    }
  }

  return (
    <QuickAddSheet isOpen={isOpen} title="Use item" onClose={onClose}>
      <form className="homeos-finish-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="homeos-finish-form__desc">When did you use this item?</p>

        <label className="homeos-field">
          <span className="homeos-field__label">Used date</span>
          <input type="date" className="homeos-field__input" {...register('usedDate')} />
          {errors.usedDate && <span className="homeos-field__error">{errors.usedDate.message}</span>}
        </label>

        {submitError && (
          <p className="homeos-finish-form__error" role="alert">
            {submitError}
          </p>
        )}

        <div className="homeos-finish-form__actions">
          <PrimaryButton type="submit" disabled={isPending}>
            {isPending ? 'Using…' : 'Use item'}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </QuickAddSheet>
  )
}
