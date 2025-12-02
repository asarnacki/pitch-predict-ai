import type { APIRoute } from "astro";

import { updatePasswordRequestSchema } from "@/lib/validation/auth.schemas";
import { logError } from "@/lib/logger";

/**
 * POST /api/auth/update-password
 *
 * Updates user's password after password reset flow.
 * Requires active session (established via reset link).
 *
 * Request body: { password: string }
 * Response: { message: string } | { error: { message: string } }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    const validation = updatePasswordRequestSchema.safeParse(body);

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

    const { password } = validation.data;
    const supabase = locals.supabase;
    const user = locals.user;

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

    if (!user) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Sesja wygasła. Proszę ponownie zainicjować proces resetowania hasła.",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      logError("Update password error", { error });

      if (error.message.includes("session")) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Sesja wygasła. Proszę ponownie zainicjować proces resetowania hasła.",
            },
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("password")) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Hasło nie spełnia wymagań bezpieczeństwa",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            message: "Wystąpił błąd podczas zmiany hasła",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Hasło zostało zmienione pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logError("Update password error", { error });

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
