import { useMatches } from "./hooks/useMatches";
import { usePredictions } from "./hooks/usePredictions";
import { LeagueSelector } from "./LeagueSelector";
import { MatchList } from "./MatchList";
import { EmptyState } from "./EmptyState";

interface PredictionPanelProps {
  isAuthenticated?: boolean;
}

export function PredictionPanel({ isAuthenticated = false }: PredictionPanelProps) {
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">PitchPredict AI</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Wygeneruj predykcje AI dla nadchodzących meczów
          </p>
        </header>

        <LeagueSelector selectedLeague={league} onLeagueChange={changeLeague} />

        {hasError ? (
          <EmptyState
            title="Nie udało się pobrać meczów"
            description={matchesError || "Wystąpił błąd podczas pobierania listy meczów"}
            actionLabel="Spróbuj ponownie"
            onAction={refetchMatches}
          />
        ) : !isLoading && !hasMatches ? (
          <EmptyState title="Brak nadchodzących meczów" description="Obecnie nie ma zaplanowanych meczów w tej lidze" />
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
