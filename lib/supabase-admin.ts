import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<any, any, any> | null = null;

// Server-only client using the service role key — bypasses RLS.
// Used by cron jobs and webhooks that need to read/write across all partners.
// Typed <any, any, any> deliberately: without a generated Database type, the
// untyped default schema makes multi-column .select("a, b, c") calls infer
// `never` for row results (next build's type-check fails hard on this, even
// though `next dev` silently ignores it) — <any> avoids that footgun.
export function createAdminClient(): SupabaseClient<any, any, any> {
  if (client) return client;
  client = createSupabaseClient<any, any, any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return client;
}
