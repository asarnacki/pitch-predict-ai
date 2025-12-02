import type { MatchDTO } from "@/types";
import { ExternalServiceError, ConflictError } from "@/lib/errors/api-errors";

export interface MatchResult {
  home_score: number;
  away_score: number;
}

const leagueCodeToName: Record<string, string> = {
  PL: "Premier League",
  PD: "La Liga",
  BL1: "Bundesliga",
};

export async function fetchUpcomingMatches(leagueCode: string, limit: number): Promise<MatchDTO[]> {
  const apiKey = import.meta.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY not configured");
  }

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${leagueCode}/matches?status=SCHEDULED`,
      {
        headers: {
          "X-Auth-Token": apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new ExternalServiceError("Unable to fetch matches at this time");
    }

    const data = await response.json();

    interface FootballDataTeam {
      id: number;
      name: string;
      crest: string;
    }

    interface FootballDataMatch {
      id: number | string;
      homeTeam: FootballDataTeam;
      awayTeam: FootballDataTeam;
      utcDate: string;
      status: string;
    }

    const matches: MatchDTO[] = (data.matches as FootballDataMatch[]).slice(0, limit).map((match) => ({
      id: match.id.toString(),
      home_team: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        logo: match.homeTeam.crest,
      },
      away_team: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        logo: match.awayTeam.crest,
      },
      match_date: match.utcDate,
      league: leagueCodeToName[leagueCode] || leagueCode,
      status: match.status,
    }));

    return matches;
  } catch (error) {
    if (error instanceof ExternalServiceError) throw error;
    throw new ExternalServiceError("Unable to fetch matches at this time");
  }
}

export async function fetchMatchResult(matchId: string): Promise<MatchResult> {
  const apiKey = import.meta.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY not configured");
  }

  try {
    const response = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
      headers: {
        "X-Auth-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new ExternalServiceError("Unable to fetch match result at this time");
    }

    const data = await response.json();

    if (data.status !== "FINISHED") {
      throw new ConflictError("MATCH_NOT_FINISHED", "Match result not available yet");
    }

    const homeScore = data.score?.fullTime?.home;
    const awayScore = data.score?.fullTime?.away;

    if (homeScore === undefined || homeScore === null || awayScore === undefined || awayScore === null) {
      throw new ExternalServiceError("Match result not available");
    }

    return {
      home_score: homeScore,
      away_score: awayScore,
    };
  } catch (error) {
    if (error instanceof ExternalServiceError || error instanceof ConflictError) {
      throw error;
    }
    throw new ExternalServiceError("Unable to fetch match result at this time");
  }
}
