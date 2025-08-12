/// <reference types="astro/client" />
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly DATA_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Dodaj deklarację typu dla locals w Astro
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: Database["auth"]["Tables"]["users"]["Row"] | null;
      session: Session | null;
    }
  }
}
