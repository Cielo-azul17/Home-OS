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
  url: 'https://oeivesochocygygfxrsi.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9laXZlc29jaG9jeWd5Z2Z4cnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODQzMDcsImV4cCI6MjEwNTc2MDMwN30.2fwAabLnXy77cHJiLS_Od6nyYIFv2hJd9nUSeZpXWA4',
};

export const isSupabaseConfigured = (): boolean =>
  !!SUPABASE_CONFIG.url && !!SUPABASE_CONFIG.anonKey;
