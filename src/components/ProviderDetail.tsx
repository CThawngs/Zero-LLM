'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ProviderWithModels, FlatModel } from '@/lib/types';
import { ProviderLogo } from './ProviderLogo';
import { StatCard } from './StatCard';
import { ModelTable } from './ModelTable';
import { ModelSearchBox, ModelFilterState } from './ModelSearchBox';
import { ChartsSection } from './charts/Charts';
import { ApiKeyGuideModal } from './ApiKeyGuideModal';
import { useLocale } from './LocaleProvider';
import { subscribeToProvidersAndModels } from '@/lib/realtime';
import { formatContextWindow, formatModelDisplayName } from '@/lib/utils';
import { ArrowLeft, ExternalLink, Key, Globe, Sparkles, X } from 'lucide-react';
import { trackPageView, trackCtaClick } from '@/lib/track';

interface ProviderDetailProps {
  provider: ProviderWithModels;
  onClose?: () => void;
}

export function ProviderDetail({ provider: initialProvider, onClose }: ProviderDetailProps) {
  const { t, locale } = useLocale();
  const [provider, setProvider] = useState<ProviderWithModels>(initialProvider);
  const [showKeyGuide, setShowKeyGuide] = useState(false);
  const [modelFilter, setModelFilter] = useState<ModelFilterState>({
    search: '',
    category: null,
    is_free: null,
    multimodal: null,
    sortBy: 'context_desc',
  });

  useEffect(() => {
    trackPageView();
    const handle = subscribeToProvidersAndModels({
      onChange: () => {},
    });
    return () => handle?.stop();
  }, []);

  const flatModels: FlatModel[] = provider.models.map((m) => ({
    id: m.id,
    provider_id: provider.id,
    provider_name: provider.name,
    provider_slug: provider.slug,
    provider_logo_url: provider.logo_url,
    provider_is_free: provider.is_free,
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
  }));

  const filteredModels = flatModels
    .filter((m) => {
      if (modelFilter.search) {
        const q = modelFilter.search.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.model_api_id.toLowerCase().includes(q)) return false;
      }
      if (modelFilter.category && m.category !== modelFilter.category) return false;
      if (modelFilter.is_free === true && !m.is_free) return false;
      if (modelFilter.multimodal === true && !m.multimodal) return false;
      return true;
    })
    .sort((a, b) => {
      if (modelFilter.sortBy === 'context_desc') return (b.context_window || 0) - (a.context_window || 0);
      if (modelFilter.sortBy === 'context_asc') return (a.context_window || 0) - (b.context_window || 0);
      if (modelFilter.sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

  const categories = Array.from(new Set(flatModels.map((m) => m.category || 'General LLM')));

  const totalModels = provider.models.length;
  const freeModels = provider.models.filter((m) => m.is_free).length;
  const maxContext = provider.models.length > 0
    ? Math.max(...provider.models.map((m) => m.context_window || 0))
    : 0;
  const avgContext = provider.models.length > 0
    ? Math.round(
        provider.models.reduce((sum, m) => sum + (m.context_window || 0), 0) / provider.models.length
      )
    : 0;

  const content = (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Bar with Back/Close button */}
      <div className="flex items-center justify-between gap-3">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{locale === 'vi' ? 'ĐÓNG CHI TIẾT' : 'CLOSE DETAIL'}</span>
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{locale === 'vi' ? 'VỀ TRANG CHỦ' : 'BACK TO DIRECTORY'}</span>
          </Link>
        )}
      </div>

      {/* Hero section */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-6 md:p-8 shadow-sm space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="flex items-start sm:items-center gap-3 sm:gap-5 w-full md:w-auto">
            <ProviderLogo name={provider.name} logoUrl={provider.logo_url} size="md" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 break-words leading-tight">
                {provider.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {provider.is_free ? t('provider.free') : t('provider.freemium')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  STATUS: {provider.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            {provider.signup_url && (
              <button
                onClick={() => {
                  setShowKeyGuide(true);
                  trackCtaClick(`key_guide_${provider.slug}`);
                }}
                className="cursor-pointer w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 active:scale-95"
              >
                <Key className="w-4 h-4 shrink-0" />
                <span>{t('provider.apiKeyGuide')}</span>
              </button>
            )}

            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-2 active:scale-95"
              >
                <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t('provider.website')}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </a>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl border-t border-slate-200 dark:border-slate-800 pt-4 sm:pt-6 font-medium">
          {provider.description ||
            'High-throughput LLM API provider delivering serverless inference for developers.'}
        </p>
      </div>

      {/* Stats row - 2 cols on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          indexNumber="01"
          label={t('stats.totalModels')}
          value={totalModels}
          sublabel="Available Endpoints"
          highlightColor="#F59E0B"
        />
        <StatCard
          indexNumber="02"
          label={t('stats.freeModels')}
          value={freeModels}
          sublabel="Zero-Cost Endpoints"
          highlightColor="#10B981"
        />
        <StatCard
          indexNumber="03"
          label={t('stats.contextMax')}
          value={formatContextWindow(maxContext)}
          sublabel="Largest Context"
          highlightColor="#3B82F6"
        />
        <StatCard
          indexNumber="04"
          label={t('charts.avgContext')}
          value={formatContextWindow(avgContext)}
          sublabel="Average Capacity"
          highlightColor="#8B5CF6"
        />
      </div>

      {/* Search and Model Table */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          {locale === 'vi' ? 'DANH SÁCH MODEL LLM' : 'OFFERED LLM MODELS'} ({filteredModels.length})
        </h2>
        <ModelSearchBox filter={modelFilter} onChange={setModelFilter} categories={categories} />
        <ModelTable models={filteredModels} showProviderColumn={false} />
      </div>

      {/* Charts */}
      {flatModels.length > 0 && <ChartsSection models={flatModels} />}

      {showKeyGuide && (
        <ApiKeyGuideModal provider={provider} onClose={() => setShowKeyGuide(false)} />
      )}
    </div>
  );

  if (onClose) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto cursor-pointer"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#0B0E17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-full max-w-5xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 relative shadow-2xl cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Floating X close button at top-right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="cursor-pointer absolute top-3 right-3 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 transition-colors z-20 shadow-xs"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {content}
        </div>
      </div>
    );
  }

  return content;
}
