import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
  );
}

/**
 * Server-side Supabase client using the service-role key.
 *
 * This bypasses Row Level Security and must NEVER be exposed to the browser.
 * Used exclusively in server-side code (Telegram bot handlers, API routes).
 */
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Disable session persistence — this is a server-side service client.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
