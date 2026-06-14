<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/Spinner.vue";
import EmptyState from "@/components/EmptyState.vue";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Home,
  Minus,
  Plane,
  RefreshCw,
  Trophy,
  XCircle,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import type {
  PredictionDTO,
  ApiSuccessResponse,
  PaginatedPredictionsResponseDTO,
  PredictionProbabilities,
  UserChoice,
} from "@/types";
import { isPredictionProbabilities } from "@/types";
import { useLanguage, useTranslation } from "@/lib/i18n";

const LIMIT = 10;

const predictions = ref<PredictionDTO[]>([]);
const status = ref<"idle" | "loading" | "success" | "error">("idle");
const error = ref<string | null>(null);
const offset = ref(0);
const hasMore = ref(false);
const total = ref(0);
const deleteDialogOpen = ref(false);
const predictionToDelete = ref<PredictionDTO | null>(null);
const isDeleting = ref(false);
const fetchingResultId = ref<number | null>(null);
const t = useTranslation();
const { language } = useLanguage();

const locale = computed(() => (language.value === "pl" ? "pl-PL" : "en-US"));

const fetchPredictions = async (newOffset: number) => {
  status.value = "loading";
  error.value = null;

  try {
    const response = await fetch(`/api/predictions?limit=${LIMIT}&offset=${newOffset}&sort=created_at&order=desc`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || t.value.predictions.errors.fetchPredictionsFailed);
    }

    const result: ApiSuccessResponse<PaginatedPredictionsResponseDTO> = await response.json();

    predictions.value = result.data.predictions;
    hasMore.value = result.data.pagination.has_more;
    total.value = result.data.pagination.total;
    offset.value = newOffset;
    status.value = "success";
  } catch (err) {
    error.value = err instanceof Error ? err.message : t.value.common.error;
    status.value = "error";
  }
};

const handleDeleteClick = (prediction: PredictionDTO) => {
  predictionToDelete.value = prediction;
  deleteDialogOpen.value = true;
};

