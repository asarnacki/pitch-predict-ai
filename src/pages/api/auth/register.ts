import type { APIRoute } from "astro";

import { registerRequestSchema } from "@/lib/validation/auth.schemas";
import { logError } from "@/lib/logger";

/**
 * POST /api/auth/register
 *
 * Registers a new user with email and password.
 * Auto-confirms email and logs in the user automatically.
 *
 * Request body: { email: string, password: string }
 * Response: { user: User } | { error: { message: string } }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    const validation = registerRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: validation.error.errors[0]?.message || "Nieprawidłowe dane",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validation.data;
    const supabase = locals.supabase;

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: { message: "Błąd serwera - brak klienta Supabase" },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            error: { message: "Użytkownik o tym adresie e-mail już istnieje" },
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            message: error.message || "Wystąpił błąd podczas rejestracji",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: { message: "Nie udało się utworzyć konta użytkownika" },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
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
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logError("Register error", { error });

    return new Response(
      JSON.stringify({
        error: { message: "Wystąpił błąd serwera" },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const prerender = false;
