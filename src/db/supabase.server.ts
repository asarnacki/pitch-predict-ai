import { createClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types.ts";

/**
 * Creates a Supabase client for server-side usage with cookie-based session management
 *
 * This function should be called per-request to ensure proper session isolation.
 * It integrates with Astro's cookie management for secure, HttpOnly session storage.
 *
 * @param cookies - Astro cookies object from context
 * @returns Configured Supabase client instance
 */
export function createServerClient(cookies: AstroCookies) {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_KEY.");
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key: string) => {
          const cookie = cookies.get(key);
          return cookie?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          cookies.set(key, value, {
            path: "/",
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        },
        removeItem: (key: string) => {
          cookies.delete(key, {
            path: "/",
          });
        },
      },
    },
  });
}
