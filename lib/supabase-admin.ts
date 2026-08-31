import "server-only";
import type { Database } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Service-role client for the admin panel — bypasses RLS entirely, so every
// admin read/write uses THIS client, never the anon `supabase` export from
// lib/supabase.ts (admin needs to see inactive/draft products too, which the
// anon client's RLS policies deliberately filter out).
//
// Formalizes the pattern already used ad-hoc in scripts/import-shopify.mjs
// and scripts/migrate-images-to-storage.mjs into one typed, reusable module.
// `server-only` turns "imported this into a Client Component by mistake"
// into a build error instead of leaking the service-role key to the browser.
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
