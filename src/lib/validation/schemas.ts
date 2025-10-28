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
