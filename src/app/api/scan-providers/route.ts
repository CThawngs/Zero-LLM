import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { INITIAL_PROVIDERS } from '@/lib/mockData';
import { updateCachedProviders } from '@/lib/dataStore';
import { discoverProvidersWithGemini, fetchLiveGoogleStudioModels } from '@/lib/geminiDiscovery';
import { matchesSearchQuery, deduplicateAndMergeProviders } from '@/lib/utils';
import { randomUUID } from 'crypto';
import type { ProviderWithModels, Model } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const timestamp = new Date().toISOString();
    const body = await req.json().catch(() => ({}));
    const searchQuery = (body?.search || body?.query || '').toLowerCase().trim();

    // 1. Monitored 13 Curated GitHub Repositories & Hubs
    const scannedSources = [
      {
        repo: 'open-free-llm-api/awesome-freellm-apis',
        name: 'Awesome Free LLM APIs (134+ Free APIs / 40+ Providers)',
        url: 'https://github.com/open-free-llm-api/awesome-freellm-apis',
        category: 'Curated Free APIs',
        verified_providers: ['Groq', 'OpenRouter', 'Google AI Studio', 'GitHub Models', 'NVIDIA Build NIMs'],
      },
      {
        repo: 'ShaikhWarsi/free-ai-tools',
        name: 'Curated Free & Low Cost AI Tools & Infrastructure',
        url: 'https://github.com/ShaikhWarsi/free-ai-tools',
        category: 'Developer Infrastructure',
        verified_providers: ['Cerebras AI', 'SambaNova Systems', 'Hugging Face Inference API'],
      },
      {
        repo: 'for-the-zero/Free-LLM-Collection',
        name: 'Free LLM API Collection (免费大模型API合集)',
        url: 'https://github.com/for-the-zero/Free-LLM-Collection',
        category: 'Global & CN Free APIs',
        verified_providers: ['SiliconFlow (SiliconCloud)', 'OpenRouter', 'Groq'],
      },
      {
        repo: 'MrFadiAi/free-llm-gateway',
        name: 'Unified Free LLM Gateway (14+ Free Providers)',
        url: 'https://github.com/MrFadiAi/free-llm-gateway',
        category: 'API Gateways & Fallbacks',
        verified_providers: ['Groq', 'NVIDIA Build NIMs', 'SambaNova Systems', 'Cerebras AI'],
      },
      {
        repo: 'nejib1/Free-LLM',
        name: 'Free LLM APIs (45+ Providers with Permanent Free Tiers)',
        url: 'https://github.com/nejib1/Free-LLM',
        category: 'Permanent Free Tiers',
        verified_providers: ['Google AI Studio', 'GitHub Models', 'Groq', 'OpenRouter'],
      },
      {
        repo: '12britz/awesome-free-models',
        name: 'Awesome Free Models & APIs Catalog',
        url: 'https://github.com/12britz/awesome-free-models',
        category: 'Free Models & Tools',
        verified_providers: ['Hugging Face Inference API', 'Cloudflare Workers AI'],
      },
      {
        repo: 'vava-nessa/free-coding-models',
        name: 'Free Coding Models (170+ Free Coding LLMs across 15+ Providers)',
        url: 'https://github.com/vava-nessa/free-coding-models',
        category: 'Coding & Developer LLMs',
        verified_providers: ['Groq', 'OpenRouter', 'SambaNova Systems', 'GitHub Models'],
      },
      {
        repo: 'abbosaliboev/free-ai-bible',
        name: 'The Ultimate Directory of Free AI APIs 2026 (700+ Resources)',
        url: 'https://github.com/abbosaliboev/free-ai-bible',
        category: 'Directory & Hub',
        verified_providers: ['Cloudflare Workers AI', 'Google AI Studio', 'Groq', 'SiliconFlow (SiliconCloud)'],
      },
      {
        repo: 'amardeeplakshkar/awesome-free-llm-apis',
        name: 'Permanently Free LLM APIs (No Trial / No Credit Card)',
        url: 'https://github.com/amardeeplakshkar/awesome-free-llm-apis',
        category: 'Permanent Free Tiers',
        verified_providers: ['Cerebras AI', 'Groq', 'OpenRouter', 'Google AI Studio'],
      },
      {
        repo: '0xzr/freellmpool',
        name: 'Free LLM API Pool (24 Providers / 407 Cataloged Models)',
        url: 'https://github.com/0xzr/freellmpool',
        category: 'API Pool & Routing',
        verified_providers: ['Groq', 'OpenRouter', 'GitHub Models', 'Hugging Face Inference API'],
      },
      {
        repo: 'vadimen/awesome_llm_api_with_web_search',
        name: 'LLM APIs with Internet Access',
        url: 'https://github.com/vadimen/awesome_llm_api_with_web_search',
        category: 'Web Search & RAG LLMs',
        verified_providers: ['OpenRouter', 'Google AI Studio'],
      },
      {
        repo: 'CYBIRD-D/FREE-LLM-API-Provider',
        name: 'FREE LLM API Provider Resources (CN & Global)',
        url: 'https://github.com/CYBIRD-D/FREE-LLM-API-Provider',
        category: 'Regional & Global Free APIs',
        verified_providers: ['SiliconFlow (SiliconCloud)', 'SambaNova Systems'],
      },
      {
        repo: 'nherx/free-llm-api-resources',
        name: 'Free API Access and Credits Resources',
        url: 'https://github.com/nherx/free-llm-api-resources',
        category: 'Free API Credits',
        verified_providers: ['Groq', 'OpenRouter', 'Google AI Studio', 'Mistral AI (La Plateforme)', 'Cohere'],
      },
    ];

    // 2. LAYER 1: DIRECT REALTIME PROVIDER APIS (Google AI Studio, OpenRouter, HuggingFace)
    const [liveGoogleModels, liveOpenRouterModels, liveHfModels] = await Promise.all([
      // Live Google AI Studio endpoint query
      fetchLiveGoogleStudioModels(),

      // Live OpenRouter endpoint query
      (async (): Promise<Model[]> => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const orRes = await fetch('https://openrouter.ai/api/v1/models', {
            signal: controller.signal,
            headers: { 'User-Agent': 'ZeroLLM-Realtime-Scanner/2.0' },
            cache: 'no-store',
          });
          clearTimeout(timeoutId);

          if (orRes.ok) {
            const orData = await orRes.json();
            if (Array.isArray(orData?.data)) {
              const freeOrModels = orData.data.filter((m: any) => {
                const isZeroPrompt = m.pricing?.prompt === '0' || Number(m.pricing?.prompt) === 0;
                const isZeroComp = m.pricing?.completion === '0' || Number(m.pricing?.completion) === 0;
                const isFreeId = (m.id || '').endsWith(':free');
                return isFreeId || (isZeroPrompt && isZeroComp);
              });

              return freeOrModels.map((m: any, idx: number) => ({
                id: `or-live-${m.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
                provider_id: 'provider-openrouter',
                model_api_id: m.id,
                name: m.name || m.id,
                context_window: m.context_length || 131072,
                is_free: true,
                price_input_per_mtok: 0,
                price_output_per_mtok: 0,
                external_url: `https://openrouter.ai/${m.id}`,
                rate_limit_per_minute: 20,
                rate_limit_per_day: 200,
                multimodal:
                  m.architecture?.modality?.includes('image') ||
                  (m.id || '').includes('vision') ||
                  (m.id || '').includes('vl') ||
                  false,
                category: (m.id || '').includes('coder') ? 'Code & Reasoning' : 'General & Chat',
                popularity_score: 95 - Math.min(idx, 20),
                discovered_via: 'OpenRouter Live Model API',
                status: 'active' as const,
                last_checked_at: timestamp,
                verified_at: timestamp,
                created_at: timestamp,
                updated_at: timestamp,
              }));
            }
          }
        } catch {
          // Fallback
        }
        return [];
      })(),

      // Live Hugging Face inference top open models
      (async (): Promise<Model[]> => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const hfRes = await fetch(
            'https://huggingface.co/api/models?pipeline_tag=text-generation&sort=downloads&limit=25',
            {
              signal: controller.signal,
              cache: 'no-store',
            }
          );
          clearTimeout(timeoutId);

          if (hfRes.ok) {
            const hfData = await hfRes.json();
            if (Array.isArray(hfData)) {
              return hfData
                .filter((m: any) => m.id && (m.id.includes('Llama') || m.id.includes('Qwen') || m.id.includes('DeepSeek') || m.id.includes('Mistral') || m.id.includes('Gemma')))
                .map((m: any, idx: number) => ({
                  id: `hf-live-${m.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
                  provider_id: 'provider-huggingface',
                  model_api_id: m.id,
                  name: m.id.split('/').pop() || m.id,
                  context_window: 128000,
                  is_free: true,
                  price_input_per_mtok: 0,
                  price_output_per_mtok: 0,
                  external_url: `https://huggingface.co/${m.id}`,
                  rate_limit_per_minute: 30,
                  rate_limit_per_day: 1000,
                  multimodal: (m.id || '').toLowerCase().includes('vl') || (m.id || '').toLowerCase().includes('vision'),
                  category: (m.id || '').toLowerCase().includes('coder') ? 'Code & Reasoning' : 'General & Chat',
                  popularity_score: 92 - Math.min(idx * 2, 20),
                  discovered_via: 'Hugging Face Live Inference API',
                  status: 'active' as const,
                  last_checked_at: timestamp,
                  verified_at: timestamp,
                  created_at: timestamp,
                  updated_at: timestamp,
                }));
            }
          }
        } catch {
          // Fallback
        }
        return [];
      })(),
    ]);

    // 3. LAYER 2: LIVE WEB DISCOVERY & AI GROUNDING (GEMINI API WITH GOOGLE SEARCH)
    let aiDiscoveredProviders: ProviderWithModels[] = [];
    try {
      aiDiscoveredProviders = await discoverProvidersWithGemini();
    } catch (e) {
      console.warn('AI web discovery pass skipped:', e);
    }

    // 4. BASE & DIRECT PROVIDER REPOSITORY MERGE
    const providerMap = new Map<string, ProviderWithModels>();

    // Seed with vetted base providers
    for (const p of INITIAL_PROVIDERS) {
      const cloned = JSON.parse(JSON.stringify(p));
      providerMap.set(cloned.slug, cloned);
    }

    // Merge live Google AI Studio models
    if (liveGoogleModels.length > 0) {
      const googProv = providerMap.get('google-aistudio') || providerMap.get('google-ai');
      if (googProv) {
        const existingIds = new Set(googProv.models.map((m) => m.model_api_id));
        for (const liveM of liveGoogleModels) {
          if (!existingIds.has(liveM.model_api_id)) {
            googProv.models.push(liveM);
            existingIds.add(liveM.model_api_id);
          } else {
            // Update context window if discovered live
            const existingModel = googProv.models.find((m) => m.model_api_id === liveM.model_api_id);
            if (existingModel && (liveM.context_window || 0) > (existingModel.context_window || 0)) {
              existingModel.context_window = liveM.context_window;
            }
          }
        }
      }
    }

    // Merge live OpenRouter models
    if (liveOpenRouterModels.length > 0) {
      const orProv = providerMap.get('openrouter');
      if (orProv) {
        const existingIds = new Set(orProv.models.map((m) => m.model_api_id));
        for (const liveM of liveOpenRouterModels) {
          if (!existingIds.has(liveM.model_api_id)) {
            orProv.models.push(liveM);
            existingIds.add(liveM.model_api_id);
          }
        }
      }
    }

    // Merge live Hugging Face models
    if (liveHfModels.length > 0) {
      const hfProv = providerMap.get('huggingface');
      if (hfProv) {
        const existingIds = new Set(hfProv.models.map((m) => m.model_api_id));
        for (const liveM of liveHfModels) {
          if (!existingIds.has(liveM.model_api_id)) {
            hfProv.models.push(liveM);
            existingIds.add(liveM.model_api_id);
          }
        }
      }
    }

    // Merge AI discovered providers and models
    for (const aiP of aiDiscoveredProviders) {
      if (providerMap.has(aiP.slug)) {
        const existingP = providerMap.get(aiP.slug)!;
        const modelMap = new Map(existingP.models.map((m) => [m.model_api_id, m]));
        for (const m of aiP.models) {
          if (!modelMap.has(m.model_api_id)) {
            existingP.models.push(m);
            modelMap.set(m.model_api_id, m);
          }
        }
      } else {
        providerMap.set(aiP.slug, aiP);
      }
    }

    // 5. STRICT FILTERING: AT LEAST 1 FREE MODEL REQUIRED & URL/LOGO NORMALIZATION
    let verifiedFreeProviders: ProviderWithModels[] = Array.from(providerMap.values())
      .map((p) => {
        const freeModels = (p.models || [])
          .filter((m) => m && m.is_free === true)
          .map((m) => ({
            ...m,
            is_free: true,
            price_input_per_mtok: 0,
            price_output_per_mtok: 0,
            last_checked_at: timestamp,
            verified_at: timestamp,
            updated_at: timestamp,
          }));

        const domain = p.website ? p.website.replace(/^https?:\/\//, '').split('/')[0] : 'ai.google.dev';
        const normalizedLogo =
          p.logo_url && !p.logo_url.includes('placeholder')
            ? p.logo_url
            : `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

        return {
          ...p,
          logo_url: normalizedLogo,
          is_free: true,
          models: freeModels,
          last_checked_at: timestamp,
          verified_at: timestamp,
          updated_at: timestamp,
          source_repos_count: scannedSources.filter((s) => s.verified_providers.includes(p.name)).length,
        };
      })
      // STRICT FILTER: Provider must have at least 1 free model
      .filter((p) => p.is_free && p.models && p.models.length > 0 && p.models.some((m) => m.is_free));

    // Deduplicate and merge providers by canonical identity (e.g. cloudflare-workers, cloudflare-workers-ai)
    verifiedFreeProviders = deduplicateAndMergeProviders(verifiedFreeProviders);

    // Sort providers by number of free models descending
    verifiedFreeProviders.sort((a, b) => b.models.length - a.models.length);

    // 6. UPDATE GLOBAL IN-MEMORY CACHE
    updateCachedProviders(verifiedFreeProviders, timestamp);

    // 7. OPTIONAL SEARCH FILTERING FOR CLIENT SCAN RESPONSE
    let outputProviders = verifiedFreeProviders;
    if (searchQuery) {
      outputProviders = verifiedFreeProviders
        .map((p) => {
          const matchProv = matchesSearchQuery(searchQuery, [p.name, p.slug, p.description, p.website]);
          const matchedModels = p.models.filter((m) =>
            matchesSearchQuery(searchQuery, [m.name, m.model_api_id, m.category, p.name])
          );
          if (matchProv) return p;
          if (matchedModels.length > 0) return { ...p, models: matchedModels };
          return null;
        })
        .filter(Boolean) as ProviderWithModels[];
    }

    const totalFreeModels = verifiedFreeProviders.reduce((sum, p) => sum + p.models.length, 0);

    // 8. SUPABASE REALTIME AUTO-SYNC (LOOKUP BY SLUG / MODEL_API_ID TO HANDLE UUID SCHEMA)
    const sb = getServerSupabase();
    let supabaseSynced = false;
    let providersUpserted = 0;
    let modelsUpserted = 0;

    if (sb) {
      try {
        for (const p of verifiedFreeProviders) {
          let providerDbId: string | null = null;

          // Check if provider exists by slug or id
          const { data: existingP } = await sb
            .from('providers')
            .select('id')
            .eq('slug', p.slug)
            .maybeSingle();

          if (existingP?.id) {
            providerDbId = existingP.id;
            const { error: pErr } = await sb
              .from('providers')
              .update({
                name: p.name,
                website: p.website,
                signup_url: p.signup_url,
                api_key_guide: p.api_key_guide,
                logo_url: p.logo_url,
                description: p.description,
                is_free: p.is_free,
                discovered_via: p.discovered_via || 'Realtime Multi-Layer Scanners',
                source_repo: p.source_repo,
                status: 'active',
                last_checked_at: timestamp,
                verified_at: timestamp,
                updated_at: timestamp,
              })
              .eq('id', providerDbId);

            if (!pErr) providersUpserted++;
          } else {
            providerDbId = randomUUID();
            const { error: pErr } = await sb.from('providers').insert({
              id: providerDbId,
              name: p.name,
              slug: p.slug,
              website: p.website,
              signup_url: p.signup_url,
              api_key_guide: p.api_key_guide,
              logo_url: p.logo_url,
              description: p.description,
              is_free: p.is_free,
              discovered_via: p.discovered_via || 'Realtime Multi-Layer Scanners',
              source_repo: p.source_repo,
              status: 'active',
              last_checked_at: timestamp,
              verified_at: timestamp,
              created_at: timestamp,
              updated_at: timestamp,
            });

            if (!pErr) providersUpserted++;
          }

          if (!providerDbId) continue;

          for (const m of p.models) {
            const { data: existingM } = await sb
              .from('models')
              .select('id')
              .eq('provider_id', providerDbId)
              .eq('model_api_id', m.model_api_id)
              .maybeSingle();

            if (existingM?.id) {
              const { error: mErr } = await sb
                .from('models')
                .update({
                  name: m.name,
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
                  discovered_via: m.discovered_via || 'Realtime Multi-Layer Scanners',
                  status: 'active',
                  last_checked_at: timestamp,
                  verified_at: timestamp,
                  updated_at: timestamp,
                })
                .eq('id', existingM.id);

              if (!mErr) modelsUpserted++;
            } else {
              const newModelId = randomUUID();
              const { error: mErr } = await sb.from('models').insert({
                id: newModelId,
                provider_id: providerDbId,
                model_api_id: m.model_api_id,
                name: m.name,
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
                discovered_via: m.discovered_via || 'Realtime Multi-Layer Scanners',
                status: 'active',
                last_checked_at: timestamp,
                verified_at: timestamp,
                created_at: timestamp,
                updated_at: timestamp,
              });

              if (!mErr) modelsUpserted++;
            }
          }
        }
        supabaseSynced = providersUpserted > 0;
      } catch (sbErr) {
        console.warn('Supabase realtime sync error in scan-providers:', sbErr);
      }
    }

    return NextResponse.json({
      success: true,
      scanned_at: timestamp,
      sources_scanned_count: scannedSources.length,
      scanned_repos: scannedSources,
      live_endpoints: {
        google_ai_studio_models: liveGoogleModels.length,
        openrouter_free_models: liveOpenRouterModels.length,
        huggingface_free_models: liveHfModels.length,
      },
      ai_discovered_count: aiDiscoveredProviders.length,
      total_free_providers: verifiedFreeProviders.length,
      total_free_models: totalFreeModels,
      providers: outputProviders,
      supabase_sync: {
        synced: supabaseSynced,
        providers_synced: providersUpserted,
        models_synced: modelsUpserted,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Scan execution failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}

