import { useState, useRef } from "react";
import { Spinner } from "./Spinner";
import { BarChart } from "./BarChart";
import { SavePredictionForm, type SavePredictionFormHandle } from "./SavePredictionForm";
import type { MatchDTO, UserChoice } from "@/types";
import type { PredictionState } from "./hooks/usePredictions";
import { useLanguage, useTranslation } from "@/lib/i18n";

interface PredictionResultProps {
  match: MatchDTO;
  predictionState?: PredictionState;
  isAuthenticated: boolean;
  onSave: (matchId: string, note: string | null, userChoice: UserChoice | null) => void;
}

export function PredictionResult({ match, predictionState, isAuthenticated, onSave }: PredictionResultProps) {
  const [userChoice, setUserChoice] = useState<UserChoice | null>(null);
  const formRef = useRef<SavePredictionFormHandle>(null);
  const t = useTranslation();
  const { language } = useLanguage();

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
        <p className="text-sm sm:text-base text-muted-foreground">{t.predictions.ui.clickToGenerate}</p>
      </div>
    );
  }

  if (predictionState.status === "loading") {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4">
        <Spinner className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        <p className="text-sm sm:text-base text-muted-foreground">{t.predictions.ui.generating}</p>
      </div>
    );
  }

  if (predictionState.status === "error") {
    return (
      <div className="py-8 text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-destructive font-medium text-sm sm:text-base">{t.predictions.ui.errorTitle}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {predictionState.error || t.predictions.errors.generateFailed}
          </p>
          <p className="text-xs text-muted-foreground mt-4">{t.predictions.ui.retryHint}</p>
        </div>
      </div>
    );
  }

  if (predictionState.status === "success" && predictionState.data) {
    const { prediction, home_team, away_team, generated_at } = predictionState.data;

    const generatedDate = new Date(generated_at);
    const formattedGeneratedDate = generatedDate.toLocaleString(language === "pl" ? "pl-PL" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-base sm:text-lg font-semibold mb-2">{t.predictions.ui.aiTitle}</h4>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">{t.predictions.ui.selectHint}</p>
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
          {t.predictions.ui.generatedAt} {formattedGeneratedDate}
        </div>

        <SavePredictionForm
          ref={formRef}
          matchId={match.id}
          saveStatus={predictionState.saveStatus}
          isAuthenticated={isAuthenticated}
          onSave={onSave}
        />
      </div>
    );
  }

  return null;
}
