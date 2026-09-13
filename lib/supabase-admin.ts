import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createSupabaseClient> | null = null;

// Server-only client using the service role key — bypasses RLS.
// Used by cron jobs and webhooks that need to read/write across all partners.
export function createAdminClient() {
  if (client) return client;
  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return client;
}
