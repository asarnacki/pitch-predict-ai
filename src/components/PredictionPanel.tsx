import { useMatches } from "./hooks/useMatches";
import { usePredictions } from "./hooks/usePredictions";
import { LeagueSelector } from "./LeagueSelector";
import { MatchList } from "./MatchList";
import { EmptyState } from "./EmptyState";
import { useTranslation } from "@/lib/i18n";

interface PredictionPanelProps {
  isAuthenticated?: boolean;
}

export function PredictionPanel({ isAuthenticated = false }: PredictionPanelProps) {
  const t = useTranslation();
  const {
    league,
    matches,
    status: matchesStatus,
    error: matchesError,
    changeLeague,
    refetch: refetchMatches,
  } = useMatches("PREMIER_LEAGUE");

  const { predictions, generatePrediction, savePrediction } = usePredictions();

  const isLoading = matchesStatus === "loading";
  const hasError = matchesStatus === "error";
  const hasMatches = matches.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-7xl">
        <header className="mb-8 sm:mb-12 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{t.predictions.title}</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{t.predictions.subtitle}</p>
        </header>

        <LeagueSelector selectedLeague={league} onLeagueChange={changeLeague} />

        {hasError ? (
          <EmptyState
            title={t.predictions.errorTitle}
            description={matchesError || t.predictions.errorDescription}
            actionLabel={t.predictions.retryButton}
            onAction={refetchMatches}
          />
        ) : !isLoading && !hasMatches ? (
          <EmptyState title={t.predictions.noMatches} description={t.predictions.noMatchesDescription} />
        ) : (
          <MatchList
            matches={matches}
            isLoading={isLoading}
            predictionsState={predictions}
            isAuthenticated={isAuthenticated}
            onGeneratePrediction={generatePrediction}
            onSavePrediction={savePrediction}
          />
        )}
      </div>
    </div>
  );
}
