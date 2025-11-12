import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

// Import shared validation schemas
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ResetPasswordFormData,
  type UpdatePasswordFormData,
} from '@/lib/validation/auth.schemas'

export type AuthFormMode = 'login' | 'register' | 'reset-password' | 'update-password'

interface UseAuthFormReturn<T> {
  form: ReturnType<typeof useForm<T>>
  isSubmitting: boolean
  apiError: string | null
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
}

type AuthFormData = LoginFormData | RegisterFormData | ResetPasswordFormData | UpdatePasswordFormData

// Function overloads for type safety
export function useAuthForm(options: { mode: 'login'; onSuccess?: () => void }): UseAuthFormReturn<LoginFormData>
export function useAuthForm(options: { mode: 'register'; onSuccess?: () => void }): UseAuthFormReturn<RegisterFormData>
export function useAuthForm(options: { mode: 'reset-password'; onSuccess?: () => void }): UseAuthFormReturn<ResetPasswordFormData>
export function useAuthForm(options: { mode: 'update-password'; onSuccess?: () => void }): UseAuthFormReturn<UpdatePasswordFormData>

// Implementation
export function useAuthForm({ mode, onSuccess }: { mode: AuthFormMode; onSuccess?: () => void }): UseAuthFormReturn<AuthFormData> {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Get resolver based on mode
  const getResolver = () => {
    switch (mode) {
      case 'login':
        return zodResolver(loginSchema)
      case 'register':
        return zodResolver(registerSchema)
      case 'reset-password':
        return zodResolver(resetPasswordSchema)
      case 'update-password':
        return zodResolver(updatePasswordSchema)
      default:
        return zodResolver(loginSchema)
    }
  }

  // Initialize form
  const form = useForm({
    resolver: getResolver(),
    mode: 'onBlur',
  })

  // Get API endpoint based on mode
  const getEndpoint = () => {
    switch (mode) {
      case 'login':
        return '/api/auth/login'
      case 'register':
        return '/api/auth/register'
      case 'reset-password':
        return '/api/auth/reset-password'
      case 'update-password':
        return '/api/auth/update-password'
      default:
        return '/api/auth/login'
    }
  }

  // Submit handler
  const handleSubmit = useCallback(
    async (data: AuthFormData) => {
      setIsSubmitting(true)
      setApiError(null)

      try {
        const endpoint = getEndpoint()

        // Prepare request data - exclude confirmPassword for register and update-password modes
        let requestData: Partial<AuthFormData>

        if ('confirmPassword' in data) {
          const { confirmPassword, ...rest } = data
          requestData = rest
        } else {
          requestData = data
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        })

        const result = await response.json()

        if (!response.ok) {
          // Handle API errors
          const errorMessage = result.error?.message || 'Wystąpił błąd. Spróbuj ponownie.'
          setApiError(errorMessage)
          toast.error(errorMessage)
          return
        }

        // Success handling based on mode
        switch (mode) {
          case 'login':
          case 'register':
            toast.success(
              mode === 'login'
                ? 'Zalogowano pomyślnie!'
                : 'Rejestracja zakończona pomyślnie!'
            )
            // Redirect to home page
            window.location.href = '/'
            break

          case 'reset-password':
            toast.success('Link do resetowania hasła został wysłany na e-mail')
            if (onSuccess) onSuccess()
            break

          case 'update-password':
            toast.success('Hasło zostało zmienione pomyślnie!')
            // Redirect to login page
            window.location.href = '/login'
            break
        }
      } catch (error) {
        const errorMessage = 'Wystąpił błąd połączenia. Sprawdź połączenie internetowe.'
        setApiError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    },
    [mode, onSuccess]
  )

  return {
    form,
    isSubmitting,
    apiError,
    handleSubmit: form.handleSubmit(handleSubmit),
  }
}
