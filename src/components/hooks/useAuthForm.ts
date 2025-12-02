import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ResetPasswordFormData,
  type UpdatePasswordFormData,
} from "@/lib/validation/auth.schemas";

import { authService } from "@/services/api/auth.service";
import { ApiError } from "@/services/api/client";

export type AuthFormMode = "login" | "register" | "reset-password" | "update-password";

interface UseAuthFormReturn<T> {
  form: ReturnType<typeof useForm<T>>;
  isSubmitting: boolean;
  apiError: string | null;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

type AuthFormData = LoginFormData | RegisterFormData | ResetPasswordFormData | UpdatePasswordFormData;

export function useAuthForm(options: { mode: "login"; onSuccess?: () => void }): UseAuthFormReturn<LoginFormData>;
export function useAuthForm(options: { mode: "register"; onSuccess?: () => void }): UseAuthFormReturn<RegisterFormData>;
export function useAuthForm(options: {
  mode: "reset-password";
  onSuccess?: () => void;
}): UseAuthFormReturn<ResetPasswordFormData>;
export function useAuthForm(options: {
  mode: "update-password";
  onSuccess?: () => void;
}): UseAuthFormReturn<UpdatePasswordFormData>;

export function useAuthForm({
  mode,
  onSuccess,
}: {
  mode: AuthFormMode;
  onSuccess?: () => void;
}): UseAuthFormReturn<AuthFormData> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const getResolver = () => {
    switch (mode) {
      case "login":
        return zodResolver(loginSchema);
      case "register":
        return zodResolver(registerSchema);
      case "reset-password":
        return zodResolver(resetPasswordSchema);
      case "update-password":
        return zodResolver(updatePasswordSchema);
      default:
        return zodResolver(loginSchema);
    }
  };

  const form = useForm({
    resolver: getResolver(),
    mode: "onBlur",
  });

  const handleSubmit = useCallback(
    async (data: AuthFormData) => {
      setIsSubmitting(true);
      setApiError(null);

      try {
        // Call appropriate auth service method based on mode
        switch (mode) {
          case "login":
            await authService.login(data.email, data.password);
            toast.success("Zalogowano pomyślnie!");
            window.location.href = "/";
            break;

          case "register":
            await authService.register(data.email, data.password);
            toast.success("Rejestracja zakończona pomyślnie!");
            window.location.href = "/";
            break;

          case "reset-password":
            await authService.resetPassword(data.email);
            toast.success("Link do resetowania hasła został wysłany na e-mail");
            if (onSuccess) onSuccess();
            break;

          case "update-password":
            await authService.updatePassword(data.password);
            toast.success("Hasło zostało zmienione pomyślnie!");
            window.location.href = "/login";
            break;
        }
      } catch (error) {
        const errorMessage =
          error instanceof ApiError ? error.message : "Wystąpił błąd połączenia. Sprawdź połączenie internetowe.";

        setApiError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [mode, onSuccess]
  );

  return {
    form,
    isSubmitting,
    apiError,
    handleSubmit: form.handleSubmit(handleSubmit),
  };
}
