/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare/client" />

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: User;
      runtime?: {
        env: {
          SUPABASE_URL: string;
          SUPABASE_KEY: string;
          OPENROUTER_API_KEY?: string;
          FOOTBALL_DATA_API_KEY?: string;
        };
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly FOOTBALL_DATA_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
