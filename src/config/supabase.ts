// Konfiguracja Supabase dla klienta
export const supabaseConfig = {
  url: import.meta.env.SUPABASE_URL || "http://127.0.0.1:54321",
  anonKey:
    import.meta.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
};
