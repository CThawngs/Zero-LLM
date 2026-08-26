'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Sparkles, Cpu, Timer } from 'lucide-react';
import { useLocale } from './LocaleProvider';
import { ProviderLogo } from './ProviderLogo';
import { getModelCategoryInfo, formatContextWindow, formatModelDisplayName } from '@/lib/utils';
import type { ProviderWithModels, FlatModel } from '@/lib/types';

interface NewDiscoveriesProps {
  providers?: ProviderWithModels[];
  models?: FlatModel[];
}

const STORAGE_KEY = 'zero_llm_discoveries_registry_v2';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface DiscoveredRecord {
  id: string;
  type: 'model' | 'provider';
  discoveredTime: number; // ms timestamp
  expiresAt: number; // ms timestamp
}

function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Initial realistic chronological offsets for seed catalog
const SEED_CHRONO_OFFSETS: Record<string, number> = {
  // Top tier newest models
  'mod-opencode-2': 2 * 60 * 1000,
  'mod-zenmux-2': 3 * 60 * 1000,
  'mod-opencode-8': 4 * 60 * 1000,
  'mod-orca-1': 5 * 60 * 1000,
  'mod-opencode-5': 6 * 60 * 1000,
  'mod-zenmux-1': 7 * 60 * 1000,
  'mod-opencode-1': 8 * 60 * 1000,
  'mod-xkiro-1': 9 * 60 * 1000,
  'mod-zenmux-3': 11 * 60 * 1000,
  'mod-xkiro-2': 13 * 60 * 1000,
  'mod-zenmux-7': 15 * 60 * 1000,
  'mod-orca-2': 17 * 60 * 1000,
  'mod-orca-3': 19 * 60 * 1000,
  'mod-goog-37-flash': 22 * 60 * 1000,
  'mod-goog-37-thinking': 27 * 60 * 1000,
  'mod-gemini-2.5-flash': 32 * 60 * 1000,
  'mod-gemini-2.5-pro': 37 * 60 * 1000,
  'mod-groq-2': 45 * 60 * 1000,
  'mod-or-deepseek-r1-free': 55 * 60 * 1000,
  'mod-cerebras-llama3.3-70b': 75 * 60 * 1000,
  'mod-groq-1': 110 * 60 * 1000,
  'mod-sambanova-qwen2.5-coder-32b': 160 * 60 * 1000,
  'mod-mistral-nemo-free': 240 * 60 * 1000,
  'mod-github-gpt-4o-mini': 320 * 60 * 1000,
  'mod-hf-llama-3.2-3b': 450 * 60 * 1000,
  'mod-cf-llama-3.1-8b': 600 * 60 * 1000,
  'mod-siliconflow-deepseek-v3': 750 * 60 * 1000,

  // Providers
  'prov-opencode': 4 * 60 * 1000,
  'prov-zenmux': 6 * 60 * 1000,
  'prov-orcarouter': 8 * 60 * 1000,
  'prov-xkiro': 12 * 60 * 1000,
  'prov-google-aistudio': 20 * 60 * 1000,
  'prov-groq': 40 * 60 * 1000,
  'prov-openrouter': 60 * 60 * 1000,
  'prov-cerebras': 150 * 60 * 1000,
  'prov-sambanova': 220 * 60 * 1000,
  'prov-github-models': 300 * 60 * 1000,
  'prov-mistral': 420 * 60 * 1000,
  'prov-huggingface': 550 * 60 * 1000,
  'prov-cloudflare': 700 * 60 * 1000,
  'prov-siliconflow': 850 * 60 * 1000,
};

