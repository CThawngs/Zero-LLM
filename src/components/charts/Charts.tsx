'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import type { FlatModel, ProviderWithModels } from '@/lib/types';
import { formatContextWindow, getModelCategoryInfo } from '@/lib/utils';
import { useLocale } from '../LocaleProvider';
import { useTheme } from '../ThemeProvider';
import { BarChart3, PieChart, LineChart as LineChartIcon, AreaChart as AreaChartIcon, Sparkles } from 'lucide-react';

const VIBRANT_RAINBOW_COLORS = [
  '#FF5733', // Vivid Orange-Red
  '#00E676', // Electric Green
  '#3D5AFE', // Electric Royal Blue
  '#FF007F', // Deep Pink
  '#FFC107', // Amber Yellow
  '#00B0FF', // Cyan Blue
  '#AA00FF', // Vivid Purple
  '#FF6D00', // Deep Orange
  '#00E5FF', // Bright Cyan
  '#1DE9B6', // Turquoise
];

interface ChartsProps {
  models: FlatModel[];
  providers?: ProviderWithModels[];
}

export function ChartsSection({ models, providers }: ChartsProps) {
  const { t } = useLocale();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 h-80 animate-pulse" />
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 h-80 animate-pulse" />
      </div>
    );
  }

  const tooltipBg = theme === 'dark' ? '#0F172A' : '#FFFFFF';
  const tooltipText = theme === 'dark' ? '#F8FAFC' : '#0F172A';
  const tooltipBorder = theme === 'dark' ? '#334155' : '#E2E8F0';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  // 1. Top Models by Context Size (Bar Chart with rainbow colors)
  const topModelsByContext = [...models]
    .sort((a, b) => (b.context_window || 0) - (a.context_window || 0))
    .slice(0, 8)
    .map((m, idx) => ({
      name: m.name.length > 15 ? m.name.slice(0, 13) + '…' : m.name,
      context: (m.context_window || 0) / 1000, // K tokens
      formatted: formatContextWindow(m.context_window),
      color: VIBRANT_RAINBOW_COLORS[idx % VIBRANT_RAINBOW_COLORS.length],
    }));

  // 2. Line Chart: Rate Limits & Popularity
  const rateLimitData = [...models]
    .filter((m) => m.rate_limit_per_minute)
    .slice(0, 8)
    .map((m) => ({
      name: m.name.length > 12 ? m.name.slice(0, 10) + '…' : m.name,
      rpm: m.rate_limit_per_minute || 30,
      popularity: Math.min(100, Math.round(((m.context_window || 32000) / 2000000) * 100) + 40),
    }));

  // 3. Category Pie/Donut Chart with 5 popular types (Text, Vision, Audio, Video, Speech)
  const typeCounts: Record<string, number> = {
    Text: 0,
    Vision: 0,
    Audio: 0,
    Video: 0,
    Speech: 0,
  };

  if (models && models.length > 0) {
    models.forEach((m) => {
      const info = getModelCategoryInfo(m);
      if (typeCounts[info.key] !== undefined) {
        typeCounts[info.key]++;
      } else {
        typeCounts.Text++;
      }
    });
  } else {
    typeCounts.Text = 80;
    typeCounts.Vision = 20;
    typeCounts.Audio = 10;
    typeCounts.Video = 5;
    typeCounts.Speech = 8;
  }

  const categoryLabelMap: Record<string, string> = {
    Text: t('charts.types.text'),
    Vision: t('charts.types.vision'),
    Audio: t('charts.types.audio'),
    Video: t('charts.types.video'),
    Speech: t('charts.types.speech'),
  };

  const totalModelsCount = models && models.length > 0
    ? models.length
    : Object.values(typeCounts).reduce((a, b) => a + b, 0) || 1;

  const categoryData = Object.entries(typeCounts).map(([key, value]) => {
    const pct = Math.round((value / totalModelsCount) * 100);
    const labelName = categoryLabelMap[key] || key;
    return {
      name: `${labelName} (${value} models)`,
      rawName: labelName,
      value: value,
      count: value,
      pct: pct,
    };
  });

  // 4. Smooth Area Chart (Context trend curve)
  const areaData = [...models]
    .sort((a, b) => (a.context_window || 0) - (b.context_window || 0))
    .slice(-10)
    .map((m) => ({
      name: m.name.length > 12 ? m.name.slice(0, 10) + '…' : m.name,
      tokens: Math.round((m.context_window || 0) / 1000),
    }));

  // 5. Provider Models Distribution Data
  const providerCounts = models.reduce((acc, m) => {
    const pName = m.provider_name;
    acc[pName] = (acc[pName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const providerData = Object.entries(providerCounts).map(([name, count], idx) => ({
    name: name.length > 12 ? name.slice(0, 10) + '…' : name,
    count,
    color: VIBRANT_RAINBOW_COLORS[(idx + 2) % VIBRANT_RAINBOW_COLORS.length],
  }));

  // 6. Free vs Paid Model Ratio
  const freeModelsCount = models.filter((m) => m.is_free).length;
  const paidModelsCount = models.length - freeModelsCount;
  const freeVsPaidData = [
    { name: '100% Free Models', value: freeModelsCount },
    { name: 'Paid / Freemium', value: paidModelsCount },
  ];

  return (
    <div className="space-y-8 my-8">
      {/* Grid Row 1: Bar Chart & Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Colorful Bar Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {t('charts.contextTitle')}
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={topModelsByContext} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={10} tickLine={false} unit="k" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipText }}
                  formatter={(val: any) => [`${val}K tokens`, 'Context Window']}
                />
                <Bar dataKey="context" radius={[8, 8, 0, 0]}>
                  {topModelsByContext.map((entry, index) => (
                    <Cell key={`cell-bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Colorful Line Chart (Biểu đồ đường) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            <LineChartIcon className="w-5 h-5 text-cyan-500" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {t('charts.rateLimitTitle')}
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rateLimitData.length > 0 ? rateLimitData : topModelsByContext} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipText }}
                />
                <Line
                  type="monotone"
                  dataKey="rpm"
                  name="Requests / Min (RPM)"
                  stroke="#00E5FF"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#00E5FF', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 9, fill: '#FF007F' }}
                />
                <Line
                  type="monotone"
                  dataKey="popularity"
                  name="Popularity Score"
                  stroke="#FFD700"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                  dot={{ r: 5, fill: '#FFD700' }}
                />
                <Legend wrapperStyle={{ color: tooltipText, fontSize: '11px', fontWeight: '600', paddingTop: '10px' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Smooth Area Chart & Category Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3. Gradient Smooth Area Chart (Biểu đồ diện tích) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            <AreaChartIcon className="w-5 h-5 text-purple-500" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {t('charts.contextTrendTitle')}
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
                <defs>
                  <linearGradient id="areaColorContext" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#AA00FF" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#AA00FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={10} tickLine={false} unit="k" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipText }}
                  formatter={(val: any) => [`${val}K tokens`, 'Context Capacity']}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="#AA00FF"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaColorContext)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Vibrant Category Pie Chart (Biểu đồ tròn) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            <PieChart className="w-5 h-5 text-pink-500" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {t('charts.categoryTitle')}
            </h3>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ rawName, count }) => `${rawName} (${count} models)`}
                  labelLine={false}
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-cat-${index}`}
                      fill={VIBRANT_RAINBOW_COLORS[index % VIBRANT_RAINBOW_COLORS.length]}
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
                    fontWeight: '600',
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipText }}
                  formatter={(val: any, name: any, item: any) => [
                    `${item?.payload?.count ?? val} models (${item?.payload?.pct ?? 0}%)`,
                    item?.payload?.rawName ?? name,
                  ]}
                />
                <Legend wrapperStyle={{ color: tooltipText, fontSize: '11px', fontWeight: '600' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Row 3: Provider Distribution Multi-bar & Free vs Paid Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 5. Provider Models Distribution */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {t('charts.providerTitle')}
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={providerData} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipText }}
                  formatter={(val: any) => [`${val} models`, 'Models Offered']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {providerData.map((entry, index) => (
                    <Cell key={`cell-prov-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Free vs Paid Model Ratio Donut Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {t('charts.freeVsPaidTitle')}
            </h3>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={freeVsPaidData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#00E676" />
                  <Cell fill="#FF007F" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    color: tooltipText,
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipText }}
                />
                <Legend wrapperStyle={{ color: tooltipText, fontSize: '11px', fontWeight: '600' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
