import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export const supabaseClient = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY
);
