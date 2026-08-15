'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Sparkles } from 'lucide-react';
import { useLocale } from './LocaleProvider';

export interface ModelFilterState {
  search: string;
  category: string | null;
  is_free: boolean | null;
  multimodal: boolean | null;
  sortBy: 'context_desc' | 'context_asc' | 'name_asc' | 'popularity_desc';
}

interface ModelSearchBoxProps {
  filter: ModelFilterState;
  onChange: (newFilter: ModelFilterState) => void;
  categories: string[];
}

export function ModelSearchBox({ filter, onChange, categories }: ModelSearchBoxProps) {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState(filter.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filter.search) {
        onChange({ ...filter, search: searchTerm });
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm, filter, onChange]);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm space-y-4 backdrop-blur-md stitch-glass-card">
      <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center">
        {/* Model Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('modelSearch.placeholder')}
            suppressHydrationWarning
            className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-10 py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                onChange({ ...filter, search: '' });
              }}
              type="button"
              suppressHydrationWarning
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-56">
          <select
            value={filter.category || ''}
            onChange={(e) => onChange({ ...filter, category: e.target.value || null })}
            suppressHydrationWarning
            className="cursor-pointer w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
          >
            <option value="">{t('modelSearch.all_categories')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Model */}
        <div className="w-full lg:w-60">
          <select
            value={filter.sortBy}
            onChange={(e) => onChange({ ...filter, sortBy: e.target.value as ModelFilterState['sortBy'] })}
            suppressHydrationWarning
            className="cursor-pointer w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
          >
            <option value="context_desc">{t('modelSearch.sort_context_desc')}</option>
            <option value="context_asc">{t('modelSearch.sort_context_asc')}</option>
            <option value="name_asc">{t('modelSearch.sort_name_asc')}</option>
            <option value="popularity_desc">{t('modelSearch.sort_popularity_desc')}</option>
          </select>
        </div>
      </div>

      {/* Checkbox Toggles & Category Quick Pills */}
      <div className="flex items-center flex-wrap gap-3 pt-3 font-semibold text-xs border-t border-slate-200 dark:border-slate-800">
        <label className="flex items-center gap-2 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            checked={filter.is_free === true}
            onChange={(e) =>
              onChange({
                ...filter,
                is_free: e.target.checked ? true : null,
              })
            }
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
          <span className="font-bold text-slate-800 dark:text-slate-200">{t('modelSearch.free_only')}</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            checked={filter.multimodal === true}
            onChange={(e) =>
              onChange({
                ...filter,
                multimodal: e.target.checked ? true : null,
              })
            }
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
          <span className="font-bold text-slate-800 dark:text-slate-200">{t('modelSearch.multimodal_only')}</span>
        </label>
      </div>
    </div>
  );
}
