import { useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCard } from "./MatchCard";
import type { MatchDTO, UserChoice } from "@/types";
import type { PredictionState } from "./hooks/usePredictions";

interface MatchListProps {
  matches: MatchDTO[];
  isLoading: boolean;
  predictionsState: Record<string, PredictionState>;
  onGeneratePrediction: (match: MatchDTO) => void;
  onSavePrediction: (matchId: string, note: string | null, userChoice: UserChoice | null) => void;
}

export function MatchList({
  matches,
  isLoading,
  predictionsState,
  onGeneratePrediction,
  onSavePrediction,
}: MatchListProps) {
  const [openedMatches, setOpenedMatches] = useState<Set<string>>(new Set());

  const handleAccordionChange = (value: string) => {
    if (value) {
      const match = matches.find((m) => m.id === value);
      if (match) {
        const predictionState = predictionsState[value];
        if (!openedMatches.has(value) || predictionState?.status === "error") {
          if (!predictionState || predictionState.status === "idle" || predictionState.status === "error") {
            onGeneratePrediction(match);
          }
          if (!openedMatches.has(value)) {
            setOpenedMatches(new Set([...openedMatches, value]));
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border rounded-lg bg-card p-4 sm:p-6">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-40 mx-auto" />
              <div className="flex items-center justify-center gap-4">
                <Skeleton className="h-5 w-24 sm:w-32" />
                <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
                <Skeleton className="h-5 w-24 sm:w-32" />
              </div>
              <Skeleton className="h-3 w-32 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-4" onValueChange={handleAccordionChange}>
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          predictionState={predictionsState[match.id]}
          onSavePrediction={onSavePrediction}
        />
      ))}
    </Accordion>
  );
}
