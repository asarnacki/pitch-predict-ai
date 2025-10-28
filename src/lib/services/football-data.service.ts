import type { MatchDTO } from '@/types'
import { ExternalServiceError } from '@/lib/errors/api-errors'

const leagueCodeToName: Record<string, string> = {
  'PL': 'Premier League',
  'PD': 'La Liga',
  'BL1': 'Bundesliga',
}

export async function fetchUpcomingMatches(
  leagueCode: string,
  limit: number,
): Promise<MatchDTO[]> {
  const apiKey = import.meta.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY not configured')
  }

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${leagueCode}/matches?status=SCHEDULED`,
      {
        headers: {
          'X-Auth-Token': apiKey,
        },
      },
    )

    if (!response.ok) {
      throw new ExternalServiceError('Unable to fetch matches at this time')
    }

    const data = await response.json()

    const matches: MatchDTO[] = data.matches
      .slice(0, limit)
      .map((match: any) => ({
        id: match.id.toString(),
        home_team: match.homeTeam.name,
        away_team: match.awayTeam.name,
        match_date: match.utcDate,
        league: leagueCodeToName[leagueCode] || leagueCode,
        status: match.status,
      }))

    return matches
  }
  catch (error) {
    if (error instanceof ExternalServiceError)
      throw error
    throw new ExternalServiceError('Unable to fetch matches at this time')
  }
}
