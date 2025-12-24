import { useAuthForm, type AuthFormMode } from "./hooks/useAuthForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useEffect, useState } from "react";

interface AuthFormProps {
  mode: AuthFormMode;
  onSuccess?: () => void;
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const t = useTranslation();
  const [hydrated, setHydrated] = useState(false);
  const { form, isSubmitting, apiError, handleSubmit } = useAuthForm({
    mode,
    onSuccess,
  });

  const {
    register,
    formState: { errors },
  } = form;

  // Get form title and button text based on mode
  const getFormConfig = () => {
    switch (mode) {
      case "login":
        return {
          title: t.auth.login.title,
          buttonText: t.auth.login.submit,
          processingText: t.auth.login.processing,
          showEmail: true,
          showPassword: true,
          showConfirmPassword: false,
        };
      case "register":
        return {
          title: t.auth.register.title,
          buttonText: t.auth.register.submit,
          processingText: t.auth.register.processing,
          showEmail: true,
          showPassword: true,
          showConfirmPassword: true,
        };
      case "reset-password":
        return {
          title: t.auth.resetPassword.title,
          buttonText: t.auth.resetPassword.submit,
          processingText: t.auth.resetPassword.processing,
          showEmail: true,
          showPassword: false,
          showConfirmPassword: false,
        };
      case "update-password":
        return {
          title: t.auth.updatePassword.title,
          buttonText: t.auth.updatePassword.submit,
          processingText: t.auth.updatePassword.processing,
          showEmail: false,
          showPassword: true,
          showConfirmPassword: true,
        };
    }
  };

  const config = getFormConfig();

  // Mark as hydrated for E2E stability (Astro islands can be visible before listeners are attached)
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto" data-testid="auth-form" data-hydrated={hydrated ? "true" : "false"}>
      <div className="bg-card border rounded-lg shadow-lg p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="auth-form-heading">
            {config.title}
          </h1>
          {mode === "reset-password" && (
            <p className="text-sm text-muted-foreground">{t.auth.resetPassword.description}</p>
          )}
          {mode === "update-password" && (
            <p className="text-sm text-muted-foreground">{t.auth.updatePassword.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          {config.showEmail && (
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.login.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                data-testid={`${mode}-email-input`}
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
            </div>
          )}

          {/* Password field */}
          {config.showPassword && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t.auth.login.password}</Label>
                {mode === "login" && (
                  <a
                    href="/reset-password"
                    className="text-xs text-primary hover:underline"
                    data-testid="auth-reset-password-link"
                  >
                    {t.auth.login.forgotPassword}
                  </a>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                data-testid={`${mode}-password-input`}
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
            </div>
          )}

          {/* Confirm Password field */}
          {config.showConfirmPassword && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.auth.register.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                disabled={isSubmitting}
                aria-invalid={!!errors.confirmPassword}
                data-testid={`${mode}-confirm-password-input`}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message as string}</p>
              )}
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div
              className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
              data-testid="auth-form-error"
            >
              {apiError}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
            data-testid={`${mode}-submit-button`}
          >
            {isSubmitting ? config.processingText : config.buttonText}
          </Button>
        </form>

        {/* Additional links */}
        <div className="text-center space-y-2">
          {mode === "login" && (
            <p className="text-sm text-muted-foreground">
              {t.auth.login.noAccount}{" "}
              <a href="/register" className="text-primary hover:underline font-medium" data-testid="auth-register-link">
                {t.auth.login.registerLink}
              </a>
            </p>
          )}
          {mode === "register" && (
            <p className="text-sm text-muted-foreground">
              {t.auth.register.hasAccount}{" "}
              <a href="/login" className="text-primary hover:underline font-medium" data-testid="auth-login-link">
                {t.auth.register.loginLink}
              </a>
            </p>
          )}
          {mode === "reset-password" && (
            <p className="text-sm text-muted-foreground">
              {t.auth.resetPassword.rememberPassword}{" "}
              <a href="/login" className="text-primary hover:underline font-medium" data-testid="auth-login-link">
                {t.auth.resetPassword.loginLink}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
