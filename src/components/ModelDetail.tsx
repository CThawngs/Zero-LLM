'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import type { Model, ProviderWithModels } from '@/lib/types';
import { ProviderLogo } from './ProviderLogo';
import { useLocale } from './LocaleProvider';
import { formatContextWindow, formatNumber, getModelCategoryInfo, formatModelDisplayName } from '@/lib/utils';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { trackPageView } from '@/lib/track';
import { CopyModelButton } from './CopyModelButton';

interface ModelDetailProps {
  model: Model;
  provider: ProviderWithModels | null;
}

export function ModelDetail({ model, provider }: ModelDetailProps) {
  const { t, locale } = useLocale();

  useEffect(() => {
    trackPageView();
  }, []);

  const formattedName = formatModelDisplayName(model.name || model.model_api_id);

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={provider ? `/provider/${provider.slug}` : '/'}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{provider ? `${t('detail.back_provider')} (${provider.name.toUpperCase()})` : t('detail.back')}</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100">
              {formattedName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-sm font-mono text-amber-600 dark:text-amber-400 font-bold border-l-2 border-amber-500 pl-3 py-0.5">
                API ID: {model.model_api_id}
              </div>
              <CopyModelButton textToCopy={model.model_api_id} />
            </div>
          </div>

          {model.external_url && (
            <a
              href={model.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <span>{t('detail.access_api')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Specifications grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t('detail.context_window')}
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {formatContextWindow(model.context_window)}
            </div>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {formatNumber(model.context_window)} tokens
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t('detail.cost_tier')}
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {model.is_free ? t('detail.free_100') : t('detail.paid')}
            </div>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Zero input/output fee
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t('detail.multimodal_support')}
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {model.multimodal ? t('detail.yes') : t('detail.text_only')}
            </div>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {model.multimodal ? 'Vision & Image Input' : 'Standard Text Prompting'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-5 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t('detail.category')}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 truncate">
              {(() => {
                const info = getModelCategoryInfo(model);
                return locale === 'vi' ? info.labelVi : info.labelEn;
              })()}
            </div>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">Classification</p>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {t('detail.rate_limits')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs font-bold">
            <div>
              <span className="text-slate-500 dark:text-slate-400">{t('detail.rpm')}: </span>
              <span className="text-slate-900 dark:text-slate-100">{model.rate_limit_per_minute || t('detail.unlimited')}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">{t('detail.rpd')}: </span>
              <span className="text-slate-900 dark:text-slate-100">{model.rate_limit_per_day || t('detail.unlimited')}</span>
            </div>
          </div>
        </div>

        {/* Provider details */}
        {provider && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProviderLogo name={provider.name} logoUrl={provider.logo_url} size="md" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {t('detail.hosted_by')}
                </div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{provider.name}</div>
              </div>
            </div>
            <Link
              href={`/provider/${provider.slug}`}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:underline bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              {t('detail.view_provider')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