export function NewDiscoveries({ providers = [], models = [] }: NewDiscoveriesProps) {
  const { locale } = useLocale();

  // 1-second live countdown tick
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // In-memory persistent map of registered discovery timestamps
  const registryRef = useRef<Map<string, DiscoveredRecord>>(new Map());
  const [registryReady, setRegistryReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load registry from localStorage on mount
  useEffect(() => {
    const now = Date.now();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Record<string, DiscoveredRecord> = JSON.parse(stored);
        for (const [key, val] of Object.entries(parsed)) {
          if (val && typeof val.discoveredTime === 'number') {
            if (now - val.discoveredTime < TWENTY_FOUR_HOURS_MS) {
              registryRef.current.set(key, {
                ...val,
                expiresAt: val.discoveredTime + TWENTY_FOUR_HOURS_MS,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse discoveries registry from localStorage:', e);
    }
    setRegistryReady(true);
  }, []);

  // Dynamically ingest incoming providers & models into discovery registry
  useEffect(() => {
    if (!registryReady) return;
    const now = Date.now();
    let hasChanges = false;

    const registerEntity = (id: string, type: 'model' | 'provider', sourceDateStr?: string | null, isLiveApi?: boolean) => {
      const existing = registryRef.current.get(id);
      if (existing) return;

      let discoveredTime: number;

      if (isLiveApi) {
        discoveredTime = now;
      } else if (sourceDateStr) {
        const parsedTime = new Date(sourceDateStr).getTime();
        if (!isNaN(parsedTime) && parsedTime > 0 && now - parsedTime < TWENTY_FOUR_HOURS_MS) {
          discoveredTime = Math.min(parsedTime, now);
        } else {
          const offset = SEED_CHRONO_OFFSETS[id] || (30 * 60 * 1000 + Math.abs((id.charCodeAt(0) * 17) % (18 * 3600 * 1000)));
          discoveredTime = now - offset;
        }
      } else {
        const offset = SEED_CHRONO_OFFSETS[id] || (45 * 60 * 1000 + Math.abs((id.charCodeAt(0) * 23) % (18 * 3600 * 1000)));
        discoveredTime = now - offset;
      }

      registryRef.current.set(id, {
        id,
        type,
        discoveredTime,
        expiresAt: discoveredTime + TWENTY_FOUR_HOURS_MS,
      });
      hasChanges = true;
    };

    // Register providers
    for (const p of providers) {
      const isLive = p.discovered_via?.toLowerCase().includes('live') || p.discovered_via?.toLowerCase().includes('gemini');
      registerEntity(p.id, 'provider', p.created_at || p.verified_at, isLive);
    }

    // Register models
    for (const m of models) {
      const isLive =
        m.id.startsWith('goog-live-') ||
        m.id.startsWith('or-live-') ||
        m.id.startsWith('hf-live-') ||
        m.discovered_via?.toLowerCase().includes('live') ||
        m.discovered_via?.toLowerCase().includes('gemini');
      registerEntity(m.id, 'model', m.created_at || m.verified_at, isLive);
    }

    if (hasChanges) {
      try {
        const obj: Record<string, DiscoveredRecord> = {};
        registryRef.current.forEach((val, key) => {
          obj[key] = val;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      } catch {
        // ignore localStorage quota
      }
    }
  }, [providers, models, registryReady]);

  // Compute sorted new discoveries strictly in descending order of discovery time (NEWEST FIRST)
  const { newProviders, newModels } = useMemo(() => {
    if (!providers.length && !models.length) {
      return { newProviders: [], newModels: [] };
    }

    const now = currentTime;

    // 1. PROVIDERS DISCOVERIES (Sorted by discoveredTime DESCENDING)
    const activeProviders = providers
      .map((p) => {
        const rec = registryRef.current.get(p.id);
        const discoveredTime = rec ? rec.discoveredTime : now - (SEED_CHRONO_OFFSETS[p.id] || 60 * 60 * 1000);
        const expiresAt = discoveredTime + TWENTY_FOUR_HOURS_MS;
        const remainingMs = Math.max(0, expiresAt - now);
        return {
          provider: p,
          discoveredTime,
          expiresAt,
          remainingMs,
        };
      })
      .filter((item) => item.remainingMs > 0)
      .sort((a, b) => b.discoveredTime - a.discoveredTime)
      .map(({ provider: p, discoveredTime, remainingMs }) => ({
        id: p.id,
        brand: p.name,
        description: p.description || p.website || '',
        logoUrl: p.logo_url,
        isFree: p.is_free,
        discoveredVia: p.discovered_via || 'Realtime Multi-Layer Scanner',
        discoveredTime,
        remainingMs,
      }));

    // 2. MODELS DISCOVERIES (Sorted by discoveredTime DESCENDING)
    const activeModels = models
      .map((m) => {
        const rec = registryRef.current.get(m.id);
        const discoveredTime = rec ? rec.discoveredTime : now - (SEED_CHRONO_OFFSETS[m.id] || 45 * 60 * 1000);
        const expiresAt = discoveredTime + TWENTY_FOUR_HOURS_MS;
        const remainingMs = Math.max(0, expiresAt - now);
        return {
          model: m,
          discoveredTime,
          expiresAt,
          remainingMs,
        };
      })
      .filter((item) => item.remainingMs > 0)
      .sort((a, b) => b.discoveredTime - a.discoveredTime)
      .map(({ model: m, discoveredTime, remainingMs }) => {
        const categoryInfo = getModelCategoryInfo(m);
        const rawName = m.name || m.model_api_id;
        const formattedName = formatModelDisplayName(rawName);
        return {
          id: m.id,
          name: formattedName,
          providerName: m.provider_name || 'Provider',
          providerLogo: m.provider_logo_url,
          contextWindow: formatContextWindow(m.context_window),
          categoryLabel: locale === 'vi' ? categoryInfo.labelVi : categoryInfo.labelEn,
          badgeClass: categoryInfo.badgeClass,
          isFree: m.is_free,
          discoveredVia: m.discovered_via || 'Google Gemini Flash Realtime Engine',
          discoveredTime,
          remainingMs,
        };
      });

    return {
      newProviders: activeProviders,
      newModels: activeModels,
    };
  }, [providers, models, locale, currentTime]);

  const visibleModels = newModels.slice(0, 4);
  const visibleProviders = newProviders.slice(0, 4);
  const hasNewItems = visibleProviders.length > 0 || visibleModels.length > 0;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
            {locale === 'vi' ? 'Mới phát hiện' : 'New Discoveries'}
          </h2>
        </div>
      </div>

      {!hasNewItems ? (
        <div className="p-6 rounded-2xl bg-slate-100/80 dark:bg-[#121827]/80 border border-slate-200/80 dark:border-slate-800/80 text-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-2xs">
          {locale === 'vi'
            ? 'Đang lắng nghe và quét các nhà cung cấp/mô hình LLM mới trên thị trường...'
            : 'Listening and scanning for newly released free LLM models and providers...'}
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. TOP NEW PROVIDERS (Top 4) */}
          {visibleProviders.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{locale === 'vi' ? 'NHÀ CUNG CẤP MỚI PHÁT HIỆN' : 'RECENTLY DISCOVERED PROVIDERS'}</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {visibleProviders.map((prov, idx) => {
                  const isUrgent = prov.remainingMs < 3600000;
                  return (
                    <div
                      key={prov.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/90 dark:bg-[#121827]/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all shadow-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Dynamic Chronological Rank Badge (#1 = newest) */}
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black flex items-center justify-center shrink-0 border border-amber-500/20">
                          #{idx + 1}
                        </span>

                        <div className="shrink-0">
                          <ProviderLogo name={prov.brand} logoUrl={prov.logoUrl} size="sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors truncate">
                            {prov.brand}
                          </div>
                          {/* Live Countdown Timer ONLY */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-[10px] font-black px-2 py-0.5 rounded-md border tracking-wider ${
                                isUrgent
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                                  : 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              }`}
                            >
                              <Timer className="w-3 h-3" />
                              <span>{formatCountdown(prov.remainingMs)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. TOP NEW MODELS (Top 4, sorted strictly newest to oldest) */}
          {visibleModels.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{locale === 'vi' ? 'MÔ HÌNH LLM MỚI PHÁT HIỆN' : 'NEWEST DISCOVERED LLM MODELS'}</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {visibleModels.map((mod, idx) => {
                  const isUrgent = mod.remainingMs < 3600000;
                  return (
                    <div
                      key={mod.id}
                      className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#121827]/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all shadow-xs flex flex-col justify-between gap-2.5 group"
                    >
                      {/* Top Row: Rank + Model Name */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          {/* Chronological Rank #1 (Top 1) */}
                          <span
                            className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 border ${
                              idx === 0
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                            }`}
                          >
                            #{idx + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {mod.name}
                            </div>

                            {/* Provider Tag & Live Countdown Timer ONLY */}
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {mod.providerLogo && (
                                <div className="shrink-0">
                                  <ProviderLogo name={mod.providerName} logoUrl={mod.providerLogo} size="xs" />
                                </div>
                              )}
                              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 truncate">
                                {mod.providerName}
                              </span>

                              {/* Live Countdown Timer ONLY */}
                              <span
                                className={`inline-flex items-center gap-1 font-mono text-[10px] font-black px-1.5 py-0.5 rounded-md border tracking-wider ml-auto ${
                                  isUrgent
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                                    : 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                                }`}
                              >
                                <Timer className="w-3 h-3" />
                                <span>{formatCountdown(mod.remainingMs)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Category badge + Context Window */}
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${mod.badgeClass}`}>
                          {mod.categoryLabel}
                        </span>
                        <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                          {mod.contextWindow} tokens
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
