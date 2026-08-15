import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { INITIAL_PROVIDERS } from '@/lib/mockData';
import { deduplicateAndMergeProviders, matchesSearchQuery } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const sb = getServerSupabase();
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('query') || searchParams.get('search') || searchParams.get('q') || '';

  const filterByQuery = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    return list
      .map((p) => {
        const matchProv = matchesSearchQuery(searchQuery, [p.name, p.slug, p.description, p.website]);
        const matchedModels = (p.models || []).filter((m: any) =>
          matchesSearchQuery(searchQuery, [m.name, m.model_api_id, m.category, p.name, p.slug])
        );
        if (matchProv) return p;
        if (matchedModels.length > 0) return { ...p, models: matchedModels };
        return null;
      })
      .filter(Boolean);
  };

  const freeOnlyProviders = deduplicateAndMergeProviders(
    INITIAL_PROVIDERS.filter((p) => {
      const freeModels = (p.models || []).filter((m) => m.is_free);
      return p.is_free && freeModels.length > 0;
    }).map((p) => ({
      ...p,
      models: p.models.filter((m) => m.is_free),
    }))
  );

  if (!sb) {
    return NextResponse.json({
      source: 'initial_data',
      supabase_connected: false,
      providers: filterByQuery(freeOnlyProviders),
    });
  }

  try {
    const [{ data: providers, error: e1 }, { data: models, error: e2 }] = await Promise.all([
      sb.from('providers').select('*').eq('status', 'active').eq('is_free', true).order('name'),
      sb.from('models').select('*').eq('status', 'active').eq('is_free', true).order('context_window', { ascending: false }),
    ]);

    if (e1 || e2 || !providers || providers.length === 0) {
      return NextResponse.json({
        source: 'initial_data_fallback',
        supabase_connected: true,
        error: e1?.message || e2?.message,
        providers: filterByQuery(freeOnlyProviders),
      });
    }

    const modelsByProvider = new Map<string, any[]>();
    for (const m of models || []) {
      const list = modelsByProvider.get(m.provider_id) || [];
      list.push(m);
      modelsByProvider.set(m.provider_id, list);
    }

    const combined = providers
      .map((p) => ({
        ...p,
        models: modelsByProvider.get(p.id) || [],
      }))
      .filter((p) => p.models.length > 0);

    const consolidated = deduplicateAndMergeProviders(combined);

    return NextResponse.json({
      source: 'supabase_database',
      supabase_connected: true,
      providers: filterByQuery(consolidated),
    });
  } catch (error: any) {
    return NextResponse.json({
      source: 'initial_data_error',
      supabase_connected: true,
      error: error?.message,
      providers: filterByQuery(freeOnlyProviders),
    });
  }
}
