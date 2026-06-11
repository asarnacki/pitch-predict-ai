import { useEffect, useImperativeHandle, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BUSINESS_RULES } from "@/types";
import type { UserChoice } from "@/types";
import type { PredictionState } from "./hooks/usePredictions";
import {
  savePredictionSchema,
  type SavePredictionFormData,
  type SavePredictionFormInput,
} from "@/lib/validation/prediction.schemas";
import { useTranslation } from "@/lib/i18n";

export interface SavePredictionFormHandle {
  setUserChoice: (choice: UserChoice | null) => void;
  getUserChoice: () => UserChoice | null;
}

interface SavePredictionFormProps {
  matchId: string;
  saveStatus: PredictionState["saveStatus"];
  isAuthenticated: boolean;
  onSave: (matchId: string, note: string | null, userChoice: UserChoice | null) => void;
}

export const SavePredictionForm = forwardRef<SavePredictionFormHandle, SavePredictionFormProps>(
  function SavePredictionForm({ matchId, saveStatus, isAuthenticated, onSave }, ref) {
    const t = useTranslation();
    const form = useForm<SavePredictionFormInput, undefined, SavePredictionFormData>({
      resolver: zodResolver(savePredictionSchema),
      defaultValues: {
        note: "",
        userChoice: null,
      },
    });

    const {
      register,
      handleSubmit: formHandleSubmit,
      watch,
      setValue,
      formState: { errors },
    } = form;

    const noteValue = watch("note") || "";
    const userChoice = watch("userChoice");

    useImperativeHandle(
      ref,
      () => ({
        setUserChoice: (choice: UserChoice | null) => {
          setValue("userChoice", choice);
        },
        getUserChoice: () => userChoice,
      }),
      [setValue, userChoice]
    );

    useEffect(() => {
      if (saveStatus === "saved") {
        toast.success(t.predictions.toasts.savedSuccess);
        // Reset form after successful save
        form.reset();
      } else if (saveStatus === "error") {
        toast.error(t.predictions.toasts.savedError);
      }
    }, [saveStatus, form, t]);

    const onSubmit = (data: SavePredictionFormData) => {
      onSave(matchId, data.note, data.userChoice);
    };

    const isSaving = saveStatus === "saving";
    const isSaved = saveStatus === "saved";
    const isAuthDisabled = !isAuthenticated;
    const isDisabled = isSaving || isSaved || isAuthDisabled;

    return (
      <form onSubmit={formHandleSubmit(onSubmit)} className="mt-6 pt-6 border-t space-y-4">
        {isAuthDisabled && (
          <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/50 px-3 py-2 text-xs sm:text-sm text-muted-foreground">
            {t.predictions.ui.saveForm.loginRequiredPrefix}{" "}
            <a href="/login" className="underline underline-offset-4">
              {t.nav.login}
            </a>{" "}
            {t.common.or}{" "}
            <a href="/register" className="underline underline-offset-4">
              {t.predictions.ui.saveForm.createAccountLink}
            </a>{" "}
            {t.predictions.ui.saveForm.unlockFeatures}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor={`note-${matchId}`} className="text-xs sm:text-sm font-medium block">
            {t.predictions.ui.saveForm.addNoteLabel}
          </label>
          <Textarea
            id={`note-${matchId}`}
            placeholder={t.predictions.ui.saveForm.addNotePlaceholder}
            maxLength={BUSINESS_RULES.MAX_NOTE_LENGTH}
            disabled={isDisabled}
            className={`resize-none text-sm ${
              isDisabled ? "cursor-not-allowed" : "cursor-text"
            } ${isAuthDisabled ? "bg-muted text-muted-foreground" : ""}`}
            rows={3}
            {...register("note")}
          />
          {errors.note && <p className="text-xs text-destructive">{errors.note.message}</p>}
          <div className="flex justify-end items-center text-xs text-muted-foreground">
            <span>
              {noteValue.length}/{BUSINESS_RULES.MAX_NOTE_LENGTH} {t.common.characters}
            </span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isDisabled}
          className={`w-full text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-auto ${
            isAuthDisabled ? "border border-dashed bg-muted text-muted-foreground" : ""
          }`}
          variant={isSaved ? "secondary" : "default"}
        >
          {isSaving
            ? t.predictions.ui.saveForm.saving
            : isSaved
              ? t.predictions.ui.saveForm.saved
              : t.predictions.savePrediction}
        </Button>
      </form>
    );
  }
);
