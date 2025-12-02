import type { APIRoute } from "astro";

import { resetPasswordSchema } from "@/lib/validation/auth.schemas";
import { logError } from "@/lib/logger";

/**
 * POST /api/auth/reset-password
 *
 * Initiates password reset flow by sending email with reset link.
 * Always returns success to prevent email enumeration.
 *
 * Request body: { email: string }
 * Response: { message: string }
 */
export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json();

    const validation = resetPasswordSchema.safeParse(body);

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

    const { email } = validation.data;
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

    const redirectTo = `${url.origin}/update-password`;

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    return new Response(
      JSON.stringify({
        message: "Jeśli konto z tym adresem e-mail istnieje, wysłaliśmy link do resetowania hasła.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logError("Reset password error", { error });

    // Still return success to prevent information leakage
    return new Response(
      JSON.stringify({
        message: "Jeśli konto z tym adresem e-mail istnieje, wysłaliśmy link do resetowania hasła.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const prerender = false;
