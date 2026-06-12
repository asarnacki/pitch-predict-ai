<script setup lang="ts">
import { computed, watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { toast } from "vue-sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BUSINESS_RULES } from "@/types";
import type { UserChoice } from "@/types";
import type { PredictionState } from "./hooks/usePredictions";
import { savePredictionSchema } from "@/lib/validation/prediction.schemas";
import { useTranslation } from "@/lib/i18n";

const props = defineProps<{
  matchId: string;
  saveStatus: PredictionState["saveStatus"];
  isAuthenticated: boolean;
}>();

const emit = defineEmits<{
  save: [matchId: string, note: string | null, userChoice: UserChoice | null];
}>();

const t = useTranslation();

const form = useForm({
  validationSchema: toTypedSchema(savePredictionSchema),
  initialValues: {
    note: "",
    userChoice: null,
  },
});

const { errors } = form;
const [note, noteAttrs] = form.defineField("note");

const noteValue = computed(() => form.values.note || "");

const setUserChoice = (choice: UserChoice | null) => {
  form.setFieldValue("userChoice", choice);
};

const getUserChoice = (): UserChoice | null => form.values.userChoice ?? null;

defineExpose({ setUserChoice, getUserChoice });

watch(
  () => props.saveStatus,
  (saveStatus) => {
    if (saveStatus === "saved") {
      toast.success(t.value.predictions.toasts.savedSuccess);
      // Reset form after successful save
      form.resetForm();
    } else if (saveStatus === "error") {
      toast.error(t.value.predictions.toasts.savedError);
    }
  }
);

const onSubmit = form.handleSubmit((data) => {
  emit("save", props.matchId, data.note, data.userChoice);
});

const isSaving = computed(() => props.saveStatus === "saving");
const isSaved = computed(() => props.saveStatus === "saved");
const isAuthDisabled = computed(() => !props.isAuthenticated);
const isDisabled = computed(() => isSaving.value || isSaved.value || isAuthDisabled.value);
</script>

<template>
  <form class="mt-6 pt-6 border-t space-y-4" @submit="onSubmit">
    <div
      v-if="isAuthDisabled"
      class="rounded-md border border-dashed border-muted-foreground/40 bg-muted/50 px-3 py-2 text-xs sm:text-sm text-muted-foreground"
    >
      {{ t.predictions.ui.saveForm.loginRequiredPrefix }}
      <a href="/login" class="underline underline-offset-4">{{ t.nav.login }}</a>
      {{ t.common.or }}
      <a href="/register" class="underline underline-offset-4">{{ t.predictions.ui.saveForm.createAccountLink }}</a>
      {{ t.predictions.ui.saveForm.unlockFeatures }}
    </div>

    <div class="space-y-2">
      <label :for="`note-${matchId}`" class="text-xs sm:text-sm font-medium block">
        {{ t.predictions.ui.saveForm.addNoteLabel }}
      </label>
      <Textarea
        :id="`note-${matchId}`"
        v-model="note"
        v-bind="noteAttrs"
        :placeholder="t.predictions.ui.saveForm.addNotePlaceholder"
        :maxlength="BUSINESS_RULES.MAX_NOTE_LENGTH"
        :disabled="isDisabled"
        :class="`resize-none text-sm ${
          isDisabled ? 'cursor-not-allowed' : 'cursor-text'
        } ${isAuthDisabled ? 'bg-muted text-muted-foreground' : ''}`"
        :rows="3"
      />
      <p v-if="errors.note" class="text-xs text-destructive">{{ errors.note }}</p>
      <div class="flex justify-end items-center text-xs text-muted-foreground">
        <span> {{ noteValue.length }}/{{ BUSINESS_RULES.MAX_NOTE_LENGTH }} {{ t.common.characters }} </span>
      </div>
    </div>

    <Button
      type="submit"
      :disabled="isDisabled"
      :class="`w-full text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-auto ${
        isAuthDisabled ? 'border border-dashed bg-muted text-muted-foreground' : ''
      }`"
      :variant="isSaved ? 'secondary' : 'default'"
    >
      {{
        isSaving
          ? t.predictions.ui.saveForm.saving
          : isSaved
            ? t.predictions.ui.saveForm.saved
            : t.predictions.savePrediction
      }}
    </Button>
  </form>
</template>
