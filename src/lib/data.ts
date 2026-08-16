import { getBrowserSupabase } from '@/lib/supabase';
import type { ProviderWithModels, FlatModel, FilterState, Model } from '@/lib/types';
import { INITIAL_PROVIDERS } from '@/lib/mockData';
import { getCachedProviders } from '@/lib/dataStore';
import { matchesSearchQuery, deduplicateAndMergeProviders, formatModelDisplayName } from '@/lib/utils';

export async function fetchProvidersWithModels(): Promise<ProviderWithModels[]> {
  const sb = getBrowserSupabase();
  const filterFreeProvidersOnly = (list: ProviderWithModels[]): ProviderWithModels[] => {
    const deduped = deduplicateAndMergeProviders(list);
    return deduped
      .map((p) => ({
        ...p,
        models: (p.models || []).filter((m) => m.is_free),
      }))
      .filter((p) => p.is_free && p.models && p.models.length > 0 && p.models.some((m) => m.is_free));
  };

  const getFallbackProviders = () => {
    try {
      const cached = getCachedProviders();
      if (cached && cached.length > 0) {
        return filterFreeProvidersOnly(cached);
      }
    } catch {
      // ignore
    }
    return filterFreeProvidersOnly(INITIAL_PROVIDERS);
  };

  if (!sb) {
    return getFallbackProviders();
  }

  try {
    const [{ data: providers, error: e1 }, { data: models, error: e2 }] = await Promise.all([
      sb
        .from('providers')
        .select('*')
        .eq('status', 'active')
        .eq('is_free', true)
        .order('name', { ascending: true }),
      sb
        .from('models')
        .select('*')
        .eq('status', 'active')
        .eq('is_free', true)
        .order('context_window', { ascending: false, nullsFirst: false }),
    ]);

    if (e1 || e2 || !providers || providers.length === 0) {
      return getFallbackProviders();
    }

    const modelsByProvider = new Map<string, Model[]>();
    for (const m of models ?? []) {
      const arr = modelsByProvider.get(m.provider_id) ?? [];
      arr.push({
        ...m,
        name: formatModelDisplayName(m.name || m.model_api_id),
      });
      modelsByProvider.set(m.provider_id, arr);
    }

    return filterFreeProvidersOnly(
      providers.map((p) => ({
        ...p,
        models: modelsByProvider.get(p.id) ?? [],
      }))
    );
  } catch (err) {
    console.warn('Supabase fetch failed, fallback to cached providers:', err);
    return getFallbackProviders();
  }
}

export async function fetchModelsFlat(): Promise<FlatModel[]> {
  const sb = getBrowserSupabase();
  
  const getFallbackFlat = () => {
    try {
      const cached = getCachedProviders();
      if (cached && cached.length > 0) {
        return flattenProviders(cached);
      }
    } catch {
      // ignore
    }
    return flattenProviders(INITIAL_PROVIDERS);
  };

  if (!sb) {
    return getFallbackFlat();
  }

  try {
    const { data, error } = await sb
      .from('models')
      .select(`
        id, provider_id, model_api_id, name, context_window, is_free,
        price_input_per_mtok, price_output_per_mtok, external_url,
        rate_limit_per_minute, rate_limit_per_day, multimodal, category,
        popularity_score, status, discovered_via, verified_at, created_at, last_checked_at,
        providers!inner (id, name, slug, logo_url, is_free)
      `)
      .eq('status', 'active')
      .eq('providers.status', 'active')
      .order('context_window', { ascending: false, nullsFirst: false });

    if (error || !data || data.length === 0) {
      return getFallbackFlat();
    }

    return data.map((m: any) => ({
      id: m.id,
      provider_id: m.provider_id,
      provider_name: m.providers.name,
      provider_slug: m.providers.slug,
      provider_logo_url: m.providers.logo_url,
      provider_is_free: m.providers.is_free,
      model_api_id: m.model_api_id,
      name: formatModelDisplayName(m.name || m.model_api_id),
      context_window: m.context_window,
      is_free: m.is_free,
      price_input_per_mtok: m.price_input_per_mtok,
      price_output_per_mtok: m.price_output_per_mtok,
      external_url: m.external_url,
      rate_limit_per_minute: m.rate_limit_per_minute,
      rate_limit_per_day: m.rate_limit_per_day,
      multimodal: m.multimodal,
      category: m.category,
      popularity_score: m.popularity_score,
      status: m.status,
      discovered_via: m.discovered_via,
      verified_at: m.verified_at,
      created_at: m.created_at,
      last_checked_at: m.last_checked_at,
    }));
  } catch (err) {
    return getFallbackFlat();
  }
}

