import { ref } from "vue";
import { useForm, type TypedSchema } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { toast } from "vue-sonner";
import { useTranslation } from "@/lib/i18n";

import { loginSchema, registerSchema, resetPasswordSchema, updatePasswordSchema } from "@/lib/validation/auth.schemas";

import { authService } from "@/services/api/auth.service";
import { ApiError } from "@/services/api/client";

export type AuthFormMode = "login" | "register" | "reset-password" | "update-password";

export interface AuthFormValues {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function useAuthForm({ mode, onSuccess }: { mode: AuthFormMode; onSuccess?: () => void }) {
  const isSubmitting = ref(false);
  const apiError = ref<string | null>(null);
  const t = useTranslation();

  const getSchema = () => {
    switch (mode) {
      case "login":
        return loginSchema;
      case "register":
        return registerSchema;
      case "reset-password":
        return resetPasswordSchema;
      case "update-password":
        return updatePasswordSchema;
      default:
        return loginSchema;
    }
  };

  const form = useForm<AuthFormValues>({
    validationSchema: toTypedSchema(getSchema()) as TypedSchema<AuthFormValues>,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    isSubmitting.value = true;
    apiError.value = null;

    try {
      // Call appropriate auth service method based on mode
      switch (mode) {
        case "login":
          await authService.login(data.email ?? "", data.password ?? "");
          toast.success(t.value.auth.toast.loginSuccess);
          window.location.href = "/";
          break;

        case "register":
          await authService.register(data.email ?? "", data.password ?? "");
          toast.success(t.value.auth.toast.registerSuccess);
          window.location.href = "/";
          break;

        case "reset-password":
          await authService.resetPassword(data.email ?? "");
          toast.success(t.value.auth.toast.resetPasswordSuccess);
          if (onSuccess) onSuccess();
          break;

        case "update-password":
          await authService.updatePassword(data.password ?? "");
          toast.success(t.value.auth.toast.updatePasswordSuccess);
          window.location.href = "/login";
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : t.value.auth.errors.connection;

      apiError.value = errorMessage;
      toast.error(errorMessage);
    } finally {
      isSubmitting.value = false;
    }
  });

  return {
    form,
    isSubmitting,
    apiError,
    handleSubmit,
  };
}
