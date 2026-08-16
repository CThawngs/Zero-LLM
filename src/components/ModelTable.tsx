'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { FlatModel } from '@/lib/types';
import { useLocale } from './LocaleProvider';
import { formatContextWindow, getModelCategoryInfo } from '@/lib/utils';
import { ExternalLink, Sparkles } from 'lucide-react';
import { ProviderLogo } from './ProviderLogo';
import { CopyModelButton } from './CopyModelButton';

interface ModelTableProps {
  models: FlatModel[];
  showProviderColumn?: boolean;
}

export function ModelTable({ models, showProviderColumn = true }: ModelTableProps) {
  const { t, locale } = useLocale();
  const [displayLimit, setDisplayLimit] = useState(15);

  if (models.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center text-slate-500 dark:text-slate-400 font-semibold text-xs sm:text-sm">
        {t('modelSearch.no_models')}
      </div>
    );
  }

  const visibleModels = models.slice(0, displayLimit);
  const remainingCount = models.length - visibleModels.length;

  return (
    <div className="space-y-4">
      {/* MOBILE CARDS VIEW (< md) */}
      <div className="md:hidden space-y-2.5">
        {visibleModels.map((m) => {
          const categoryInfo = getModelCategoryInfo(m);
          const modelName = m.name || m.model_api_id;
          const copyValue = m.model_api_id || m.name;

          return (
            <div
              key={m.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 space-y-2.5 shadow-2xs"
            >
              {/* Header: 1 Single Model Name + Copy Button + Tier */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 break-words leading-tight">
                      {modelName}
                    </span>
                    <CopyModelButton textToCopy={copyValue} />
                  </div>
                  {showProviderColumn && m.provider_name && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <ProviderLogo name={m.provider_name} logoUrl={m.provider_logo_url} size="sm" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {m.provider_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category & Action Link */}
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryInfo.badgeClass}`}>
                  {locale === 'vi' ? categoryInfo.labelVi : categoryInfo.labelEn}
                </span>

                {m.external_url && (
                  <a
                    href={m.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all inline-flex items-center gap-1 active:scale-95 shrink-0"
                  >
                    <span>{locale === 'vi' ? 'Xem' : 'View'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Context Window Progress Bar */}
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Context Window</span>
                  <span>{formatContextWindow(m.context_window)} tokens</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(10, Math.round(((m.context_window || 8000) / 1000000) * 100))
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW (>= md) */}
      <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-xs font-bold uppercase text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <th className="py-3.5 px-5">{t('table.modelName')}</th>
              {showProviderColumn && <th className="py-3.5 px-5">{t('stats.providers')}</th>}
              <th className="py-3.5 px-5">{t('table.context')}</th>
              <th className="py-3.5 px-5 text-center">{t('table.type')}</th>
              <th className="py-3.5 px-5 text-right">{t('table.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-xs sm:text-sm font-medium">
            {visibleModels.map((m) => {
              const categoryInfo = getModelCategoryInfo(m);
              const modelName = m.name || m.model_api_id;
              const copyValue = m.model_api_id || m.name;

              return (
                <tr key={m.id} className="hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors group">
                  {/* Model Name - 1 single name */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {modelName}
                      </span>
                      <CopyModelButton textToCopy={copyValue} />
                    </div>
                  </td>

                  {/* Provider Column */}
                  {showProviderColumn && (
                    <td className="py-3.5 px-5">
                      <div className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                        <ProviderLogo name={m.provider_name || ''} logoUrl={m.provider_logo_url} size="sm" />
                        <span>{m.provider_name}</span>
                      </div>
                    </td>
                  )}

                  {/* Context Window */}
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/25 text-xs">
                      {formatContextWindow(m.context_window)} tokens
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${categoryInfo.badgeClass}`}>
                      {locale === 'vi' ? categoryInfo.labelVi : categoryInfo.labelEn}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right">
                    {m.external_url ? (
                      <a
                        href={m.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 shadow-2xs inline-flex items-center gap-1.5 active:scale-95"
                        title="External Link"
                      >
                        <span>{locale === 'vi' ? 'Chi tiết' : 'Details'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show More Pagination Button */}
      {remainingCount > 0 && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => prev + 15)}
            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {t('accordion.show_more')} ({remainingCount} {t('accordion.remaining_models')})
            </span>
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {t('accordion.showing_count')} {visibleModels.length} {t('accordion.of_total')} {models.length} {t('accordion.models_label')}
          </p>
        </div>
      )}
    </div>
  );
}