const handleDeleteConfirm = async () => {
  if (!predictionToDelete.value || isDeleting.value) return;

  isDeleting.value = true;
  try {
    const response = await fetch(`/api/predictions/${predictionToDelete.value.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || t.value.predictions.errors.deleteFailed);
    }

    toast.success(t.value.predictions.toasts.deletedSuccess);
    fetchPredictions(offset.value);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t.value.predictions.toasts.deletedError);
  } finally {
    isDeleting.value = false;
    deleteDialogOpen.value = false;
    predictionToDelete.value = null;
  }
};

const handlePrevPage = () => {
  fetchPredictions(Math.max(0, offset.value - LIMIT));
};

const handleNextPage = () => {
  fetchPredictions(offset.value + LIMIT);
};

const handleCheckResult = async (prediction: PredictionDTO) => {
  if (fetchingResultId.value !== null) return;

  fetchingResultId.value = prediction.id;
  try {
    const response = await fetch(`/api/predictions/${prediction.id}/fetch-result`, {
      method: "POST",
    });
    const result = await response.json();

    if (!response.ok) {
      // 409 when the match (incl. the API's 3h buffer) hasn't finished yet — not a real error.
      if (result.error?.code === "MATCH_NOT_FINISHED") {
        toast.info(t.value.predictions.toasts.matchNotFinished);
      } else {
        toast.error(result.error?.message || t.value.predictions.toasts.resultFetchError);
      }
      return;
    }

    // Swap in the API's version (now carrying home_score / away_score) so the result renders.
    const updated = result.data as PredictionDTO;
    const index = predictions.value.findIndex((p) => p.id === updated.id);
    if (index !== -1) {
      predictions.value[index] = updated;
    }
    toast.success(t.value.predictions.toasts.resultFetchedSuccess);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t.value.predictions.toasts.resultFetchError);
  } finally {
    fetchingResultId.value = null;
  }
};

onMounted(() => {
  fetchPredictions(0);
});

const goHome = () => {
  window.location.href = "/";
};

const currentPage = computed(() => Math.floor(offset.value / LIMIT) + 1);
const totalPages = computed(() => Math.ceil(total.value / LIMIT));

const getPredictionResult = (prediction: PredictionDTO): PredictionProbabilities | null =>
  isPredictionProbabilities(prediction.prediction_result)
    ? (prediction.prediction_result as PredictionProbabilities)
    : null;

const getUserChoiceLabel = (prediction: PredictionDTO): string => {
  if (!prediction.user_choice) return "";

  if (prediction.user_choice === "home") {
    return `${prediction.home_team} - ${t.value.predictions.ui.chart.homeWin}`;
  }
  if (prediction.user_choice === "draw") {
    return t.value.predictions.ui.chart.draw;
  }
  return `${prediction.away_team} - ${t.value.predictions.ui.chart.awayWin}`;
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

const isMatchFinished = (prediction: PredictionDTO): boolean => new Date(prediction.match_date).getTime() < Date.now();

const hasResult = (prediction: PredictionDTO): boolean =>
  prediction.home_score !== null && prediction.away_score !== null;

// Derive the real 1X2 outcome from the final score.
const actualOutcome = (prediction: PredictionDTO): UserChoice | null => {
  if (prediction.home_score === null || prediction.away_score === null) return null;
  if (prediction.home_score > prediction.away_score) return "home";
  if (prediction.home_score < prediction.away_score) return "away";
  return "draw";
};

// null = no verdict to render (user made no pick, or result not fetched yet).
const isChoiceCorrect = (prediction: PredictionDTO): boolean | null => {
  if (!prediction.user_choice) return null;
  const outcome = actualOutcome(prediction);
  if (outcome === null) return null;
  return prediction.user_choice === outcome;
};

const formatMatchDate = (prediction: PredictionDTO) =>
  new Date(prediction.match_date).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatMatchTime = (prediction: PredictionDTO) =>
  new Date(prediction.match_date).toLocaleTimeString(locale.value, {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCreatedDate = (prediction: PredictionDTO) =>
  new Date(prediction.created_at).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
</script>

<template>
  <div
    v-if="status === 'loading' && predictions.length === 0"
    class="flex flex-col items-center justify-center gap-4 py-12"
  >
    <Spinner class="text-primary h-10 w-10" />
    <p class="text-muted-foreground text-base">{{ t.predictions.ui.loadingList }}</p>
  </div>

  <EmptyState
    v-else-if="status === 'error'"
    :title="t.common.error"
    :description="error || t.predictions.errors.fetchPredictionsFailed"
    :action-label="t.common.retry"
    @action="fetchPredictions(offset)"
  />

  <EmptyState
    v-else-if="status === 'success' && predictions.length === 0"
    :title="t.predictions.ui.emptyTitle"
    :description="t.predictions.ui.emptyDescription"
    :action-label="t.predictions.ui.goHome"
    @action="goHome"
  />

  <div v-else class="space-y-6">
    <div class="space-y-3">
      <div
        v-for="prediction in predictions"
        :key="prediction.id"
        class="bg-card rounded-lg border transition-all duration-150 hover:shadow-md"
      >
        <div class="bg-accent/5 border-b px-4 py-3">
          <div class="mb-2 flex items-start justify-between gap-3">
            <Badge variant="secondary" class="text-xs font-medium">
              {{ prediction.league }}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0 p-0 transition-all duration-150"
              @click="handleDeleteClick(prediction)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
          <div class="text-sm font-semibold sm:text-base">{{ prediction.home_team }} vs {{ prediction.away_team }}</div>
          <div class="text-muted-foreground mt-1 text-xs">
            {{ formatMatchDate(prediction) }} {{ formatMatchTime(prediction) }}
          </div>
        </div>

        <div class="space-y-3 p-4">
          <div v-if="prediction.user_choice" class="flex items-start gap-3">
            <CheckCircle2 class="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                {{ t.predictions.ui.yourChoice }}
              </div>
              <div class="flex flex-wrap items-baseline gap-2">
                <span class="text-primary text-base font-bold">{{ getUserChoiceLabel(prediction) }}</span>
                <Badge v-if="getPredictionResult(prediction)" variant="secondary" class="text-xs font-medium">
                  <TrendingUp class="mr-1 h-3 w-3" />
                  AI: {{ getUserChoicePercentage(prediction, getPredictionResult(prediction)) }}%
                </Badge>
              </div>
            </div>
          </div>
          <div v-else class="text-muted-foreground text-sm italic">{{ t.predictions.ui.noChoice }}</div>

          <div v-if="getPredictionResult(prediction)" class="space-y-2 border-t pt-3">
            <div class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {{ t.predictions.ui.aiTitle }}
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="bg-muted/50 space-y-1 rounded p-2.5 text-center">
                <Home class="text-muted-foreground mx-auto h-4 w-4" />
                <div class="text-muted-foreground text-[10px] leading-tight font-medium">
                  {{ t.predictions.ui.chart.home }}
                </div>
                <div class="text-sm font-bold">{{ Math.round(getPredictionResult(prediction)!.home * 100) }}%</div>
              </div>
              <div class="bg-muted/50 space-y-1 rounded p-2.5 text-center">
                <Minus class="text-muted-foreground mx-auto h-4 w-4" />
                <div class="text-muted-foreground text-[10px] leading-tight font-medium">
                  {{ t.predictions.ui.chart.draw }}
                </div>
                <div class="text-sm font-bold">{{ Math.round(getPredictionResult(prediction)!.draw * 100) }}%</div>
              </div>
              <div class="bg-muted/50 space-y-1 rounded p-2.5 text-center">
                <Plane class="text-muted-foreground mx-auto h-4 w-4" />
                <div class="text-muted-foreground text-[10px] leading-tight font-medium">
                  {{ t.predictions.ui.chart.away }}
                </div>
                <div class="text-sm font-bold">{{ Math.round(getPredictionResult(prediction)!.away * 100) }}%</div>
              </div>
            </div>
          </div>

          <div v-if="hasResult(prediction)" class="space-y-2 border-t pt-3">
            <div class="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <Trophy class="h-3.5 w-3.5" />
              {{ t.predictions.ui.matchResult }}
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="text-2xl font-bold tabular-nums">
                {{ prediction.home_score }} : {{ prediction.away_score }}
              </div>
              <span
                v-if="isChoiceCorrect(prediction) !== null"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold',
                  isChoiceCorrect(prediction)
                    ? 'bg-green-600/10 text-green-700 dark:text-green-400'
                    : 'bg-destructive/10 text-destructive',
                ]"
              >
                <CheckCircle2 v-if="isChoiceCorrect(prediction)" class="h-4 w-4" />
                <XCircle v-else class="h-4 w-4" />
                {{ isChoiceCorrect(prediction) ? t.predictions.ui.correct : t.predictions.ui.incorrect }}
              </span>
            </div>
          </div>

          <div v-else-if="isMatchFinished(prediction)" class="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              class="w-full sm:w-auto"
              :disabled="fetchingResultId === prediction.id"
              @click="handleCheckResult(prediction)"
            >
              <Spinner v-if="fetchingResultId === prediction.id" class="mr-2 h-4 w-4" />
              <RefreshCw v-else class="mr-2 h-4 w-4" />
              {{ fetchingResultId === prediction.id ? t.predictions.ui.checking : t.predictions.ui.checkResult }}
            </Button>
          </div>

          <div v-if="prediction.note" class="border-t pt-3">
            <div class="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              {{ t.predictions.ui.note }}
            </div>
            <p class="text-foreground text-sm">{{ prediction.note }}</p>
          </div>

          <div class="text-muted-foreground pt-2 text-xs">
            {{ t.predictions.ui.savedAt }} {{ formatCreatedDate(prediction) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 pt-2">
      <Button variant="outline" size="sm" :disabled="offset === 0 || status === 'loading'" @click="handlePrevPage">
        <ChevronLeft class="mr-1 h-4 w-4" />
        {{ t.predictions.ui.previous }}
      </Button>

      <span class="text-muted-foreground text-sm">
        {{ t.predictions.ui.page }} {{ currentPage }} {{ t.predictions.ui.of }} {{ totalPages }}
      </span>

      <Button variant="outline" size="sm" :disabled="!hasMore || status === 'loading'" @click="handleNextPage">
        {{ t.predictions.ui.next }}
        <ChevronRight class="ml-1 h-4 w-4" />
      </Button>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t.predictions.ui.deleteTitle }}</AlertDialogTitle>
          <AlertDialogDescription>
            <template v-if="predictionToDelete">
              <div class="mb-2">
                <span class="font-semibold">
                  {{ predictionToDelete.home_team }} vs {{ predictionToDelete.away_team }}
                </span>
              </div>
              <div class="text-muted-foreground">
                {{ formatMatchDate(predictionToDelete) }}
              </div>
              <div class="text-foreground mt-3 font-medium">{{ t.predictions.ui.deleteCannotUndo }}</div>
            </template>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting">{{ t.common.cancel }}</AlertDialogCancel>
          <Button
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isDeleting"
            @click="handleDeleteConfirm"
          >
            <Spinner v-if="isDeleting" class="mr-2 h-4 w-4" />
            {{ t.common.delete }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
