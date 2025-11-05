import { useState, useEffect, useCallback } from 'react'
import type {
  MatchDTO,
  GeneratePredictionResponseDTO,
  PredictionProbabilities,
  ApiSuccessResponse,
  MatchesResponseDTO,
  GeneratePredictionRequestDTO,
  CreatePredictionDTO,
  PredictionDTO,
} from '@/types'
import { LEAGUE_CODES } from '@/types'
import { getLeagueCodeFromName } from '@/lib/utils'

export type LeagueCode = keyof typeof LEAGUE_CODES

export interface PredictionState {
  status: 'idle' | 'loading' | 'success' | 'error'
  data: GeneratePredictionResponseDTO | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  error: string | null
}

export interface PredictionPanelState {
  league: LeagueCode
  matches: Record<LeagueCode, MatchDTO[]>
  matchesStatus: 'idle' | 'loading' | 'success' | 'error'
  matchesError: string | null
  predictions: Record<string, PredictionState>
}

export function usePredictionPanel() {
  const [state, setState] = useState<PredictionPanelState>({
    league: 'PREMIER_LEAGUE',
    matches: {
      PREMIER_LEAGUE: [],
      LA_LIGA: [],
      BUNDESLIGA: [],
    },
    matchesStatus: 'idle',
    matchesError: null,
    predictions: {},
  })

  const fetchMatches = useCallback(async (league: LeagueCode) => {
    setState((prev) => ({
      ...prev,
      matchesStatus: 'loading',
      matchesError: null,
    }))

    try {
      const leagueCode = LEAGUE_CODES[league]
      const limit = 5
      const response = await fetch(`/api/matches?league=${leagueCode}&limit=${limit}`)

      if (!response.ok) {
        throw new Error('Nie udało się pobrać meczów')
      }

      const result: ApiSuccessResponse<MatchesResponseDTO> = await response.json()

      setState((prev) => ({
        ...prev,
        matches: {
          ...prev.matches,
          [league]: result.data.matches,
        },
        matchesStatus: 'success',
        matchesError: null,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        matchesStatus: 'error',
        matchesError: error instanceof Error ? error.message : 'Wystąpił błąd',
      }))
    }
  }, [])

  const setLeague = useCallback(
    (league: LeagueCode) => {
      setState((prev) => ({
        ...prev,
        league,
      }))

      if (state.matches[league].length === 0) {
        fetchMatches(league)
      }
    },
    [state.matches, fetchMatches]
  )

  const generatePrediction = useCallback(async (match: MatchDTO) => {
    const matchId = match.id

    setState((prev) => ({
      ...prev,
      predictions: {
        ...prev.predictions,
        [matchId]: {
          status: 'loading',
          data: null,
          saveStatus: 'idle',
          error: null,
        },
      },
    }))

    try {
      const requestBody: GeneratePredictionRequestDTO = {
        match_id: match.id,
        home_team: match.home_team.name,
        away_team: match.away_team.name,
        league: getLeagueCodeFromName(match.league),
        match_date: match.match_date,
      }

      const response = await fetch('/api/predictions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error('Nie udało się wygenerować predykcji')
      }

      const result: ApiSuccessResponse<GeneratePredictionResponseDTO> = await response.json()

      setState((prev) => ({
        ...prev,
        predictions: {
          ...prev.predictions,
          [matchId]: {
            status: 'success',
            data: result.data,
            saveStatus: 'idle',
            error: null,
          },
        },
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        predictions: {
          ...prev.predictions,
          [matchId]: {
            status: 'error',
            data: null,
            saveStatus: 'idle',
            error: error instanceof Error ? error.message : 'Wystąpił błąd',
          },
        },
      }))
    }
  }, [])

  // Save prediction (for authenticated users)
  const savePrediction = useCallback(
    async (matchId: string, note: string | null) => {
      const prediction = state.predictions[matchId]

      if (!prediction || !prediction.data) {
        return
      }

      // Set saving state
      setState((prev) => ({
        ...prev,
        predictions: {
          ...prev.predictions,
          [matchId]: {
            ...prev.predictions[matchId],
            saveStatus: 'saving',
          },
        },
      }))

      try {
        const requestBody: CreatePredictionDTO = {
          match_id: prediction.data.match_id,
          home_team: prediction.data.home_team,
          away_team: prediction.data.away_team,
          league: prediction.data.league,
          match_date: prediction.data.match_date,
          prediction_result: prediction.data.prediction,
          note: note || null,
        }

        const response = await fetch('/api/predictions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'Nie udało się zapisać predykcji')
        }

        const result: ApiSuccessResponse<PredictionDTO> = await response.json()

        setState((prev) => ({
          ...prev,
          predictions: {
            ...prev.predictions,
            [matchId]: {
              ...prev.predictions[matchId],
              saveStatus: 'saved',
            },
          },
        }))

        return result.data
      } catch (error) {
        setState((prev) => ({
          ...prev,
          predictions: {
            ...prev.predictions,
            [matchId]: {
              ...prev.predictions[matchId],
              saveStatus: 'error',
              error: error instanceof Error ? error.message : 'Wystąpił błąd',
            },
          },
        }))
        throw error
      }
    },
    [state.predictions]
  )

  // Fetch matches on mount for default league
  useEffect(() => {
    if (state.matches[state.league].length === 0) {
      fetchMatches(state.league)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    league: state.league,
    matches: state.matches[state.league],
    matchesStatus: state.matchesStatus,
    matchesError: state.matchesError,
    predictions: state.predictions,
    setLeague,
    generatePrediction,
    savePrediction,
    refetchMatches: () => fetchMatches(state.league),
  }
}

