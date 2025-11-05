import type { PredictionProbabilities } from '@/types'

interface BarChartProps {
  prediction: PredictionProbabilities
  homeTeam: string
  awayTeam: string
}

export function BarChart({ prediction, homeTeam, awayTeam }: BarChartProps) {
  const homePercent = Math.round(prediction.home * 100)
  const drawPercent = Math.round(prediction.draw * 100)
  const awayPercent = Math.round(prediction.away * 100)

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-xs sm:text-sm truncate">
            {homeTeam} (Wygrana gospodarzy)
          </span>
          <span className="font-bold text-primary text-sm sm:text-base flex-shrink-0">
            {homePercent}%
          </span>
        </div>
        <div className="h-3 sm:h-4 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${homePercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-xs sm:text-sm">Remis</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
            {drawPercent}%
          </span>
        </div>
        <div className="h-3 sm:h-4 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-500 ease-out"
            style={{ width: `${drawPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-xs sm:text-sm truncate">
            {awayTeam} (Wygrana gości)
          </span>
          <span className="font-bold text-green-600 dark:text-green-400 text-sm sm:text-base flex-shrink-0">
            {awayPercent}%
          </span>
        </div>
        <div className="h-3 sm:h-4 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 dark:bg-green-400 transition-all duration-500 ease-out"
            style={{ width: `${awayPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

