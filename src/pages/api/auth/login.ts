import type { APIRoute } from 'astro'

import { loginSchema } from '@/lib/validation/auth.schemas'

/**
 * POST /api/auth/login
 *
 * Authenticates user with email and password.
 * Sets session cookies on successful authentication.
 *
 * Request body: { email: string, password: string }
 * Response: { user: User } | { error: { message: string } }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()

    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: validation.error.errors[0]?.message || 'Nieprawidłowe dane',
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { email, password } = validation.data
    const supabase = locals.supabase

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: { message: 'Błąd serwera - brak klienta Supabase' },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Nieprawidłowy e-mail lub hasło',
          },
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: { message: 'Nie udało się zalogować' },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Login error:', error)

    return new Response(
      JSON.stringify({
        error: { message: 'Wystąpił błąd serwera' },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const prerender = false
