import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseConfig } from "../config/supabase";

export const supabaseClient = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.anonKey
);
