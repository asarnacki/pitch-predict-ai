import { cache } from "@/lib/services/cache.service";
import { ExternalServiceError } from "@/lib/errors/api-errors";
import {
  BUSINESS_RULES,
  type OutcomeOdds,
  type PredictionProbabilities,
  type BookmakerInfo,
  type OutcomeValue,
} from "@/types";
import { normalizeTeamName } from "./prediction-model.service";

const LEAGUE_TO_API_FOOTBALL_ID: Record<string, number> = {
  PL: 39,
  PD: 140,
  BL1: 78,
  WC: 1,
};

interface ApiFixture {
  fixture: { id: number; date: string };
  teams: { home: { name: string }; away: { name: string } };
}

interface ApiOddsEntry {
  fixture: { id: number };
  bookmakers: {
    bookmaker: { name: string };
    bets: { id: number; name: string; values: { value: string; odd: string }[] }[];
  }[];
}

export interface MatchOddsQuery {
  homeTeam: string;
  awayTeam: string;
  matchDate: string; // ISO 8601
  league: string; // LEAGUE_CODES value e.g. "PL"
  matchId: string;
}

// Wrap cached odds so null ("no odds found") is distinguishable from cache miss
interface CachedOdds {
  data: BookmakerInfo | null;
}

async function fetchFixtureId(query: MatchOddsQuery, apiKey: string): Promise<number | null> {
  const leagueId = LEAGUE_TO_API_FOOTBALL_ID[query.league];
  if (!leagueId) return null;

  const date = query.matchDate.slice(0, 10);
  const season = new Date(query.matchDate).getFullYear();
  const url = `https://v3.football.api-sports.io/fixtures?date=${date}&league=${leagueId}&season=${season}`;

  const response = await fetch(url, { headers: { "x-apisports-key": apiKey } });
  if (!response.ok) throw new ExternalServiceError("Unable to fetch fixtures from odds provider");

  const data = (await response.json()) as { response: ApiFixture[] };
  const homeNorm = normalizeTeamName(query.homeTeam);
  const awayNorm = normalizeTeamName(query.awayTeam);

  const match = data.response.find(
    (f) => normalizeTeamName(f.teams.home.name) === homeNorm && normalizeTeamName(f.teams.away.name) === awayNorm
  );
  return match?.fixture.id ?? null;
}

async function fetchRawOdds(
  fixtureId: number,
  apiKey: string
): Promise<{ odds: OutcomeOdds; bookmakerName: string } | null> {
  const response = await fetch(`https://v3.football.api-sports.io/odds?fixture=${fixtureId}&bet=1`, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { response: ApiOddsEntry[] };
  const entry = data.response[0];
  const bookmaker = entry?.bookmakers[0];
  // bet id=1 is "Match Winner" (1X2) in API-Football
  const matchWinner = bookmaker?.bets.find((b) => b.id === 1);
  if (!matchWinner) return null;

  const findOdd = (label: string) => {
    const v = matchWinner.values.find((x) => x.value === label);
    return v ? parseFloat(v.odd) : null;
  };

  const home = findOdd("Home");
  const draw = findOdd("Draw");
  const away = findOdd("Away");
  if (!home || !draw || !away) return null;

  return { odds: { home, draw, away }, bookmakerName: bookmaker.bookmaker.name };
}

export function oddsToImpliedProbabilities(odds: OutcomeOdds): PredictionProbabilities {
  const rawHome = 1 / odds.home;
  const rawDraw = 1 / odds.draw;
  const rawAway = 1 / odds.away;
  const overround = rawHome + rawDraw + rawAway;
  return { home: rawHome / overround, draw: rawDraw / overround, away: rawAway / overround };
}

export function computeValue(modelProb: PredictionProbabilities, bookOdds: OutcomeOdds): OutcomeValue {
  return {
    home: modelProb.home * bookOdds.home - 1,
    draw: modelProb.draw * bookOdds.draw - 1,
    away: modelProb.away * bookOdds.away - 1,
  };
}

export async function fetchMatchOdds(query: MatchOddsQuery, apiKey: string): Promise<BookmakerInfo | null> {
  if (!apiKey) return null;

  const cacheKey = `odds:${query.matchId}`;
  const cached = cache.get<CachedOdds>(cacheKey);
  if (cached !== null) return cached.data;

  const ttl = BUSINESS_RULES.PREDICTION_CACHE_TTL_HOURS * 60 * 60 * 1000;

  try {
    const fixtureId = await fetchFixtureId(query, apiKey);
    if (!fixtureId) {
      cache.set<CachedOdds>(cacheKey, { data: null }, ttl);
      return null;
    }

    const raw = await fetchRawOdds(fixtureId, apiKey);
    if (!raw) {
      cache.set<CachedOdds>(cacheKey, { data: null }, ttl);
      return null;
    }

    const result: BookmakerInfo = {
      odds: raw.odds,
      impliedProbability: oddsToImpliedProbabilities(raw.odds),
      bookmaker: raw.bookmakerName,
    };

    cache.set<CachedOdds>(cacheKey, { data: result }, ttl);
    return result;
  } catch {
    cache.set<CachedOdds>(cacheKey, { data: null }, ttl);
    return null;
  }
}