function flattenProviders(providers: ProviderWithModels[]): FlatModel[] {
  const result: FlatModel[] = [];
  for (const p of providers) {
    for (const m of p.models) {
      result.push({
        id: m.id,
        provider_id: p.id,
        provider_name: p.name,
        provider_slug: p.slug,
        provider_logo_url: p.logo_url,
        provider_is_free: p.is_free,
        model_api_id: m.model_api_id,
        name: formatModelDisplayName(m.name || m.model_api_id),
        context_window: m.context_window,
        is_free: m.is_free,
        price_input_per_mtok: m.price_input_per_mtok,
        price_output_per_mtok: m.price_output_per_mtok,
        external_url: m.external_url,
        rate_limit_per_minute: m.rate_limit_per_minute,
        rate_limit_per_day: m.rate_limit_per_day,
        multimodal: m.multimodal,
        category: m.category,
        popularity_score: m.popularity_score,
        status: m.status,
        discovered_via: m.discovered_via,
        verified_at: m.verified_at,
        created_at: m.created_at,
        last_checked_at: m.last_checked_at,
      });
    }
  }
  return result;
}

export async function fetchProviderBySlug(slug: string): Promise<ProviderWithModels | null> {
  const sb = getBrowserSupabase();
  if (!sb) {
    return INITIAL_PROVIDERS.find(p => p.slug === slug) || null;
  }

  try {
    const { data: provider, error: e1 } = await sb
      .from('providers')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (e1 || !provider) {
      return INITIAL_PROVIDERS.find(p => p.slug === slug) || null;
    }

    const { data: models, error: e2 } = await sb
      .from('models')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('status', 'active')
      .order('context_window', { ascending: false, nullsFirst: false });

    if (e2) {
      return { ...provider, models: [] };
    }

    return { ...provider, models: models ?? [] };
  } catch (err) {
    return INITIAL_PROVIDERS.find(p => p.slug === slug) || null;
  }
}

export function filterAndSortModels(flatModels: FlatModel[], filter: FilterState): FlatModel[] {
  let result = [...flatModels];

  if (filter.search) {
    result = result.filter((m) =>
      matchesSearchQuery(filter.search, [m.name, m.provider_name, m.model_api_id, m.category])
    );
  }
  if (filter.provider) {
    result = result.filter(m => m.provider_slug === filter.provider);
  }
  if (filter.is_free !== null) {
    result = result.filter(m => m.is_free === filter.is_free);
  }
  if (filter.category) {
    result = result.filter(m => m.category === filter.category);
  }

  const dir = filter.sort_order === 'asc' ? 1 : -1;
  const keyMap: Record<string, keyof FlatModel> = {
    context_window: 'context_window',
    name: 'name',
    popularity: 'popularity_score',
    price_input: 'price_input_per_mtok',
    price_output: 'price_output_per_mtok',
  };
  const propKey = keyMap[filter.sort_by] || 'context_window';

  result.sort((a, b) => {
    let va: any = a[propKey];
    let vb: any = b[propKey];
    if (va == null && vb == null) return 0;
    if (va == null) return dir;
    if (vb == null) return -dir;
    if (typeof va === 'string') return dir * va.localeCompare(vb);
    return dir * (va - vb);
  });

  return result;
}
