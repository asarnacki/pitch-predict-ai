<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAuthForm, type AuthFormMode } from "./hooks/useAuthForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

const props = defineProps<{
  mode: AuthFormMode;
  onSuccess?: () => void;
}>();

const t = useTranslation();
const hydrated = ref(false);
const { form, isSubmitting, apiError, handleSubmit } = useAuthForm({
  mode: props.mode,
  onSuccess: props.onSuccess,
});

const { errors } = form;
const [email, emailAttrs] = form.defineField("email");
const [password, passwordAttrs] = form.defineField("password");
const [confirmPassword, confirmPasswordAttrs] = form.defineField("confirmPassword");

// Get form title and button text based on mode
const config = computed(() => {
  switch (props.mode) {
    case "login":
      return {
        title: t.value.auth.login.title,
        buttonText: t.value.auth.login.submit,
        processingText: t.value.auth.login.processing,
        showEmail: true,
        showPassword: true,
        showConfirmPassword: false,
      };
    case "register":
      return {
        title: t.value.auth.register.title,
        buttonText: t.value.auth.register.submit,
        processingText: t.value.auth.register.processing,
        showEmail: true,
        showPassword: true,
        showConfirmPassword: true,
      };
    case "reset-password":
      return {
        title: t.value.auth.resetPassword.title,
        buttonText: t.value.auth.resetPassword.submit,
        processingText: t.value.auth.resetPassword.processing,
        showEmail: true,
        showPassword: false,
        showConfirmPassword: false,
      };
    case "update-password":
    default:
      return {
        title: t.value.auth.updatePassword.title,
        buttonText: t.value.auth.updatePassword.submit,
        processingText: t.value.auth.updatePassword.processing,
        showEmail: false,
        showPassword: true,
        showConfirmPassword: true,
      };
  }
});

// Mark as hydrated for E2E stability (Astro islands can be visible before listeners are attached)
onMounted(() => {
  hydrated.value = true;
});
</script>

<template>
  <div class="mx-auto w-full max-w-md" data-testid="auth-form" :data-hydrated="hydrated ? 'true' : 'false'">
    <div class="bg-card space-y-6 rounded-lg border p-6 shadow-lg sm:p-8">
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl" data-testid="auth-form-heading">
          {{ config.title }}
        </h1>
        <p v-if="mode === 'reset-password'" class="text-muted-foreground text-sm">
          {{ t.auth.resetPassword.description }}
        </p>
        <p v-if="mode === 'update-password'" class="text-muted-foreground text-sm">
          {{ t.auth.updatePassword.description }}
        </p>
      </div>

      <form class="space-y-4" @submit="handleSubmit">
        <!-- Email field -->
        <div v-if="config.showEmail" class="space-y-2">
          <Label for="email">{{ t.auth.login.email }}</Label>
          <Input
            id="email"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            placeholder="twoj@email.com"
            :disabled="isSubmitting"
            :aria-invalid="!!errors.email"
            :data-testid="`${mode}-email-input`"
          />
          <p v-if="errors.email" class="text-destructive text-xs">{{ errors.email }}</p>
        </div>

        <!-- Password field -->
        <div v-if="config.showPassword" class="space-y-2">
          <div class="flex items-center justify-between">
            <Label for="password">{{ t.auth.login.password }}</Label>
            <a
              v-if="mode === 'login'"
              href="/reset-password"
              class="text-primary text-xs hover:underline"
              data-testid="auth-reset-password-link"
            >
              {{ t.auth.login.forgotPassword }}
            </a>
          </div>
          <Input
            id="password"
            v-model="password"
            v-bind="passwordAttrs"
            type="password"
            placeholder="••••••••"
            :disabled="isSubmitting"
            :aria-invalid="!!errors.password"
            :data-testid="`${mode}-password-input`"
          />
          <p v-if="errors.password" class="text-destructive text-xs">{{ errors.password }}</p>
        </div>

        <!-- Confirm Password field -->
        <div v-if="config.showConfirmPassword" class="space-y-2">
          <Label for="confirmPassword">{{ t.auth.register.confirmPassword }}</Label>
          <Input
            id="confirmPassword"
            v-model="confirmPassword"
            v-bind="confirmPasswordAttrs"
            type="password"
            placeholder="••••••••"
            :disabled="isSubmitting"
            :aria-invalid="!!errors.confirmPassword"
            :data-testid="`${mode}-confirm-password-input`"
          />
          <p v-if="errors.confirmPassword" class="text-destructive text-xs">{{ errors.confirmPassword }}</p>
        </div>

        <!-- API Error -->
        <div
          v-if="apiError"
          class="text-destructive bg-destructive/10 border-destructive/20 rounded-md border p-3 text-sm"
          data-testid="auth-form-error"
        >
          {{ apiError }}
        </div>

        <!-- Submit button -->
        <Button type="submit" :disabled="isSubmitting" class="w-full" size="lg" :data-testid="`${mode}-submit-button`">
          {{ isSubmitting ? config.processingText : config.buttonText }}
        </Button>
      </form>

      <!-- Additional links -->
      <div class="space-y-2 text-center">
        <p v-if="mode === 'login'" class="text-muted-foreground text-sm">
          {{ t.auth.login.noAccount }}
          <a href="/register" class="text-primary font-medium hover:underline" data-testid="auth-register-link">
            {{ t.auth.login.registerLink }}
          </a>
        </p>
        <p v-if="mode === 'register'" class="text-muted-foreground text-sm">
          {{ t.auth.register.hasAccount }}
          <a href="/login" class="text-primary font-medium hover:underline" data-testid="auth-login-link">
            {{ t.auth.register.loginLink }}
          </a>
        </p>
        <p v-if="mode === 'reset-password'" class="text-muted-foreground text-sm">
          {{ t.auth.resetPassword.rememberPassword }}
          <a href="/login" class="text-primary font-medium hover:underline" data-testid="auth-login-link">
            {{ t.auth.resetPassword.loginLink }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
