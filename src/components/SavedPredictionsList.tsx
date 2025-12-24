import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, Home, Minus, Plane } from "lucide-react";
import { toast } from "sonner";
import type {
  PredictionDTO,
  ApiSuccessResponse,
  PaginatedPredictionsResponseDTO,
  PredictionProbabilities,
} from "@/types";
import { isPredictionProbabilities } from "@/types";
import { useLanguage, useTranslation } from "@/lib/i18n";

const LIMIT = 10;

export function SavedPredictionsList() {
  const [predictions, setPredictions] = useState<PredictionDTO[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [predictionToDelete, setPredictionToDelete] = useState<PredictionDTO | null>(null);
  const t = useTranslation();
  const { language } = useLanguage();

  const fetchPredictions = useCallback(
    async (newOffset: number) => {
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch(`/api/predictions?limit=${LIMIT}&offset=${newOffset}&sort=created_at&order=desc`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || t.predictions.errors.fetchPredictionsFailed);
        }

        const result: ApiSuccessResponse<PaginatedPredictionsResponseDTO> = await response.json();

        setPredictions(result.data.predictions);
        setHasMore(result.data.pagination.has_more);
        setTotal(result.data.pagination.total);
        setOffset(newOffset);
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.error);
        setStatus("error");
      }
    },
    [t]
  );

  const handleDeleteClick = (prediction: PredictionDTO) => {
    setPredictionToDelete(prediction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!predictionToDelete) return;

    try {
      const response = await fetch(`/api/predictions/${predictionToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || t.predictions.errors.deleteFailed);
      }

      toast.success(t.predictions.toasts.deletedSuccess);
      setDeleteDialogOpen(false);
      setPredictionToDelete(null);
      fetchPredictions(offset);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.predictions.toasts.deletedError);
      setDeleteDialogOpen(false);
      setPredictionToDelete(null);
    }
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, offset - LIMIT);
    fetchPredictions(newOffset);
  };

  const handleNextPage = () => {
    const newOffset = offset + LIMIT;
    fetchPredictions(newOffset);
  };

  useEffect(() => {
    fetchPredictions(0);
  }, [fetchPredictions]);

  if (status === "loading" && predictions.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4">
        <Spinner className="h-10 w-10 text-primary" />
        <p className="text-base text-muted-foreground">{t.predictions.ui.loadingList}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title={t.common.error}
        description={error || t.predictions.errors.fetchPredictionsFailed}
        actionLabel={t.common.retry}
        onAction={() => fetchPredictions(offset)}
      />
    );
  }

  if (status === "success" && predictions.length === 0) {
    return (
      <EmptyState
        title={t.predictions.ui.emptyTitle}
        description={t.predictions.ui.emptyDescription}
        actionLabel={t.predictions.ui.goHome}
        onAction={() => (window.location.href = "/")}
      />
    );
  }

  const currentPage = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.ceil(total / LIMIT);

  const getUserChoiceLabel = (prediction: PredictionDTO): string => {
    if (!prediction.user_choice) return "";

    if (prediction.user_choice === "home") {
      return `${prediction.home_team} - ${t.predictions.ui.chart.homeWin}`;
    }
    if (prediction.user_choice === "draw") {
      return t.predictions.ui.chart.draw;
    }
    return `${prediction.away_team} - ${t.predictions.ui.chart.awayWin}`;
  };

  const getUserChoicePercentage = (
    prediction: PredictionDTO,
    predictionResult: PredictionProbabilities | null
  ): number => {
    if (!predictionResult || !prediction.user_choice) return 0;

    if (prediction.user_choice === "home") return Math.round(predictionResult.home * 100);
    if (prediction.user_choice === "draw") return Math.round(predictionResult.draw * 100);
    return Math.round(predictionResult.away * 100);
  };

  // Render funkcja dla kart predykcji
  const renderPredictionCard = (prediction: PredictionDTO, predictionResult: PredictionProbabilities | null) => {
    const matchDate = new Date(prediction.match_date);
    const formattedDate = matchDate.toLocaleDateString(language === "pl" ? "pl-PL" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formattedTime = matchDate.toLocaleTimeString(language === "pl" ? "pl-PL" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const createdDate = new Date(prediction.created_at);
    const formattedCreatedDate = createdDate.toLocaleDateString(language === "pl" ? "pl-PL" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const userChoicePercentage = getUserChoicePercentage(prediction, predictionResult);

    return (
      <div key={prediction.id} className="border rounded-lg bg-card transition-all duration-150 hover:shadow-md">
        <div className="px-4 py-3 border-b bg-accent/5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {prediction.league}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(prediction)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="font-semibold text-sm sm:text-base">
            {prediction.home_team} vs {prediction.away_team}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {formattedDate} {formattedTime}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {prediction.user_choice ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  {t.predictions.ui.yourChoice}
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-bold text-base text-primary">{getUserChoiceLabel(prediction)}</span>
                  {predictionResult && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      AI: {userChoicePercentage}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">{t.predictions.ui.noChoice}</div>
          )}

          {predictionResult && (
            <div className="pt-3 border-t space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t.predictions.ui.aiTitle}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2.5 rounded bg-muted/50 space-y-1">
                  <Home className="h-4 w-4 mx-auto text-muted-foreground" />
                  <div className="font-medium text-muted-foreground text-[10px] leading-tight">
                    {t.predictions.ui.chart.home}
                  </div>
                  <div className="font-bold text-sm">{Math.round(predictionResult.home * 100)}%</div>
                </div>
                <div className="text-center p-2.5 rounded bg-muted/50 space-y-1">
                  <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                  <div className="font-medium text-muted-foreground text-[10px] leading-tight">
                    {t.predictions.ui.chart.draw}
                  </div>
                  <div className="font-bold text-sm">{Math.round(predictionResult.draw * 100)}%</div>
                </div>
                <div className="text-center p-2.5 rounded bg-muted/50 space-y-1">
                  <Plane className="h-4 w-4 mx-auto text-muted-foreground" />
                  <div className="font-medium text-muted-foreground text-[10px] leading-tight">
                    {t.predictions.ui.chart.away}
                  </div>
                  <div className="font-bold text-sm">{Math.round(predictionResult.away * 100)}%</div>
                </div>
              </div>
            </div>
          )}

          {prediction.note && (
            <div className="pt-3 border-t">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {t.predictions.ui.note}
              </div>
              <p className="text-sm text-foreground">{prediction.note}</p>
            </div>
          )}

          <div className="pt-2 text-xs text-muted-foreground">
            {t.predictions.ui.savedAt} {formattedCreatedDate}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {predictions.map((prediction) => {
          const predictionResult = isPredictionProbabilities(prediction.prediction_result)
            ? (prediction.prediction_result as PredictionProbabilities)
            : null;

          return renderPredictionCard(prediction, predictionResult);
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={offset === 0 || status === "loading"}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t.predictions.ui.previous}
          </Button>

          <span className="text-sm text-muted-foreground">
            {t.predictions.ui.page} {currentPage} {t.predictions.ui.of} {totalPages}
          </span>

          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!hasMore || status === "loading"}>
            {t.predictions.ui.next}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.predictions.ui.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {predictionToDelete && (
                <>
                  <div className="mb-2">
                    <span className="font-semibold">
                      {predictionToDelete.home_team} vs {predictionToDelete.away_team}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(predictionToDelete.match_date).toLocaleDateString(language === "pl" ? "pl-PL" : "en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div className="mt-3 font-medium text-foreground">{t.predictions.ui.deleteCannotUndo}</div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
