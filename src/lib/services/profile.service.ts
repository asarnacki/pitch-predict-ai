/**
 * Profile Service
 *
 * Handles business logic for user profiles.
 * Provides functions to interact with the profiles table.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { ProfileDTO } from "@/types";

/**
 * Get user profile by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns ProfileDTO if found, null if not found
 * @throws Error if database query fails
 */
export async function getProfile(supabase: SupabaseClient<Database>, userId: string): Promise<ProfileDTO | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data as ProfileDTO;
}
