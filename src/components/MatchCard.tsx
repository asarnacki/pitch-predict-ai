import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { PredictionResult } from './PredictionResult'
import type { MatchDTO, UserChoice } from '@/types'
import type { PredictionState } from './hooks/usePredictionPanel'

interface MatchCardProps {
  match: MatchDTO
  predictionState?: PredictionState
  onSavePrediction: (matchId: string, note: string | null, userChoice: UserChoice | null) => void
}

export function MatchCard({
  match,
  predictionState,
  onSavePrediction,
}: MatchCardProps) {

  const matchDate = new Date(match.match_date)
  const formattedDate = matchDate.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = matchDate.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <AccordionItem
      value={match.id}
      className="border rounded-lg overflow-hidden bg-card"
    >
      <AccordionTrigger className="px-4 sm:px-6 py-4 sm:py-5 hover:bg-accent/50 transition-colors [&[data-state=open]]:bg-accent/30">
        <div className="flex flex-col gap-3 w-full pr-2 sm:pr-4">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <span>{formattedDate}</span>
            <span className="text-xs">•</span>
            <span>{formattedTime}</span>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="font-semibold text-sm sm:text-base text-right truncate">
                {match.home_team.name}
              </span>
              <img
                src={match.home_team.logo}
                alt={match.home_team.name}
                className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
              />
            </div>

            <span className="text-xs font-medium text-muted-foreground px-2">
              VS
            </span>

            <div className="flex items-center gap-2 flex-1 justify-start">
              <img
                src={match.away_team.logo}
                alt={match.away_team.name}
                className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
              />
              <span className="font-semibold text-sm sm:text-base text-left truncate">
                {match.away_team.name}
              </span>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-muted-foreground text-center">
            {match.league}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 sm:px-6 py-4 sm:py-6 bg-accent/10">
        <PredictionResult
          match={match}
          predictionState={predictionState}
          onSave={onSavePrediction}
        />
      </AccordionContent>
    </AccordionItem>
  )
}

