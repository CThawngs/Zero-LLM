'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
  Layers,
  ChevronsUpDown,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import type { ProviderWithModels } from '@/lib/types';
import { formatContextWindow, getModelCategoryInfo } from '@/lib/utils';
import { CopyModelButton } from './CopyModelButton';
import { ProviderDetail } from './ProviderDetail';
import { ProviderLogo } from './ProviderLogo';
import { Combobox, ComboboxOption } from './Combobox';
import { useLocale } from './LocaleProvider';

interface ProviderAccordionTableProps {
  providers: ProviderWithModels[];
}

export function ProviderAccordionTable({ providers }: ProviderAccordionTableProps) {
  const { locale } = useLocale();

  // Expanded providers state: initialize with all provider IDs open
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    providers.forEach((p) => {
      initial[p.id] = true;
    });
    return initial;
  });

  const [sortOption, setSortOption] = useState<string>('models_free');
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithModels | null>(null);

  // State to track expanded models (>15) per provider
  const [showAllModelsMap, setShowAllModelsMap] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedProviders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const areAllExpanded = useMemo(() => {
    if (providers.length === 0) return false;
    return providers.every((p) => expandedProviders[p.id] !== false);
  }, [providers, expandedProviders]);

  const toggleExpandAll = () => {
    const nextState = !areAllExpanded;
    const updated: Record<string, boolean> = {};
    providers.forEach((p) => {
      updated[p.id] = nextState;
    });
    setExpandedProviders(updated);
  };

  // Combobox options for sorting
  const sortComboboxOptions: ComboboxOption[] = [
    {
      value: 'models_free',
      label: locale === 'vi' ? 'Số model Free (Nhiều nhất)' : 'Most Free Models',
      description: locale === 'vi' ? 'Ưu tiên provider có nhiều mô hình 0đ nhất' : 'Prioritize providers with most 0$ models',
      badge: 'TOP FREE',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    },
    {
      value: 'total_models',
      label: locale === 'vi' ? 'Tổng số model (Nhiều nhất)' : 'Total Models (Most)',
      description: locale === 'vi' ? 'Sắp xếp theo tổng số lượng mô hình' : 'Sort by total count of models',
    },
    {
      value: 'name_asc',
      label: locale === 'vi' ? 'Tên Provider (A-Z)' : 'Provider Name (A-Z)',
      description: locale === 'vi' ? 'Sắp xếp theo bảng chữ cái A đến Z' : 'Sort alphabetically A to Z',
    },
  ];

  // Sort providers based on selection
  const sortedProviders = useMemo(() => {
    return [...providers].sort((a, b) => {
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'total_models') {
        return (b.models?.length || 0) - (a.models?.length || 0);
      }
      // Default: Sort by number of free models
      const freeCountA = (a.models || []).filter((m) => m.is_free).length;
      const freeCountB = (b.models || []).filter((m) => m.is_free).length;
      if (freeCountB !== freeCountA) {
        return freeCountB - freeCountA;
      }
      return (b.models?.length || 0) - (a.models?.length || 0);
    });
  }, [providers, sortOption]);

  if (providers.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121827] p-8 sm:p-12 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
          {locale === 'vi' ? 'Không tìm thấy Provider nào phù hợp' : 'No matching providers found'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {locale === 'vi'
            ? 'Vui lòng thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc bên trên.'
            : 'Try adjusting your search query or clearing some of the filters above.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0F172A]/70 shadow-sm overflow-hidden transition-colors">
        {/* Table Header Bar */}
        <div className="px-3.5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>{locale === 'vi' ? 'Danh Sách Provider & Model LLM' : 'Providers & LLM Models Directory'}</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
              {providers.length} Providers
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Quick Toggle All Expand/Collapse */}
            <button
              type="button"
              onClick={toggleExpandAll}
              className="cursor-pointer text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 shadow-2xs active:scale-95"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {areAllExpanded
                  ? (locale === 'vi' ? 'Thu gọn tất cả' : 'Collapse all')
                  : (locale === 'vi' ? 'Mở rộng tất cả' : 'Expand all')}
              </span>
            </button>

            {/* Sort Combobox */}
            <div className="flex items-center gap-1.5">
              <Combobox
                options={sortComboboxOptions}
                value={sortOption}
                onChange={setSortOption}
                icon={<ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />}
                searchable={false}
                className="w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Column Labels (for Desktop Table View) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2.5 bg-slate-100/50 dark:bg-slate-900/40 border-b border-slate-200/70 dark:border-slate-800/60 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-5">{locale === 'vi' ? 'Tên Mô Hình & API ID' : 'Model Name & API Identifier'}</div>
          <div className="col-span-2 text-center">{locale === 'vi' ? 'Phân Loại' : 'Category / Type'}</div>
          <div className="col-span-3">Context Window</div>
          <div className="col-span-2 text-right">{locale === 'vi' ? 'Chi Tiết' : 'Action'}</div>
        </div>

        {/* Provider Accordion Groups */}
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
          {sortedProviders.map((prov) => {
            const isExpanded = expandedProviders[prov.id] ?? true;
            const provModels = prov.models || [];
            const freeModelCount = provModels.filter((m) => m.is_free).length;

            // Maximum 15 models display logic per provider
            const isShowAll = showAllModelsMap[prov.id] ?? false;
            const displayedModels = isShowAll ? provModels : provModels.slice(0, 15);
            const remainingCount = provModels.length - 15;

            return (
              <div key={prov.id} className="transition-colors">
                {/* Provider Accordion Header (Parent Item) */}
                <div
                  onClick={() => toggleExpand(prov.id)}
                  className="p-3.5 sm:px-6 sm:py-4 bg-slate-50/90 dark:bg-slate-900/60 hover:bg-slate-100/90 dark:hover:bg-slate-800/60 cursor-pointer transition-colors border-b border-slate-200/60 dark:border-slate-800/40 select-none group"
                >
                  {/* MOBILE VIEW FOR PARENT ITEM (< sm) */}
                  <div className="sm:hidden space-y-2.5">
                    {/* Top Row: Chevron + Logo + Name + Pricing Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          aria-label="Toggle provider"
                          className="p-1 rounded-lg text-slate-400 group-hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-amber-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        <div className="shrink-0">
                          <ProviderLogo name={prov.name} logoUrl={prov.logo_url} size="sm" />
                        </div>

                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors truncate">
                          {prov.name}
                        </span>
                      </div>

                      <div className="shrink-0" />
                    </div>

                    {/* Bottom Row: Stats & Status Badge on Left + Actions on Right */}
                    <div
                      className="flex items-center justify-between gap-2 pl-8 pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Stats & Status Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {prov.status === 'active' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        )}

                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                          <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{provModels.length}</strong> models
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(prov.website || prov.signup_url) && (
                          <a
                            href={prov.signup_url || prov.website || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-amber-500 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                            title={locale === 'vi' ? 'Trang chủ nhà cung cấp' : 'Visit Provider Website'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedProvider(prov)}
                          className="cursor-pointer text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all shadow-2xs active:scale-95"
                        >
                          {locale === 'vi' ? 'Chi tiết' : 'Details'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP VIEW FOR PARENT ITEM (>= sm) */}
                  <div className="hidden sm:flex items-center justify-between gap-3">
                    {/* Left: Expand Icon + Logo + Provider Name + Badges */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        aria-label="Toggle provider"
                        className="p-1 rounded-lg text-slate-400 group-hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-amber-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <div className="shrink-0">
                        <ProviderLogo name={prov.name} logoUrl={prov.logo_url} size="sm" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors truncate">
                            {prov.name}
                          </span>

                          {prov.status === 'active' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Model counts + External Link + Action */}
                    <div
                      className="flex items-center gap-3 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{provModels.length}</span> models
                      </div>

                      {(prov.website || prov.signup_url) && (
                        <a
                          href={prov.signup_url || prov.website || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-amber-500 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
                          title={locale === 'vi' ? 'Trang chủ nhà cung cấp' : 'Visit Provider Website'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedProvider(prov)}
                        className="cursor-pointer text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all shadow-2xs active:scale-95 shrink-0"
                      >
                        {locale === 'vi' ? 'Chi tiết' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Models List (Child Items) */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/40 bg-white/60 dark:bg-[#0B0E17]/40">
                    {displayedModels.map((mod) => {
                      const categoryInfo = getModelCategoryInfo(mod);
                      const modelName = mod.name || mod.model_api_id;
                      const copyValue = mod.model_api_id || mod.name;

                      return (
                        <div
                          key={mod.id}
                          className="p-3.5 sm:px-6 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors"
                        >
                          {/* MOBILE CARD VIEW (< md): 1 SINGLE MODEL NAME + CONTEXT WINDOW PROGRESS BAR */}
                          <div className="md:hidden space-y-2.5">
                            {/* Row 1: Single Model Name + Copy Button */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 break-words leading-tight">
                                  {modelName}
                                </span>
                                <CopyModelButton textToCopy={copyValue} />
                              </div>
                            </div>

                            {/* Row 2: Category Badge + Detail Link */}
                            <div className="flex items-center justify-between gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryInfo.badgeClass}`}>
                                {locale === 'vi' ? categoryInfo.labelVi : categoryInfo.labelEn}
                              </span>

                              <a
                                href={mod.external_url || prov.signup_url || prov.website || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all inline-flex items-center gap-1 active:scale-95"
                              >
                                <span>{locale === 'vi' ? 'Xem' : 'View'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {/* Row 3: Context Window Progress Bar (PRESERVED & BEAUTIFIED) */}
                            <div className="space-y-1 pt-0.5">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                <span className="text-[10px] uppercase font-semibold text-slate-400">Context Window</span>
                                <span>{formatContextWindow(mod.context_window)} tokens</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(10, Math.round(((mod.context_window || 8000) / 1000000) * 100))
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* DESKTOP ROW VIEW (>= md): 1 SINGLE MODEL NAME + CONTEXT WINDOW PROGRESS BAR */}
                          <div className="hidden md:grid grid-cols-12 gap-4 items-center text-xs">
                            {/* COLUMN 1: Single Model Name & Copy Button */}
                            <div className="col-span-5 pr-2 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug break-words">
                                  {modelName}
                                </span>
                                <CopyModelButton textToCopy={copyValue} />
                              </div>
                            </div>

                            {/* COLUMN 2: Category Badge */}
                            <div className="col-span-2 flex items-center justify-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${categoryInfo.badgeClass}`}>
                                {locale === 'vi' ? categoryInfo.labelVi : categoryInfo.labelEn}
                              </span>
                            </div>

                            {/* COLUMN 3: Context Window with Progress bar */}
                            <div className="col-span-3 space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span>{formatContextWindow(mod.context_window)} tokens</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {mod.context_window ? `${Math.round(mod.context_window / 1000)}k` : 'Standard'}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(10, Math.round(((mod.context_window || 8000) / 1000000) * 100))
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* COLUMN 4: External Action Button */}
                            <div className="col-span-2 flex items-center justify-end">
                              <a
                                href={mod.external_url || prov.signup_url || prov.website || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all inline-flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
                              >
                                <span>{locale === 'vi' ? 'Chi tiết' : 'Details'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Toggle Button for Provider with > 15 Models */}
                    {provModels.length > 15 && (
                      <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-200/60 dark:border-slate-800/40 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setShowAllModelsMap((prev) => ({
                              ...prev,
                              [prov.id]: !isShowAll,
                            }))
                          }
                          className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {isShowAll ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              <span>
                                {locale === 'vi'
                                  ? `Thu gọn bớt model (hiển thị 15/${provModels.length})`
                                  : `Collapse models (showing 15/${provModels.length})`}
                              </span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span>
                                {locale === 'vi'
                                  ? `Hiển thị thêm toàn bộ model LLM (${remainingCount})`
                                  : `Show all LLM models (${remainingCount} more)`}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedProvider && (
        <ProviderDetail provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
      )}
    </>
  );
}



