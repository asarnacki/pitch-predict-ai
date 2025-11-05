import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { BUSINESS_RULES } from '@/types'
import type { PredictionState } from './hooks/usePredictionPanel'

interface SavePredictionFormProps {
  matchId: string
  saveStatus: PredictionState['saveStatus']
  onSave: (matchId: string, note: string | null) => void
}

export function SavePredictionForm({
  matchId,
  saveStatus,
  onSave,
}: SavePredictionFormProps) {
  const [note, setNote] = useState('')
  const [prevSaveStatus, setPrevSaveStatus] = useState(saveStatus)

  useEffect(() => {
    if (saveStatus !== prevSaveStatus) {
      if (saveStatus === 'saved') {
        toast.success('Predykcja zapisana pomyślnie!')
      } else if (saveStatus === 'error') {
        toast.error('Nie udało się zapisać predykcji')
      }
      setPrevSaveStatus(saveStatus)
    }
  }, [saveStatus, prevSaveStatus])

  const handleSave = () => {
    onSave(matchId, note.trim() || null)
  }

  const isSaving = saveStatus === 'saving'
  const isSaved = saveStatus === 'saved'
  const isDisabled = isSaving || isSaved

  return (
    <div className="mt-6 pt-6 border-t space-y-4">
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
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={BUSINESS_RULES.MAX_NOTE_LENGTH}
          disabled={isDisabled}
          className="resize-none text-sm"
          rows={3}
        />
        <div className="flex justify-end items-center text-xs text-muted-foreground">
          <span>
            {note.length}/{BUSINESS_RULES.MAX_NOTE_LENGTH} znaków
          </span>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={isDisabled}
        className="w-full text-sm sm:text-base"
        variant={isSaved ? 'secondary' : 'default'}
      >
        {isSaving ? 'Zapisywanie...' : isSaved ? '✓ Zapisano' : 'Zapisz predykcję'}
      </Button>
    </div>
  )
}

