'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, RotateCcw, SlidersHorizontal, Cpu, Sparkles, Zap, Eye, Layers, X, Filter } from 'lucide-react';
import { Combobox, ComboboxOption } from './Combobox';
import { useLocale } from './LocaleProvider';
import { matchesSearchQuery } from '@/lib/utils';

export interface ControlsState {
  modelSearch: string;
  modelType: 'all' | 'text' | 'vision' | 'reasoning';
  providerSearch: string;
  onlyFree: boolean;
  largeContextOnly: boolean;
}

interface ControlsSectionProps {
  controls: ControlsState;
  onChange: (newControls: ControlsState) => void;
  availableProviders?: { name: string; slug: string; modelsCount: number }[];
  availableModels?: { name: string; apiId: string; providerName: string; isFree: boolean }[];
}

export function ControlsSection({
  controls,
  onChange,
  availableProviders = [],
  availableModels = [],
}: ControlsSectionProps) {
  const { locale } = useLocale();

  // Local state for model search combobox focus
  const [modelSearchOpen, setModelSearchOpen] = useState(false);
  const [providerSearchOpen, setProviderSearchOpen] = useState(false);

  const modelContainerRef = useRef<HTMLDivElement>(null);
  const providerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelContainerRef.current && !modelContainerRef.current.contains(event.target as Node)) {
        setModelSearchOpen(false);
      }
      if (providerContainerRef.current && !providerContainerRef.current.contains(event.target as Node)) {
        setProviderSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    onChange({
      modelSearch: '',
      modelType: 'all',
      providerSearch: '',
      onlyFree: false,
      largeContextOnly: false,
    });
  };

  // Model Type Combobox Options matching the 6 chart categories
  const modelTypeOptions: ComboboxOption[] = [
    {
      value: 'all',
      label: locale === 'vi' ? 'Tất cả loại Model' : 'All Model Types',
      description: locale === 'vi' ? 'Hiển thị tất cả 6 loại mô hình' : 'Display all 6 model classifications',
      icon: <Layers className="w-3.5 h-3.5 text-purple-500" />,
      badge: 'ALL',
      badgeColor: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    },
    {
      value: 'text',
      label: locale === 'vi' ? 'Text (Văn bản)' : 'Text',
      description: locale === 'vi' ? 'Mô hình văn bản thuần túy' : 'Pure text inference models',
      icon: <Cpu className="w-3.5 h-3.5 text-purple-500" />,
      badge: 'TEXT',
      badgeColor: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    },
    {
      value: 'vision',
      label: locale === 'vi' ? 'Vision (Thị giác)' : 'Vision',
      description: locale === 'vi' ? 'Mô hình xử lý thị giác & hình ảnh' : 'Vision and image models',
      icon: <Eye className="w-3.5 h-3.5 text-cyan-500" />,
      badge: 'VISION',
      badgeColor: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
    },
    {
      value: 'audio',
      label: locale === 'vi' ? 'Audio (Âm thanh)' : 'Audio',
      description: locale === 'vi' ? 'Mô hình xử lý và nhận diện âm thanh' : 'Audio processing models',
      icon: <Layers className="w-3.5 h-3.5 text-emerald-500" />,
      badge: 'AUDIO',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    },
    {
      value: 'video',
      label: 'Video',
      description: locale === 'vi' ? 'Mô hình tạo và phân tích video AI' : 'Video AI generation models',
      icon: <Layers className="w-3.5 h-3.5 text-pink-500" />,
      badge: 'VIDEO',
      badgeColor: 'bg-pink-500/15 text-pink-600 border-pink-500/30',
    },
    {
      value: 'speech',
      label: locale === 'vi' ? 'Speech (Giọng nói)' : 'Speech',
      description: locale === 'vi' ? 'Mô hình giọng nói và TTS' : 'Speech & Voice TTS models',
      icon: <Layers className="w-3.5 h-3.5 text-amber-500" />,
      badge: 'SPEECH',
      badgeColor: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    },
  ];

  // Provider Filter Combobox Options
  const providerFilterValue = controls.onlyFree
    ? 'free'
    : controls.largeContextOnly
    ? 'context32k'
    : 'all';

  const providerFilterOptions: ComboboxOption[] = [
    {
      value: 'all',
      label: locale === 'vi' ? 'Tất cả Providers' : 'All Providers',
      description: locale === 'vi' ? 'Hiển thị mọi nhà cung cấp khả dụng' : 'Show all available providers',
      icon: <Layers className="w-3.5 h-3.5 text-cyan-500" />,
    },
    {
      value: 'free',
      label: locale === 'vi' ? 'Chỉ Free Providers' : 'Free Providers Only',
      description: locale === 'vi' ? 'Provider có gói free 0 đồng' : 'Free tier inference providers',
      icon: <Layers className="w-3.5 h-3.5 text-emerald-500" />,
    },
    {
      value: 'context32k',
      label: 'Context > 32k Tokens',
      description: locale === 'vi' ? 'Hỗ trợ ngữ cảnh lớn' : 'Supports large context window',
      icon: <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />,
      badge: '>32K',
      badgeColor: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    },
  ];

  const handleProviderFilterChange = (val: string) => {
    if (val === 'free') {
      onChange({ ...controls, onlyFree: true, largeContextOnly: false });
    } else if (val === 'context32k') {
      onChange({ ...controls, onlyFree: false, largeContextOnly: true });
    } else {
      onChange({ ...controls, onlyFree: false, largeContextOnly: false });
    }
  };

  // Filtered autocomplete models for model search combobox
  const autocompleteModels = controls.modelSearch
    ? availableModels.filter((m) =>
        matchesSearchQuery(controls.modelSearch, [m.name, m.apiId, m.providerName])
      ).slice(0, 8)
    : availableModels.slice(0, 6);

  // Filtered autocomplete providers for provider search combobox
  const autocompleteProviders = controls.providerSearch
    ? availableProviders.filter((p) =>
        matchesSearchQuery(controls.providerSearch, [p.name, p.slug])
      ).slice(0, 6)
    : availableProviders.slice(0, 5);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left Box: Model LLM Controls with Combobox */}
      <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#121827]/90 shadow-sm space-y-3 hover:border-indigo-500/30 transition-all">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>{locale === 'vi' ? 'Tìm & Lọc Model LLM' : 'LLM Model Controls'}</span>
          </h3>
          {controls.modelSearch && (
            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              {locale === 'vi' ? 'Đang lọc' : 'Filtering'}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Autocomplete Combobox Search Input for Models */}
          <div className="relative flex-1" ref={modelContainerRef}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={controls.modelSearch}
                onChange={(e) => {
                  onChange({ ...controls, modelSearch: e.target.value });
                  setModelSearchOpen(true);
                }}
                onFocus={() => setModelSearchOpen(true)}
                placeholder={locale === 'vi' ? 'Tìm kiếm Model (Llama, Gemini...)' : 'Search Model (Llama, Gemini...)'}
                suppressHydrationWarning
                className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {controls.modelSearch && (
                <button
                  type="button"
                  onClick={() => onChange({ ...controls, modelSearch: '' })}
                  suppressHydrationWarning
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Model Suggestions Dropdown Menu */}
            {modelSearchOpen && autocompleteModels.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl bg-white dark:bg-[#121827] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                  {locale === 'vi' ? 'Gợi ý Model LLM' : 'Suggested LLM Models'}
                </div>
                {autocompleteModels.map((m, idx) => (
                  <div
                    key={m.apiId || idx}
                    onClick={() => {
                      onChange({ ...controls, modelSearch: m.name });
                      setModelSearchOpen(false);
                    }}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                  >
                    <div className="truncate">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{m.apiId}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Type Combobox Dropdown */}
          <Combobox
            options={modelTypeOptions}
            value={controls.modelType}
            onChange={(val) => onChange({ ...controls, modelType: val as any })}
            placeholder={locale === 'vi' ? 'Loại Model' : 'Model Type'}
            icon={<Filter className="w-3.5 h-3.5" />}
            searchable={false}
            className="sm:w-52"
          />
        </div>
      </div>

      {/* Right Box: Provider Controls with Combobox */}
      <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#121827]/90 shadow-sm space-y-3 hover:border-cyan-500/30 transition-all">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-cyan-500 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{locale === 'vi' ? 'Tìm & Lọc Provider' : 'Provider Controls'}</span>
          </h3>
          {(controls.providerSearch || controls.onlyFree || controls.largeContextOnly) && (
            <button
              type="button"
              onClick={handleReset}
              suppressHydrationWarning
              className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>{locale === 'vi' ? 'Đặt lại bộ lọc' : 'Reset Filters'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Autocomplete Combobox Search Input for Providers */}
          <div className="relative flex-1" ref={providerContainerRef}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={controls.providerSearch}
                onChange={(e) => {
                  onChange({ ...controls, providerSearch: e.target.value });
                  setProviderSearchOpen(true);
                }}
                onFocus={() => setProviderSearchOpen(true)}
                placeholder={locale === 'vi' ? 'Tìm kiếm Provider (Groq, OpenRouter...)' : 'Search Provider (Groq, OpenRouter...)'}
                suppressHydrationWarning
                className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
              {controls.providerSearch && (
                <button
                  type="button"
                  onClick={() => onChange({ ...controls, providerSearch: '' })}
                  suppressHydrationWarning
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Provider Suggestions Dropdown Menu */}
            {providerSearchOpen && autocompleteProviders.length > 0 && (
              <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl bg-white dark:bg-[#121827] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                  {locale === 'vi' ? 'Gợi ý Provider' : 'Suggested Providers'}
                </div>
                {autocompleteProviders.map((p, idx) => (
                  <div
                    key={p.slug || idx}
                    onClick={() => {
                      onChange({ ...controls, providerSearch: p.name });
                      setProviderSearchOpen(false);
                    }}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 font-bold transition-colors text-slate-800 dark:text-slate-200"
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {p.modelsCount} models
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Provider Filter Combobox Dropdown */}
          <Combobox
            options={providerFilterOptions}
            value={providerFilterValue}
            onChange={handleProviderFilterChange}
            placeholder={locale === 'vi' ? 'Lọc Provider' : 'Filter Provider'}
            icon={<Filter className="w-3.5 h-3.5" />}
            searchable={false}
            className="sm:w-52"
          />
        </div>
      </div>
    </section>
  );
}

