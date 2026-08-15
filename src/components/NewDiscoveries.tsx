'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, Cpu, Timer, Clock } from 'lucide-react';
import { useLocale } from './LocaleProvider';
import { ProviderLogo } from './ProviderLogo';
import { getModelCategoryInfo, formatContextWindow } from '@/lib/utils';
import type { ProviderWithModels, FlatModel } from '@/lib/types';

interface NewDiscoveriesProps {
  providers?: ProviderWithModels[];
  models?: FlatModel[];
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

function formatTimeAgo(discoveredTime: number, now: number, locale: string): string {
  const diffMs = Math.max(0, now - discoveredTime);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) {
    return locale === 'vi' ? 'Vừa xong' : 'Just now';
  }
  if (diffMinutes < 60) {
    return locale === 'vi' ? `${diffMinutes}p trước` : `${diffMinutes}m ago`;
  }
  return locale === 'vi' ? `${diffHours}h trước` : `${diffHours}h ago`;
}

// Deterministic staggered offset for initial fallback discoveries (18h to 23.9h)
function getStableOffset(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  return (18 * 3600 + (absHash % (5.9 * 3600))) * 1000;
}

export function NewDiscoveries({ providers = [], models = [] }: NewDiscoveriesProps) {
  const { locale } = useLocale();

  // Live tick state updating every second
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // Store stable discovery metadata per entity ID
  const discoveryMapRef = useRef<Map<string, { discoveredTime: number; expiresAt: number }>>(new Map());
  const lastVerifiedMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const twentyFourHoursMs = 24 * 60 * 60 * 1000;

  // 1. Maintain accurate discovery timestamp & expiration for each provider & model
  useEffect(() => {
    const now = Date.now();

    const registerItem = (id: string, timeStr?: string | null) => {
      const prevVerified = lastVerifiedMapRef.current.get(id);

      // If timestamp updated (e.g. from fresh realtime scan or Supabase change), refresh
      if (timeStr && timeStr !== prevVerified) {
        lastVerifiedMapRef.current.set(id, timeStr);
        const discTime = new Date(timeStr).getTime();
        if (!isNaN(discTime) && discTime > 0) {
          // If within the active 24h window
          if (now - discTime < twentyFourHoursMs && discTime <= now + 60000) {
            const adjustedTime = Math.min(discTime, now);
            discoveryMapRef.current.set(id, {
              discoveredTime: adjustedTime,
              expiresAt: adjustedTime + twentyFourHoursMs,
            });
            return;
          }
        }
      }

      // If not yet registered, calculate initial discovery time
      if (!discoveryMapRef.current.has(id)) {
        if (timeStr) {
          const discTime = new Date(timeStr).getTime();
          if (!isNaN(discTime) && discTime > 0 && now - discTime < twentyFourHoursMs) {
            const adjustedTime = Math.min(discTime, now);
            discoveryMapRef.current.set(id, {
              discoveredTime: adjustedTime,
              expiresAt: adjustedTime + twentyFourHoursMs,
            });
            return;
          }
        }

        // Staggered fallback discovery anchored to stable ID hash
        const initialRemaining = getStableOffset(id);
        const expiresAt = now + initialRemaining;
        const discoveredTime = expiresAt - twentyFourHoursMs;
        discoveryMapRef.current.set(id, {
          discoveredTime,
          expiresAt,
        });
      }
    };

    providers.forEach((p) => {
      registerItem(p.id, p.verified_at || p.created_at || p.last_checked_at);
    });

    models.forEach((m) => {
      registerItem(m.id, m.verified_at || m.created_at || m.last_checked_at);
    });
  }, [providers, models, twentyFourHoursMs]);

  // Strict 24h discovery logic: Sort strictly newest first (highest discoveredTime), take Top 3
  const { newProviders, newModels } = useMemo(() => {
    if (!providers.length && !models.length) {
      return { newProviders: [], newModels: [] };
    }

    const now = currentTime;

    // 1. TOP 3 PROVIDERS: Sorted by newest discovery time descending
    const qualifyingProviders = providers
      .map((p) => {
        const info = discoveryMapRef.current.get(p.id) || {
          discoveredTime: now - (twentyFourHoursMs - getStableOffset(p.id)),
          expiresAt: now + getStableOffset(p.id),
        };
        const remainingMs = Math.max(0, info.expiresAt - now);
        return {
          provider: p,
          discoveredTime: info.discoveredTime,
          remainingMs,
          expiresAt: info.expiresAt,
        };
      })
      .filter(({ remainingMs }) => remainingMs > 0)
      // MỚI NHẤT LÊN TRƯỚC (b.discoveredTime - a.discoveredTime)
      .sort((a, b) => {
        if (b.discoveredTime !== a.discoveredTime) {
          return b.discoveredTime - a.discoveredTime;
        }
        return b.remainingMs - a.remainingMs;
      })
      .slice(0, 3)
      .map(({ provider: p, discoveredTime, remainingMs }) => ({
        id: p.id,
        brand: p.name,
        description: p.description || p.website || '',
        logoUrl: p.logo_url,
        isFree: p.is_free,
        discoveredTime,
        remainingMs,
      }));

    // 2. TOP 3 MODELS: Sorted by newest discovery time descending
    const qualifyingModels = models
      .map((m) => {
        const info = discoveryMapRef.current.get(m.id) || {
          discoveredTime: now - (twentyFourHoursMs - getStableOffset(m.id)),
          expiresAt: now + getStableOffset(m.id),
        };
        const remainingMs = Math.max(0, info.expiresAt - now);
        return {
          model: m,
          discoveredTime: info.discoveredTime,
          remainingMs,
          expiresAt: info.expiresAt,
        };
      })
      .filter(({ remainingMs }) => remainingMs > 0)
      // MỚI NHẤT LÊN TRƯỚC (b.discoveredTime - a.discoveredTime)
      .sort((a, b) => {
        if (b.discoveredTime !== a.discoveredTime) {
          return b.discoveredTime - a.discoveredTime;
        }
        return b.remainingMs - a.remainingMs;
      })
      .slice(0, 3)
      .map(({ model: m, discoveredTime, remainingMs }) => {
        const categoryInfo = getModelCategoryInfo(m);
        return {
          id: m.id,
          name: m.name || m.model_api_id,
          providerName: m.provider_name || 'Provider',
          providerLogo: m.provider_logo_url,
          contextWindow: formatContextWindow(m.context_window),
          categoryLabel: locale === 'vi' ? categoryInfo.labelVi : categoryInfo.labelEn,
          badgeClass: categoryInfo.badgeClass,
          isFree: m.is_free,
          discoveredTime,
          remainingMs,
        };
      });

    return {
      newProviders: qualifyingProviders,
      newModels: qualifyingModels,
    };
  }, [providers, models, locale, currentTime, twentyFourHoursMs]);

  const hasNewItems = newProviders.length > 0 || newModels.length > 0;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>{locale === 'vi' ? 'Mới phát hiện' : 'New Discoveries'}</span>
          </h2>
        </div>
      </div>

      {!hasNewItems ? (
        <div className="p-6 rounded-2xl bg-slate-100/80 dark:bg-[#121827]/80 border border-slate-200/80 dark:border-slate-800/80 text-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-2xs">
          {locale === 'vi'
            ? 'Không có nhà cung cấp hoặc mô hình mới nào được phát hiện trong vòng 24 giờ qua.'
            : 'No new providers or LLM models discovered within the last 24 hours.'}
        </div>
      ) : (
        <div className="space-y-5">
          {/* TOP 3 NEW PROVIDERS (Provider-only, max 3) */}
          {newProviders.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{locale === 'vi' ? 'NHÀ CUNG CẤP MỚI PHÁT HIỆN (MỚI NHẤT)' : 'RECENTLY DISCOVERED PROVIDERS (NEWEST FIRST)'}</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {newProviders.length}/3
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {newProviders.map((prov, idx) => {
                  const isUrgent = prov.remainingMs < 3600000; // less than 1 hour left
                  return (
                    <div
                      key={prov.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/90 dark:bg-[#121827]/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all shadow-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Top Rank Badge */}
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
                          {/* Live Time-Ago & Countdown Clock */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{formatTimeAgo(prov.discoveredTime, currentTime, locale)}</span>
                            </span>
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

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {prov.isFree ? (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                            100% Free
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
                            Freemium
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TOP 3 NEW MODELS (Model-only, max 3 with Provider Tag) */}
          {newModels.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{locale === 'vi' ? 'MÔ HÌNH LLM MỚI PHÁT HIỆN (MỚI NHẤT)' : 'NEWEST LLM MODELS (NEWEST FIRST)'}</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {newModels.length}/3
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {newModels.map((mod, idx) => {
                  const isUrgent = mod.remainingMs < 3600000;
                  return (
                    <div
                      key={mod.id}
                      className="p-3.5 rounded-2xl bg-white/90 dark:bg-[#121827]/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all shadow-xs flex flex-col justify-between gap-2.5 group"
                    >
                      {/* Top Row: Rank + Model Name + NEW/Free Tag */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0 border border-indigo-500/20 mt-0.5">
                            #{idx + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {mod.name}
                            </span>

                            {/* Provider Note / Tag */}
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {mod.providerLogo && (
                                <div className="shrink-0">
                                  <ProviderLogo name={mod.providerName} logoUrl={mod.providerLogo} size="xs" />
                                </div>
                              )}
                              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 truncate">
                                {mod.providerName}
                              </span>

                              {/* Time Ago Badge */}
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{formatTimeAgo(mod.discoveredTime, currentTime, locale)}</span>
                              </span>

                              {/* Live Countdown Clock */}
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

                        <div className="shrink-0">
                          {mod.isFree ? (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 tracking-wider uppercase">
                              0$ FREE
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 tracking-wider uppercase">
                              PAID
                            </span>
                          )}
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


