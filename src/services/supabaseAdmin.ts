import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client for server-side operations.
 * This client uses the SERVICE_ROLE_KEY and BYPASSES Row Level Security.
 * ONLY use this in server.ts or backend-only logic.
 */
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase Admin credentials missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
