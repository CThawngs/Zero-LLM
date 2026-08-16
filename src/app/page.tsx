'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { ProviderWithModels, FlatModel, RealtimeStatus } from '@/lib/types';
import { fetchProvidersWithModels, fetchModelsFlat } from '@/lib/data';
import { subscribeToProvidersAndModels } from '@/lib/realtime';
import { trackPageView, trackCtaClick } from '@/lib/track';
import { Github, ExternalLink, AlertCircle } from 'lucide-react';
import { NewDiscoveries } from '@/components/NewDiscoveries';
import { StatisticsSection } from '@/components/StatisticsSection';
import { ControlsSection, ControlsState } from '@/components/ControlsSection';
import { ProviderAccordionTable } from '@/components/ProviderAccordionTable';
import { useLocale } from '@/components/LocaleProvider';
import { getModelCategoryInfo, matchesSearchQuery } from '@/lib/utils';

export default function HomePage() {
  const { locale } = useLocale();
  const [providers, setProviders] = useState<ProviderWithModels[]>([]);
  const [flatModels, setFlatModels] = useState<FlatModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');

  // Control state matching image filters
  const [controls, setControls] = useState<ControlsState>({
    modelSearch: '',
    modelType: 'all',
    providerSearch: '',
    onlyFree: false,
    largeContextOnly: false,
  });

  const loadData = useCallback(async () => {
    try {
      const [pData, mData] = await Promise.all([
        fetchProvidersWithModels(),
        fetchModelsFlat(),
      ]);
      setProviders(pData);
      setFlatModels(mData);
      
      // Update lastScannedAt from data if not already set
      const latestTimestamp = pData
        .map((p) => p.last_checked_at || p.verified_at)
        .filter(Boolean)
        .sort()
        .pop();
      if (latestTimestamp) {
        setLastScannedAt((prev) => prev || latestTimestamp);
      }
    } catch (e) {
      console.error('Error loading ZeroLLM data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerRealtimeScan = useCallback(async (isManual = false) => {
    setIsScanning(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('/api/scan-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceFresh: isManual }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          if (data.scanned_at) {
            setLastScannedAt(data.scanned_at);
          }
          await loadData();
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Realtime scanner background sync notice:', err?.message || err);
      }
    } finally {
      clearTimeout(timer);
      setIsScanning(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();

    // Trigger an initial background real scan to ensure up-to-date sources and Supabase sync
    triggerRealtimeScan();

    const handle = subscribeToProvidersAndModels({
      onChange: () => {
        loadData();
      },
      onStatus: (status) => {
        setRealtimeStatus(status);
      },
    });

    return () => {
      handle?.stop();
    };
  }, [loadData, triggerRealtimeScan]);

  // Filtered providers based on controls with robust multi-token matching
  const filteredProviders = providers
    .filter((p) => p.models && p.models.length > 0)
    .filter((p) => {
      if (controls.providerSearch) {
        const matchProv = matchesSearchQuery(controls.providerSearch, [p.name, p.slug, p.description, p.website]);
        const matchModel = p.models.some((m) =>
          matchesSearchQuery(controls.providerSearch, [m.name, m.model_api_id, m.category])
        );
        if (!matchProv && !matchModel) return false;
      }
      if (controls.onlyFree && !p.is_free) return false;
      if (controls.largeContextOnly) {
        const maxContext = Math.max(...p.models.map((m) => m.context_window || 0), 0);
        if (maxContext <= 32000) return false;
      }
      return true;
    })
    .map((p) => {
      // Filter internal models of provider
      let filteredModels = p.models;
      if (controls.modelSearch) {
        filteredModels = filteredModels.filter((m) =>
          matchesSearchQuery(controls.modelSearch, [m.name, m.model_api_id, m.category, p.name, p.slug])
        );
      }
      if (controls.modelType && controls.modelType !== 'all') {
        filteredModels = filteredModels.filter((m) => {
          const info = getModelCategoryInfo(m);
          return info.key.toLowerCase() === controls.modelType.toLowerCase();
        });
      }
      return {
        ...p,
        models: filteredModels,
      };
    })
    .filter((p) => p.models.length > 0);

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* SECTION 1: HERO TITLE & SUBTITLE */}
      <section className="text-center space-y-3 sm:space-y-4 pt-4 pb-1 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          {locale === 'vi'
            ? 'Tổng hợp các Provider có Free LLM Model — Cập nhật Realtime'
            : 'Free LLM Providers Directory — Realtime'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
          {locale === 'vi'
            ? 'Thư viện tổng hợp toàn bộ các nhà cung cấp (Providers) có mô hình AI/LLM miễn phí trên thị trường. Dữ liệu được quét và cập nhật liên tục theo thời gian thực từ model Google Gemini mới nhất (Gemini-3.7-Flash).'
            : 'Comprehensive directory aggregating AI providers that offer free LLM models on the market, continuously indexed and updated in real-time by Google\'s latest Gemini Flash model (Gemini-3.7-Flash).'}
        </p>

        {/* AI DISCLAIMER / SCAN NOTICE (Directly grouped with Hero description) */}
        <div className="flex justify-center items-center pt-1 sm:pt-2 px-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 dark:bg-amber-400/10 dark:border-amber-400/25 shadow-xs max-w-full text-center leading-normal">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="break-words">
              {locale === 'vi'
                ? 'Lưu ý: Gemini AI có thể mắc sai lầm khi tìm kiếm/quét trên Internet.'
                : 'Note: Gemini AI may make mistakes when searching/scanning the Internet.'}
            </span>
          </div>
        </div>
      </section>

      {/* GITHUB REPO CALL-TO-ACTION BUTTON (CENTERED, THEME-ADAPTIVE & SMOOTH ANIMATION) */}
      <div className="flex justify-center items-center pt-2 sm:pt-3 pb-2 sm:pb-3">
        <a
          id="github-repo-button"
          href="https://github.com/CThawngs/Zero-LLM"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCtaClick('github_repo')}
          className="group inline-flex items-center gap-3 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-white text-slate-800 border border-slate-200/90 shadow-sm dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700/80 font-bold text-xs sm:text-sm tracking-wide hover:shadow-md hover:border-amber-500/50 dark:hover:border-amber-400/50 hover:bg-slate-50 dark:hover:bg-slate-850 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer"
        >
          {/* GitHub Logo / Avatar */}
          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 text-slate-900 dark:text-slate-100">
            <Github className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">
            {locale === 'vi' ? 'Xem kho mã nguồn trên GitHub' : 'View Repository on GitHub'}
          </span>
          <span className="hidden sm:inline-flex items-center font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 border border-amber-500/20 dark:border-amber-400/20 group-hover:border-amber-500/40 transition-colors">
            CThawngs/Zero-LLM
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0" />
        </a>
      </div>

      {/* SECTION 2: ⚡ MỚI PHÁT HIỆN (WITHIN 24H) */}
      <NewDiscoveries providers={providers} models={flatModels} />

      {/* SECTION 3: STATISTICS DASHBOARD */}
      <StatisticsSection
        models={flatModels}
        providers={providers}
        lastScannedAt={lastScannedAt}
        onTriggerScan={triggerRealtimeScan}
        isScanning={isScanning}
      />

      {/* SECTION 4: CONTROLS & SEARCH BAR */}
      <ControlsSection
        controls={controls}
        onChange={setControls}
        availableProviders={providers.map((p) => ({
          name: p.name,
          slug: p.slug,
          modelsCount: p.models ? p.models.length : 0,
        }))}
        availableModels={flatModels.map((m) => ({
          name: m.name,
          apiId: m.model_api_id,
          providerName: m.provider_name || '',
          isFree: m.is_free,
        }))}
      />

      {/* SECTION 5: ACCORDION PROVIDERS & MODELS TABLE */}
      <section className="space-y-4">
        <ProviderAccordionTable providers={filteredProviders} />
      </section>
    </div>
  );
}
