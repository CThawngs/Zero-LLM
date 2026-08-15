'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { ProviderWithModels, FlatModel, RealtimeStatus } from '@/lib/types';
import { fetchProvidersWithModels, fetchModelsFlat } from '@/lib/data';
import { subscribeToProvidersAndModels } from '@/lib/realtime';
import { trackPageView } from '@/lib/track';
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

  const triggerRealtimeScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceFresh: true }),
      });
      const data = await res.json();
      if (data?.success) {
        if (data.scanned_at) {
          setLastScannedAt(data.scanned_at);
        }
        await loadData();
      }
    } catch (err) {
      console.error('Realtime scanner error:', err);
    } finally {
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
      <section className="text-center space-y-3 py-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          {locale === 'vi'
            ? 'Bảng xếp hạng LLM Provider miễn phí — realtime'
            : 'Free LLM Provider Leaderboard — Realtime'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
          {locale === 'vi'
            ? 'Theo dõi, so sánh và khám phá các nhà cung cấp mô hình ngôn ngữ lớn miễn phí tốt nhất hiện nay. Cập nhật liên tục từ cộng đồng.'
            : 'Track, compare, and discover the best zero-cost Large Language Model providers available today. Continuously updated by the community.'}
        </p>
      </section>

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
