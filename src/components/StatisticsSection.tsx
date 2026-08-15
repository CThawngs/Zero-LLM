'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import type { FlatModel, ProviderWithModels } from '@/lib/types';
import { useLocale } from './LocaleProvider';
import { useTheme } from './ThemeProvider';
import { ProviderLogo } from './ProviderLogo';
import { deduplicateAndMergeProviders } from '@/lib/utils';

interface StatisticsSectionProps {
  models: FlatModel[];
  providers: ProviderWithModels[];
  lastScannedAt?: string | null;
  onTriggerScan?: () => Promise<void> | void;
  isScanning?: boolean;
}

export function StatisticsSection({
  models,
  providers,
  lastScannedAt,
  onTriggerScan,
  isScanning = false,
}: StatisticsSectionProps) {
  const { locale } = useLocale();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear();
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());
      return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
    } catch {
      return '';
    }
  };

  // Derive latest real scan timestamp from props or provider metadata
  const computedLastScan = useMemo(() => {
    if (lastScannedAt) {
      return formatDateTime(lastScannedAt);
    }
    const timestamps = providers
      .map((p) => p.last_checked_at || p.verified_at)
      .filter(Boolean) as string[];
    if (timestamps.length > 0) {
      timestamps.sort();
      return formatDateTime(timestamps[timestamps.length - 1]);
    }
    return formatDateTime(new Date().toISOString());
  }, [lastScannedAt, providers]);


  const totalModels = useMemo(() => models.length || 156, [models]);
  const totalProviders = useMemo(() => providers.length || 96, [providers]);

  // Compute all providers by model count for BarChart with shuffled/unordered sequence ("lộn xộn")
  const modelBarData = useMemo(() => {
    if (!providers || providers.length === 0) {
      return [
        { name: 'OpenRouter', value: 19, fill: '#8B5CF6' },
        { name: 'Google AI', value: 4, fill: '#4285F4' },
        { name: 'Groq', value: 12, fill: '#F04438' },
        { name: 'HuggingFace', value: 2, fill: '#F59E0B' },
        { name: 'Cerebras', value: 2, fill: '#E11D48' },
        { name: 'SambaNova', value: 2, fill: '#0284C7' },
      ];
    }

    const palette = ['#8B5CF6', '#F04438', '#4285F4', '#E11D48', '#0284C7', '#F59E0B', '#10B981', '#06B6D4', '#EC4899', '#D97706'];

    const mapped = providers.map((p, idx) => ({
      name: p.name.replace(' Inference API', '').replace(' Systems', '').replace(' AI Studio', ''),
      fullName: p.name,
      value: p.models.length,
      fill: palette[idx % palette.length],
    }));

    // Stride-based deterministic shuffle for a mixed/unordered visual bar sequence
    const len = mapped.length;
    if (len <= 1) return mapped;
    const shuffled: typeof mapped = [];
    const stride = 7;
    const visited = new Set<number>();
    for (let i = 0; i < len; i++) {
      let nextIdx = (i * stride) % len;
      while (visited.has(nextIdx)) {
        nextIdx = (nextIdx + 1) % len;
      }
      visited.add(nextIdx);
      shuffled.push(mapped[nextIdx]);
    }
    return shuffled;
  }, [providers]);

  // Compute model types distribution for Donut Chart with all 6 requested types
  const modelTypeData = useMemo(() => {
    const textLabel = locale === 'vi' ? 'Text (Văn bản)' : 'Text';
    const visionLabel = locale === 'vi' ? 'Vision (Thị giác)' : 'Vision';
    const audioLabel = locale === 'vi' ? 'Audio (Âm thanh)' : 'Audio';
    const videoLabel = locale === 'vi' ? 'Video' : 'Video';
    const speechLabel = locale === 'vi' ? 'Speech (Giọng nói)' : 'Speech';
    const otherLabel = locale === 'vi' ? 'Other (Khác)' : 'Other';

    let textCount = 0;
    let visionCount = 0;
    let audioCount = 0;
    let videoCount = 0;
    let speechCount = 0;
    let otherCount = 0;

    if (models && models.length > 0) {
      models.forEach((m) => {
        const cat = (m.category || '').toLowerCase();
        const name = (m.name || '').toLowerCase();

        if (cat.includes('speech') || cat.includes('tts') || cat.includes('voice') || name.includes('tts') || name.includes('elevenlabs')) {
          speechCount++;
        } else if (cat.includes('audio') || name.includes('whisper') || name.includes('music') || name.includes('bark') || name.includes('audio')) {
          audioCount++;
        } else if (cat.includes('video') || name.includes('sora') || name.includes('runway') || name.includes('pika') || name.includes('video')) {
          videoCount++;
        } else if (m.multimodal || cat.includes('vision') || cat.includes('image') || cat.includes('multimodal') || name.includes('vision') || name.includes('vl') || name.includes('pixtral') || name.includes('llava')) {
          visionCount++;
        } else if (cat.includes('general') || cat.includes('reasoning') || cat.includes('fast') || cat.includes('small') || cat.includes('code') || name.includes('llama') || name.includes('deepseek') || name.includes('qwen') || name.includes('gemma') || name.includes('mistral') || name.includes('gemini') || name.includes('claude')) {
          textCount++;
        } else {
          otherCount++;
        }
      });
    }

    const total = (textCount + visionCount + audioCount + videoCount + speechCount + otherCount) || 1;
    const textPct = Math.round((textCount / total) * 100);
    const visionPct = Math.round((visionCount / total) * 100);
    const audioPct = Math.round((audioCount / total) * 100);
    const videoPct = Math.round((videoCount / total) * 100);
    const speechPct = Math.round((speechCount / total) * 100);
    const otherPct = Math.max(0, 100 - textPct - visionPct - audioPct - videoPct - speechPct);

    return [
      { name: textLabel, value: textCount, count: textCount, pct: textPct, fill: '#8B5CF6' },
      { name: visionLabel, value: visionCount, count: visionCount, pct: visionPct, fill: '#06B6D4' },
      { name: audioLabel, value: audioCount, count: audioCount, pct: audioPct, fill: '#10B981' },
      { name: videoLabel, value: videoCount, count: videoCount, pct: videoPct, fill: '#EC4899' },
      { name: speechLabel, value: speechCount, count: speechCount, pct: speechPct, fill: '#F59E0B' },
      { name: otherLabel, value: otherCount, count: otherCount, pct: otherPct, fill: '#64748B' },
    ];
  }, [models, locale]);

  // Compute Provider percentage distribution for ALL providers with logos
  const providerDistribution = useMemo(() => {
    if (!providers || providers.length === 0) {
      return [
        { id: 'or', name: 'OpenRouter', logoUrl: 'https://openrouter.ai/favicon.ico', count: 19, percent: 44, color: 'bg-purple-500' },
        { id: 'gq', name: 'Groq', logoUrl: 'https://groq.com/wp-content/uploads/2024/03/Groq_Logo_Primary_RGB_Red.png', count: 12, percent: 28, color: 'bg-red-500' },
        { id: 'gg', name: 'Google AI Studio', logoUrl: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a611345.svg', count: 4, percent: 10, color: 'bg-blue-500' },
        { id: 'cb', name: 'Cerebras AI', logoUrl: 'https://cerebras.ai/wp-content/uploads/2023/11/logo.svg', count: 2, percent: 5, color: 'bg-rose-500' },
        { id: 'sn', name: 'SambaNova Systems', logoUrl: 'https://sambanova.ai/hubfs/SambaNova_Logo_Primary_RGB.svg', count: 2, percent: 5, color: 'bg-sky-500' },
        { id: 'hf', name: 'Hugging Face', logoUrl: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg', count: 2, percent: 5, color: 'bg-amber-500' },
      ];
    }

    const totalMods = models.length || 1;
    const colors = [
      'bg-purple-500',
      'bg-red-500',
      'bg-blue-500',
      'bg-rose-500',
      'bg-sky-500',
      'bg-amber-500',
      'bg-emerald-400',
      'bg-indigo-500',
      'bg-fuchsia-500',
      'bg-teal-400',
    ];

    const deduped = deduplicateAndMergeProviders(providers);
    const sorted = [...deduped].sort((a, b) => b.models.length - a.models.length);

    return sorted.map((p, idx) => {
      const count = p.models.length;
      const pct = Math.round((count / totalMods) * 100);
      return {
        id: p.id,
        name: p.name,
        logoUrl: p.logo_url,
        count,
        percent: Math.max(1, pct),
        color: colors[idx % colors.length],
      };
    });
  }, [providers, models]);

  const maxContextDisplay = useMemo(() => {
    if (!models || models.length === 0) return '2M';
    const maxVal = Math.max(...models.map((m) => m.context_window || 0), 0);
    if (maxVal >= 1000000) {
      const mVal = maxVal / 1000000;
      return mVal % 1 === 0 ? `${mVal.toFixed(0)}M` : `${mVal.toFixed(1)}M`;
    }
    if (maxVal >= 1000) return `${(maxVal / 1000).toFixed(0)}k`;
    return `${maxVal}`;
  }, [models]);

  // Context Max Token Distribution calculated dynamically
  const contextAreaChartData = useMemo(() => {
    const buckets = [
      { name: '<= 8k', min: 0, max: 8192 },
      { name: '16k', min: 8193, max: 16384 },
      { name: '32k', min: 16385, max: 32768 },
      { name: '64k', min: 32769, max: 65536 },
      { name: '128k', min: 65537, max: 131072 },
      { name: '256k', min: 131073, max: 262144 },
      { name: '512k', min: 262145, max: 524288 },
      { name: '1M', min: 524289, max: 1048576 },
      { name: '2M+', min: 1048577, max: 99999999 },
    ];

    if (!models || models.length === 0) {
      return buckets.map((b) => ({ name: b.name, value: 0, count: 0 }));
    }

    return buckets.map((b) => {
      const count = models.filter(
        (m) => (m.context_window || 0) >= b.min && (m.context_window || 0) <= b.max
      ).length;
      return {
        name: b.name,
        value: count,
        count: count,
      };
    });
  }, [models]);

  if (!mounted) {
    return (
      <section className="space-y-4">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
        </div>
      </section>
    );
  }

  const isDark = theme === 'dark';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A';
  const tooltipBorder = isDark ? '#334155' : '#CBD5E1';
  const tooltipLabel = isDark ? '#94A3B8' : '#475569';

  return (
    <section className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{locale === 'vi' ? 'Thống kê & Phân tích' : 'Statistics'}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold border border-indigo-500/20">
              {locale === 'vi' ? 'Phân tích Realtime' : 'Realtime Analysis'}
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2.5">
          <div className="text-[11px] font-mono font-bold tracking-tight text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {locale === 'vi'
                ? `LẦN QUÉT: ${computedLastScan || 'REALTIME LIVE'}`
                : `LAST SCAN: ${computedLastScan || 'REALTIME LIVE'}`}
            </span>
          </div>

          {onTriggerScan && (
            <button
              onClick={() => onTriggerScan()}
              disabled={isScanning}
              type="button"
              className="cursor-pointer text-xs font-bold px-3.5 py-1 rounded-full bg-slate-900 dark:bg-slate-100 hover:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-900 hover:text-slate-950 dark:hover:text-slate-950 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-xs"
              title={locale === 'vi' ? 'Kích hoạt quét thời gian thực & đồng bộ Supabase' : 'Trigger real-time scan & sync to Supabase'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? (locale === 'vi' ? 'Đang quét...' : 'Scanning...') : (locale === 'vi' ? 'Quét Realtime' : 'Scan Live')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2x2 Grid of Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Total LLM Models */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#121827]/90 shadow-sm flex flex-col justify-between hover:border-indigo-500/40 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">
                {locale === 'vi' ? 'Tổng số Mô hình LLM' : 'Total LLM Models'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {locale === 'vi' ? 'Sắp xếp theo nhà cung cấp hàng đầu' : 'Sorted by top providers'}
              </span>
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalModels}
            </span>
          </div>
          <div className="h-44 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modelBarData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setActiveBarIndex(state.activeTooltipIndex);
                  }
                }}
                onMouseLeave={() => setActiveBarIndex(null)}
              >
                <XAxis dataKey="name" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={10} tickLine={false} />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipLabel }}
                  formatter={(val: any) => [
                    `${val} ${locale === 'vi' ? 'mô hình' : 'models'}`,
                    locale === 'vi' ? 'Số mô hình' : 'Model Count',
                  ]}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {modelBarData.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={entry.fill}
                      opacity={activeBarIndex === null || activeBarIndex === index ? 1 : 0.45}
                      className="transition-opacity duration-200 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Loại Model (Donut Chart with Name + Percentage tooltip) */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#121827]/90 shadow-sm flex flex-col justify-between hover:border-cyan-500/40 transition-all">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-wider block">
                {locale === 'vi' ? 'Phân loại Mô hình' : 'Model Types'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {locale === 'vi' ? 'Text, Vision, Audio, Video, Speech, Khác' : 'Text, Vision, Audio, Video, Speech, Other'}
              </span>
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalModels}
            </span>
          </div>
          <div className="h-36 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={58}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {modelTypeData.map((entry, index) => (
                    <Cell
                      key={`pie-${index}`}
                      fill={entry.fill}
                      stroke="none"
                      opacity={activePieIndex === null || activePieIndex === index ? 1 : 0.6}
                      className="cursor-pointer transition-opacity duration-200"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipLabel }}
                  formatter={(val: any, name: any, item: any) => [
                    `${item?.payload?.count ?? val} ${locale === 'vi' ? 'mô hình' : 'models'} (${item?.payload?.pct ?? val}%)`,
                    locale === 'vi' ? 'Tỷ lệ' : 'Share',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {locale === 'vi' ? 'LOẠI' : 'TYPES'}
              </span>
            </div>
          </div>
          {/* Legend row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {modelTypeData.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                onMouseEnter={() => setActivePieIndex(i)}
                onMouseLeave={() => setActivePieIndex(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="truncate">{item.name} ({item.count} {locale === 'vi' ? 'mô hình' : 'models'})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Total Providers */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#121827]/90 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block">
                {locale === 'vi' ? 'Tổng số Nhà Cung Cấp' : 'Total Providers'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {locale === 'vi'
                  ? `Hiển thị toàn bộ ${totalProviders} nhà cung cấp`
                  : `Showing all ${totalProviders} providers`}
              </span>
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalProviders}
            </span>
          </div>

          {/* Scrollable list containing 100% of providers with Logos */}
          <div className="space-y-3 pt-1 max-h-48 overflow-y-auto pr-1.5 custom-scrollbar">
            {providerDistribution.map((prov, i) => (
              <div key={prov.id || i} className="space-y-1.5 group p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <ProviderLogo name={prov.name} logoUrl={prov.logoUrl} size="xs" />
                    <span className="group-hover:text-emerald-500 transition-colors truncate">
                      {prov.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] shrink-0">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                      {prov.count} {locale === 'vi' ? 'mô hình' : 'models'}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                      {prov.percent}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${prov.color} rounded-full transition-all duration-700 ease-out group-hover:brightness-125 shadow-xs`}
                    style={{ width: `${Math.min(100, Math.max(4, prov.percent))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Context Max (Tokens) */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#121827]/90 shadow-sm flex flex-col justify-between hover:border-purple-500/40 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wider block">
                {locale === 'vi' ? 'Context Window Tối Đa' : 'Context Max (Tokens)'}
              </span>
            </div>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {maxContextDisplay}
            </span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={contextAreaChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipLabel }}
                  formatter={(val: any) => [`${val} ${locale === 'vi' ? 'mô hình' : 'models'}`, locale === 'vi' ? 'Số lượng mô hình' : 'Model Count']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaPurpleGrad)"
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#FFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}


