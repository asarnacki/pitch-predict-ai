import { cache } from "@/lib/services/cache.service";
import { ExternalServiceError } from "@/lib/errors/api-errors";
import type { PredictionProbabilities, OutcomeOdds } from "@/types";

interface StandingsRow {
  team: { name: string };
  goalsFor: number;
  goalsAgainst: number;
  playedGames: number;
}

interface TeamStrengths {
  attackStrength: number;
  defenceStrength: number;
}

export async function fetchStandings(leagueCode: string, apiKey: string): Promise<StandingsRow[]> {
  const cacheKey = `standings:${leagueCode}`;
  const cached = cache.get<StandingsRow[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`https://api.football-data.org/v4/competitions/${leagueCode}/standings`, {
    headers: { "X-Auth-Token": apiKey },
  });

  if (!response.ok) throw new ExternalServiceError("Unable to fetch standings");

  const data = (await response.json()) as {
    standings: { type: string; table: StandingsRow[] }[];
  };
  const rows: StandingsRow[] = data.standings.find((s) => s.type === "TOTAL")?.table ?? [];

  cache.set(cacheKey, rows, 24 * 60 * 60 * 1000);
  return rows;
}

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(fc|cf|sc|afc|fk|sk)$/i, "")
    .replace(/^(fc|afc|sk|fk)\s+/i, "")
    .trim();
}

export function computeTeamStrengths(rows: StandingsRow[]): Map<string, TeamStrengths> {
  const totalGoals = rows.reduce((sum, r) => sum + r.goalsFor, 0);
  const totalGames = rows.reduce((sum, r) => sum + r.playedGames, 0);
  const leagueAvg = totalGoals / totalGames;

  const map = new Map<string, TeamStrengths>();
  for (const row of rows) {
    map.set(normalizeTeamName(row.team.name), {
      attackStrength: row.goalsFor / row.playedGames / leagueAvg,
      defenceStrength: row.goalsAgainst / row.playedGames / leagueAvg,
    });
  }
  return map;
}

export function leagueAverages(rows: StandingsRow[]): { avgHome: number; avgAway: number } {
  const totalGoals = rows.reduce((sum, r) => sum + r.goalsFor, 0);
  const totalGames = rows.reduce((sum, r) => sum + r.playedGames, 0);
  const avg = totalGoals / totalGames;
  // Standard home/away split of league average (Dixon-Coles baseline)
  return { avgHome: avg * 1.15, avgAway: avg * 0.85 };
}

export function expectedGoals(
  homeAttack: number,
  homeDefence: number,
  awayAttack: number,
  awayDefence: number,
  avgHome: number,
  avgAway: number
): { lambdaHome: number; lambdaAway: number } {
  return {
    lambdaHome: homeAttack * awayDefence * avgHome,
    lambdaAway: awayAttack * homeDefence * avgAway,
  };
}

// P(X=k | λ) computed iteratively to avoid large factorial values
function poissonProb(lambda: number, k: number): number {
  let prob = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) prob *= lambda / i;
  return prob;
}

export function poissonMatrix(lambdaHome: number, lambdaAway: number, maxGoals = 8): PredictionProbabilities {
  let home = 0,
    draw = 0,
    away = 0;
  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      const p = poissonProb(lambdaHome, i) * poissonProb(lambdaAway, j);
      if (i > j) home += p;
      else if (i === j) draw += p;
      else away += p;
    }
  }

  const sum = home + draw + away;
  if (sum <= 0) return { home: 0, draw: 0, away: 0 };
  return { home: home / sum, draw: draw / sum, away: away / sum };
}

export function probabilitiesToOdds(p: PredictionProbabilities): OutcomeOdds {
  return { home: 1 / p.home, draw: 1 / p.draw, away: 1 / p.away };
}

export async function predictMatch(
  matchData: { home_team: string; away_team: string; league: string },
  apiKey: string
): Promise<{ probabilities: PredictionProbabilities; modelOdds: OutcomeOdds }> {
  const rows = await fetchStandings(matchData.league, apiKey);
  const strengths = computeTeamStrengths(rows);
  const { avgHome, avgAway } = leagueAverages(rows);

  const neutral: TeamStrengths = { attackStrength: 1, defenceStrength: 1 };
  const home = strengths.get(normalizeTeamName(matchData.home_team)) ?? neutral;
  const away = strengths.get(normalizeTeamName(matchData.away_team)) ?? neutral;

  const { lambdaHome, lambdaAway } = expectedGoals(
    home.attackStrength,
    home.defenceStrength,
    away.attackStrength,
    away.defenceStrength,
    avgHome,
    avgAway
  );

  const probabilities = poissonMatrix(lambdaHome, lambdaAway);
  return { probabilities, modelOdds: probabilitiesToOdds(probabilities) };
}
