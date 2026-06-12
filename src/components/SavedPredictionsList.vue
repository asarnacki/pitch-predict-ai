<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/Spinner.vue";
import EmptyState from "@/components/EmptyState.vue";
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
import { Trash2, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, Home, Minus, Plane } from "lucide-vue-next";
import { toast } from "vue-sonner";
import type {
  PredictionDTO,
  ApiSuccessResponse,
  PaginatedPredictionsResponseDTO,
  PredictionProbabilities,
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
  if (!predictionToDelete.value) return;

  try {
    const response = await fetch(`/api/predictions/${predictionToDelete.value.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || t.value.predictions.errors.deleteFailed);
    }

    toast.success(t.value.predictions.toasts.deletedSuccess);
    deleteDialogOpen.value = false;
    predictionToDelete.value = null;
    fetchPredictions(offset.value);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t.value.predictions.toasts.deletedError);
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
    class="py-12 flex flex-col items-center justify-center gap-4"
  >
    <Spinner class="h-10 w-10 text-primary" />
    <p class="text-base text-muted-foreground">{{ t.predictions.ui.loadingList }}</p>
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
        class="border rounded-lg bg-card transition-all duration-150 hover:shadow-md"
      >
        <div class="px-4 py-3 border-b bg-accent/5">
          <div class="flex items-start justify-between gap-3 mb-2">
            <Badge variant="secondary" class="text-xs font-medium">
              {{ prediction.league }}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 flex-shrink-0"
              @click="handleDeleteClick(prediction)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
          <div class="font-semibold text-sm sm:text-base">{{ prediction.home_team }} vs {{ prediction.away_team }}</div>
          <div class="text-xs text-muted-foreground mt-1">
            {{ formatMatchDate(prediction) }} {{ formatMatchTime(prediction) }}
          </div>
        </div>

        <div class="p-4 space-y-3">
          <div v-if="prediction.user_choice" class="flex items-start gap-3">
            <CheckCircle2 class="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div class="flex-1 min-w-0">
              <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {{ t.predictions.ui.yourChoice }}
              </div>
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="font-bold text-base text-primary">{{ getUserChoiceLabel(prediction) }}</span>
                <Badge v-if="getPredictionResult(prediction)" variant="secondary" class="text-xs font-medium">
                  <TrendingUp class="h-3 w-3 mr-1" />
                  AI: {{ getUserChoicePercentage(prediction, getPredictionResult(prediction)) }}%
                </Badge>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-muted-foreground italic">{{ t.predictions.ui.noChoice }}</div>

          <div v-if="getPredictionResult(prediction)" class="pt-3 border-t space-y-2">
            <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {{ t.predictions.ui.aiTitle }}
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="text-center p-2.5 rounded bg-muted/50 space-y-1">
                <Home class="h-4 w-4 mx-auto text-muted-foreground" />
                <div class="font-medium text-muted-foreground text-[10px] leading-tight">
                  {{ t.predictions.ui.chart.home }}
                </div>
                <div class="font-bold text-sm">{{ Math.round(getPredictionResult(prediction)!.home * 100) }}%</div>
              </div>
              <div class="text-center p-2.5 rounded bg-muted/50 space-y-1">
                <Minus class="h-4 w-4 mx-auto text-muted-foreground" />
                <div class="font-medium text-muted-foreground text-[10px] leading-tight">
                  {{ t.predictions.ui.chart.draw }}
                </div>
                <div class="font-bold text-sm">{{ Math.round(getPredictionResult(prediction)!.draw * 100) }}%</div>
              </div>
              <div class="text-center p-2.5 rounded bg-muted/50 space-y-1">
                <Plane class="h-4 w-4 mx-auto text-muted-foreground" />
                <div class="font-medium text-muted-foreground text-[10px] leading-tight">
                  {{ t.predictions.ui.chart.away }}
                </div>
                <div class="font-bold text-sm">{{ Math.round(getPredictionResult(prediction)!.away * 100) }}%</div>
              </div>
            </div>
          </div>

          <div v-if="prediction.note" class="pt-3 border-t">
            <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {{ t.predictions.ui.note }}
            </div>
            <p class="text-sm text-foreground">{{ prediction.note }}</p>
          </div>

          <div class="pt-2 text-xs text-muted-foreground">
            {{ t.predictions.ui.savedAt }} {{ formatCreatedDate(prediction) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 pt-2">
      <Button variant="outline" size="sm" :disabled="offset === 0 || status === 'loading'" @click="handlePrevPage">
        <ChevronLeft class="h-4 w-4 mr-1" />
        {{ t.predictions.ui.previous }}
      </Button>

      <span class="text-sm text-muted-foreground">
        {{ t.predictions.ui.page }} {{ currentPage }} {{ t.predictions.ui.of }} {{ totalPages }}
      </span>

      <Button variant="outline" size="sm" :disabled="!hasMore || status === 'loading'" @click="handleNextPage">
        {{ t.predictions.ui.next }}
        <ChevronRight class="h-4 w-4 ml-1" />
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
              <div class="mt-3 font-medium text-foreground">{{ t.predictions.ui.deleteCannotUndo }}</div>
            </template>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t.common.cancel }}</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="handleDeleteConfirm"
          >
            {{ t.common.delete }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
