/**
 * Supabase client — the single place that creates and exports the client.
 * Every other file that needs Supabase imports from here.
 *
 * Environment variables (set in .env.local, never committed to git):
 *   VITE_SUPABASE_URL      — project URL, e.g. https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY — public anon key (safe to ship in browser code)
 *
 * IMPORTANT: Never use the service-role / secret key here. The anon key is the
 * correct credential for all browser-side calls. Row Level Security (RLS) on
 * Supabase enforces access control server-side.
 */
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Environment-variable validation
// Vite exposes VITE_* vars via import.meta.env at build time.
// We fail loudly at startup so a misconfigured deploy is obvious immediately.
// ---------------------------------------------------------------------------
const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

if (!supabaseUrl || supabaseUrl.trim() === "") {
  throw new Error(
    "[CampusBid] VITE_SUPABASE_URL is missing or empty.\n" +
      "Add it to your .env.local file:\n" +
      "  VITE_SUPABASE_URL=https://<project-ref>.supabase.co",
  );
}

if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
  throw new Error(
    "[CampusBid] VITE_SUPABASE_ANON_KEY is missing or empty.\n" +
      "Add it to your .env.local file:\n" +
      "  VITE_SUPABASE_ANON_KEY=<your-anon-key>",
  );
}

// ---------------------------------------------------------------------------
// Database type stub
// Replace the `Database` generic with the generated types from
// `npx supabase gen types typescript` once the schema is created.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any;

// ---------------------------------------------------------------------------
// Singleton client — imported everywhere that needs Supabase.
// ---------------------------------------------------------------------------
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the session in localStorage so the user stays logged in across
    // page refreshes without a round-trip to the server.
    persistSession: true,
    autoRefreshToken: true,
  },
});
