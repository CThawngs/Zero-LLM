import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getServerSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key || url.includes('your-supabase-project')) {
    return null;
  }

  try {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error('Error initializing server Supabase client:', err);
    return null;
  }
}
