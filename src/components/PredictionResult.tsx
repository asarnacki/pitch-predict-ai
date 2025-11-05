import { Spinner } from './Spinner'
import { BarChart } from './BarChart'
import { SavePredictionForm } from './SavePredictionForm'
import type { MatchDTO } from '@/types'
import type { PredictionState } from './hooks/usePredictionPanel'

interface PredictionResultProps {
  match: MatchDTO
  predictionState?: PredictionState
  onSave: (matchId: string, note: string | null) => void
}

export function PredictionResult({
  match,
  predictionState,
  onSave,
}: PredictionResultProps) {
  if (!predictionState || predictionState.status === 'idle') {
    return (
      <div className="py-8 text-center">
        <p className="text-sm sm:text-base text-muted-foreground">
          Kliknij, aby wygenerować predykcję AI
        </p>
      </div>
    )
  }

  if (predictionState.status === 'loading') {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4">
        <Spinner className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        <p className="text-sm sm:text-base text-muted-foreground">
          Generowanie predykcji AI...
        </p>
      </div>
    )
  }

  if (predictionState.status === 'error') {
    return (
      <div className="py-8 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-destructive font-medium text-sm sm:text-base">
            Wystąpił błąd
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {predictionState.error || 'Nie udało się wygenerować predykcji'}
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Otwórz kartę ponownie, aby spróbować jeszcze raz
          </p>
        </div>
      </div>
    )
  }

  if (predictionState.status === 'success' && predictionState.data) {
    const { prediction, home_team, away_team, generated_at } = predictionState.data

    const generatedDate = new Date(generated_at)
    const formattedGeneratedDate = generatedDate.toLocaleString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-base sm:text-lg font-semibold mb-4">
            Predykcja AI
          </h4>
          <BarChart
            prediction={prediction}
            homeTeam={home_team}
            awayTeam={away_team}
          />
        </div>

        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          Wygenerowano: {formattedGeneratedDate}
        </div>

        {/* TODO: Check if user is authenticated before showing this form */}
        {/* For now, we'll show it always - authentication will be added later */}
        <SavePredictionForm
          matchId={match.id}
          saveStatus={predictionState.saveStatus}
          onSave={onSave}
        />
      </div>
    )
  }

  return null
}

