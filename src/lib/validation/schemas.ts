import { z } from 'zod'
import { BUSINESS_RULES, LEAGUE_CODES } from '@/types'

// GET /api/matches
export const getMatchesQuerySchema = z.object({
  league: z.enum([LEAGUE_CODES.PREMIER_LEAGUE, LEAGUE_CODES.LA_LIGA, LEAGUE_CODES.BUNDESLIGA]),
  limit: z.coerce.number().int().min(1).max(BUSINESS_RULES.MAX_MATCHES_LIMIT).optional().default(BUSINESS_RULES.DEFAULT_MATCHES_LIMIT),
})

// POST /api/predictions/generate
export const generatePredictionBodySchema = z.object({
  match_id: z.string().min(1),
  home_team: z.string().min(1),
  away_team: z.string().min(1),
  league: z.enum([LEAGUE_CODES.PREMIER_LEAGUE, LEAGUE_CODES.LA_LIGA, LEAGUE_CODES.BUNDESLIGA]),
  match_date: z.string().datetime(),
})

// POST /api/predictions
export const createPredictionBodySchema = z.object({
  league: z.string().min(1, 'League is required'),
  match_date: z.string().datetime({ message: 'Invalid datetime format' }),
  home_team: z.string().min(1, 'Home team is required'),
  away_team: z.string().min(1, 'Away team is required'),
  prediction_result: z
    .object({
      home: z.number().min(0).max(1, 'Home probability must be between 0 and 1'),
      draw: z.number().min(0).max(1, 'Draw probability must be between 0 and 1'),
      away: z.number().min(0).max(1, 'Away probability must be between 0 and 1'),
    })
    .refine(
      (data) => {
        const sum = data.home + data.draw + data.away
        return Math.abs(sum - 1) < 0.01
      },
      { message: 'Probabilities must sum to approximately 1.0' }
    ),
  note: z
    .string()
    .max(BUSINESS_RULES.MAX_NOTE_LENGTH, `Note must not exceed ${BUSINESS_RULES.MAX_NOTE_LENGTH} characters`)
    .optional()
    .nullable(),
  match_id: z.string().min(1).optional().nullable(),
})

// GET /api/predictions
export const getPredictionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(BUSINESS_RULES.MAX_MATCHES_LIMIT).nullish().default(BUSINESS_RULES.DEFAULT_PREDICTIONS_LIMIT),
  offset: z.coerce.number().int().min(0).nullish().default(0),
  sort: z.enum(['created_at', 'match_date']).nullish().default('created_at'),
  order: z.enum(['asc', 'desc']).nullish().default('desc'),
  league: z.string().nullish(),
})

// GET /api/predictions/:id
export const predictionIdParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'Prediction ID must be a positive integer' }),
})

// PATCH /api/predictions/:id
export const updatePredictionBodySchema = z.object({
  note: z.string().max(BUSINESS_RULES.MAX_NOTE_LENGTH, `Note must not exceed ${BUSINESS_RULES.MAX_NOTE_LENGTH} characters`).nullable().nullish(),
})
