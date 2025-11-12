import type { APIRoute } from 'astro'

/**
 * POST /api/auth/logout
 *
 * Logs out the current user and clears session cookies.
 *
 * Request body: none
 * Response: { message: string } | { error: { message: string } }
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
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

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return new Response(
        JSON.stringify({
          error: { message: 'Wystąpił błąd podczas wylogowywania' },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Wylogowano pomyślnie',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Logout error:', error)

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
