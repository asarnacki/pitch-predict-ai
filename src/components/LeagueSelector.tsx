import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LEAGUE_CODES } from '@/types'
import type { LeagueCode } from './hooks/usePredictionPanel'

interface LeagueSelectorProps {
  selectedLeague: LeagueCode
  onLeagueChange: (league: LeagueCode) => void
}

const LEAGUE_LABELS: Record<LeagueCode, string> = {
  PREMIER_LEAGUE: 'Premier League',
  LA_LIGA: 'La Liga',
  BUNDESLIGA: 'Bundesliga',
}

export function LeagueSelector({
  selectedLeague,
  onLeagueChange,
}: LeagueSelectorProps) {
  return (
    <div className="mb-8 sm:mb-12">
      <Tabs
        value={selectedLeague}
        onValueChange={(value) => onLeagueChange(value as LeagueCode)}
      >
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0">
          {(Object.keys(LEAGUE_CODES) as LeagueCode[]).map((league) => (
            <TabsTrigger
              key={league}
              value={league}
              className="text-sm sm:text-base"
            >
              {LEAGUE_LABELS[league]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

