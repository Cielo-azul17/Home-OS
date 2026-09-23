/* Paste your project's values here (Supabase dashboard → Project Settings →
   Data API, and → API Keys).

   The anon key is designed to be public — it identifies the project, not the
   user, and every table is protected by the row level security policies in
   supabase/migrations/0001_init.sql. It is safe in the browser bundle. The
   SERVICE ROLE key is the opposite: it bypasses RLS entirely and must never
   appear anywhere in src/.

   While these are blank, HomeOS runs on the in-memory mock data exactly as
   it does today — so the app never breaks just because it isn't wired up
   yet. */

export const SUPABASE_CONFIG = {
  url: '',
  anonKey: '',
};

export const isSupabaseConfigured = (): boolean =>
  !!SUPABASE_CONFIG.url && !!SUPABASE_CONFIG.anonKey;
