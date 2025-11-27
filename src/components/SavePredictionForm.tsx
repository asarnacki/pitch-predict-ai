import { useEffect, useImperativeHandle, forwardRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { BUSINESS_RULES } from '@/types'
import type { UserChoice } from '@/types'
import type { PredictionState } from './hooks/usePredictions'
import {
  savePredictionSchema,
  type SavePredictionFormData,
} from '@/lib/validation/prediction.schemas'

export interface SavePredictionFormHandle {
  setUserChoice: (choice: UserChoice | null) => void
  getUserChoice: () => UserChoice | null
}

interface SavePredictionFormProps {
  matchId: string
  saveStatus: PredictionState['saveStatus']
  onSave: (matchId: string, note: string | null, userChoice: UserChoice | null) => void
}

export const SavePredictionForm = forwardRef<
  SavePredictionFormHandle,
  SavePredictionFormProps
>(function SavePredictionForm({ matchId, saveStatus, onSave }, ref) {
  const form = useForm<SavePredictionFormData>({
    resolver: zodResolver(savePredictionSchema),
    defaultValues: {
      note: '',
      userChoice: null,
    },
  })

  const {
    register,
    handleSubmit: formHandleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const noteValue = watch('note') || ''
  const userChoice = watch('userChoice')

  useImperativeHandle(
    ref,
    () => ({
      setUserChoice: (choice: UserChoice | null) => {
        setValue('userChoice', choice)
      },
      getUserChoice: () => userChoice,
    }),
    [setValue, userChoice]
  )

  useEffect(() => {
    if (saveStatus === 'saved') {
      toast.success('Predykcja zapisana pomyślnie!')
      // Reset form after successful save
      form.reset()
    } else if (saveStatus === 'error') {
      toast.error('Nie udało się zapisać predykcji')
    }
  }, [saveStatus, form])

  const onSubmit = (data: SavePredictionFormData) => {
    onSave(matchId, data.note, data.userChoice)
  }

  const isSaving = saveStatus === 'saving'
  const isSaved = saveStatus === 'saved'
  const isDisabled = isSaving || isSaved

  return (
    <form onSubmit={formHandleSubmit(onSubmit)} className="mt-6 pt-6 border-t space-y-4">
      <div className="space-y-2">
        <label
          htmlFor={`note-${matchId}`}
          className="text-xs sm:text-sm font-medium block"
        >
          Dodaj notatkę (opcjonalnie)
        </label>
        <Textarea
          id={`note-${matchId}`}
          placeholder="Dodaj swoją notatkę do tej predykcji..."
          maxLength={BUSINESS_RULES.MAX_NOTE_LENGTH}
          disabled={isDisabled}
          className="resize-none text-sm"
          rows={3}
          {...register('note')}
        />
        {errors.note && (
          <p className="text-xs text-destructive">{errors.note.message}</p>
        )}
        <div className="flex justify-end items-center text-xs text-muted-foreground">
          <span>
            {noteValue.length}/{BUSINESS_RULES.MAX_NOTE_LENGTH} znaków
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isDisabled}
        className="w-full text-sm sm:text-base"
        variant={isSaved ? 'secondary' : 'default'}
      >
        {isSaving ? 'Zapisywanie...' : isSaved ? '✓ Zapisano' : 'Zapisz predykcję'}
      </Button>
    </form>
  )
})

