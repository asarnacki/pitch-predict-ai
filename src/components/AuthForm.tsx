import { useAuthForm, type AuthFormMode } from "./hooks/useAuthForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AuthFormProps {
  mode: AuthFormMode;
  onSuccess?: () => void;
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
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
          title: "Zaloguj się",
          buttonText: "Zaloguj się",
          showEmail: true,
          showPassword: true,
          showConfirmPassword: false,
        };
      case "register":
        return {
          title: "Zarejestruj się",
          buttonText: "Zarejestruj się",
          showEmail: true,
          showPassword: true,
          showConfirmPassword: true,
        };
      case "reset-password":
        return {
          title: "Resetuj hasło",
          buttonText: "Wyślij link resetujący",
          showEmail: true,
          showPassword: false,
          showConfirmPassword: false,
        };
      case "update-password":
        return {
          title: "Ustaw nowe hasło",
          buttonText: "Zmień hasło",
          showEmail: false,
          showPassword: true,
          showConfirmPassword: true,
        };
    }
  };

  const config = getFormConfig();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border rounded-lg shadow-lg p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="auth-form-heading">
            {config.title}
          </h1>
          {mode === "reset-password" && (
            <p className="text-sm text-muted-foreground">
              Podaj swój adres e-mail, a wyślemy Ci link do zresetowania hasła
            </p>
          )}
          {mode === "update-password" && (
            <p className="text-sm text-muted-foreground">Wprowadź nowe hasło dla swojego konta</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          {config.showEmail && (
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
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
                <Label htmlFor="password">Hasło</Label>
                {mode === "login" && (
                  <a
                    href="/reset-password"
                    className="text-xs text-primary hover:underline"
                    data-testid="auth-reset-password-link"
                  >
                    Zapomniałeś hasła?
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
              <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
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
            {isSubmitting ? "Przetwarzanie..." : config.buttonText}
          </Button>
        </form>

        {/* Additional links */}
        <div className="text-center space-y-2">
          {mode === "login" && (
            <p className="text-sm text-muted-foreground">
              Nie masz konta?{" "}
              <a href="/register" className="text-primary hover:underline font-medium" data-testid="auth-register-link">
                Zarejestruj się
              </a>
            </p>
          )}
          {mode === "register" && (
            <p className="text-sm text-muted-foreground">
              Masz już konto?{" "}
              <a href="/login" className="text-primary hover:underline font-medium" data-testid="auth-login-link">
                Zaloguj się
              </a>
            </p>
          )}
          {mode === "reset-password" && (
            <p className="text-sm text-muted-foreground">
              Pamiętasz hasło?{" "}
              <a href="/login" className="text-primary hover:underline font-medium" data-testid="auth-login-link">
                Zaloguj się
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
