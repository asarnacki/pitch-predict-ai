import { useState, useRef } from "react";
import { Spinner } from "./Spinner";
import { BarChart } from "./BarChart";
import { SavePredictionForm, type SavePredictionFormHandle } from "./SavePredictionForm";
import type { MatchDTO, UserChoice } from "@/types";
import type { PredictionState } from "./hooks/usePredictions";

interface PredictionResultProps {
  match: MatchDTO;
  predictionState?: PredictionState;
  onSave: (matchId: string, note: string | null, userChoice: UserChoice | null) => void;
}

export function PredictionResult({ match, predictionState, onSave }: PredictionResultProps) {
  const [userChoice, setUserChoice] = useState<UserChoice | null>(null);
  const formRef = useRef<SavePredictionFormHandle>(null);

  const handleChoiceSelect = (choice: UserChoice) => {
    const newChoice = userChoice === choice ? null : choice;
    setUserChoice(newChoice);

    if (formRef.current) {
      formRef.current.setUserChoice(newChoice);
    }
  };

  if (!predictionState || predictionState.status === "idle") {
    return (
      <div className="py-8 text-center">
        <p className="text-sm sm:text-base text-muted-foreground">Kliknij, aby wygenerować predykcję AI</p>
      </div>
    );
  }

  if (predictionState.status === "loading") {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4">
        <Spinner className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        <p className="text-sm sm:text-base text-muted-foreground">Generowanie predykcji AI...</p>
      </div>
    );
  }

  if (predictionState.status === "error") {
    return (
      <div className="py-8 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-destructive font-medium text-sm sm:text-base">Wystąpił błąd</div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {predictionState.error || "Nie udało się wygenerować predykcji"}
          </p>
          <p className="text-xs text-muted-foreground mt-4">Otwórz kartę ponownie, aby spróbować jeszcze raz</p>
        </div>
      </div>
    );
  }

  if (predictionState.status === "success" && predictionState.data) {
    const { prediction, home_team, away_team, generated_at } = predictionState.data;

    const generatedDate = new Date(generated_at);
    const formattedGeneratedDate = generatedDate.toLocaleString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-base sm:text-lg font-semibold mb-2">Predykcja AI</h4>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            Kliknij na słupek, aby wybrać swoją predykcję (opcjonalnie)
          </p>
          <BarChart
            prediction={prediction}
            homeTeam={home_team}
            awayTeam={away_team}
            interactive={true}
            selectedChoice={userChoice}
            onChoiceSelect={handleChoiceSelect}
          />
        </div>

        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          Wygenerowano: {formattedGeneratedDate}
        </div>

        {/* Save form is always shown. If user is not authenticated, */}
        {/* the backend API will return 401 and an error will be displayed. */}
        {/* For better UX, we could pass user prop from Astro.locals and show */}
        {/* "Login to save" message instead of the form for unauthenticated users. */}
        <SavePredictionForm ref={formRef} matchId={match.id} saveStatus={predictionState.saveStatus} onSave={onSave} />
      </div>
    );
  }

  return null;
}
