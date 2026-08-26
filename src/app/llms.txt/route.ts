import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_PROVIDERS } from '@/lib/mockData';

export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.SUPABASE_PROJECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const providersList = INITIAL_PROVIDERS;
  
  if (url && key && !url.includes('your-supabase-project')) {
    try {
      const sb = createClient(url, key);
      const { data: dbProviders } = await sb.from('providers').select('name,slug,website,description').eq('status','active').order('name');
      const { data: dbModels } = await sb.from('models').select('name,provider_id,context_window,is_free,external_url').eq('status','active').order('context_window',{ascending:false});

      if (dbProviders && dbProviders.length > 0) {
        const lines = [
          '# ZeroLLM - Free LLM Providers & Models',
          '',
          '## Providers',
          ...(dbProviders.map(p => `- [${p.name}](${p.website || '#'}) (${p.slug}) - ${p.description?.slice(0,120) || ''}`)),
          '',
          '## Models',
          ...(dbModels?.map(m => `- ${m.name} (ctx: ${m.context_window || 'N/A'}, free: ${m.is_free ? 'yes' : 'no'}) - ${m.external_url || ''}`) || []),
        ];
        return new NextResponse(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    } catch {
      // Fallback to initial providers
    }
  }

  const lines = [
    '# ZeroLLM - Free LLM Providers & Models Directory',
    '',
    '## Providers',
    ...providersList.map(p => `- [${p.name}](${p.website}) (${p.slug}) - ${p.description}`),
    '',
    '## Key Free Models',
    ...providersList.flatMap(p => p.models.map(m => `- ${m.name} [Provider: ${p.name}] (ctx: ${m.context_window || 'N/A'}, free: yes)`)),
  ];

  return new NextResponse(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
