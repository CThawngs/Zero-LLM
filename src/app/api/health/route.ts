import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabaseStatus = 'unknown';

  if (url && key && !url.includes('your-supabase-project')) {
    try {
      const sb = createClient(url, key);
      const { error } = await sb.from('providers').select('id').limit(1);
      supabaseStatus = error ? 'error' : 'connected';
    } catch {
      supabaseStatus = 'error';
    }
  } else {
    supabaseStatus = 'mock_mode';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: supabaseStatus,
  });
}
