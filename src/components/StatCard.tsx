'use client';

import React from 'react';

interface StatCardProps {
  indexNumber: string;
  label: string;
  value: string | number;
  sublabel?: string;
  highlightColor?: string;
}

export function StatCard({
  indexNumber,
  label,
  value,
  sublabel,
  highlightColor = '#F59E0B',
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-3.5 sm:p-6 relative group hover:border-amber-500/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden stitch-glass-card">
      {/* Decorative Stitch Glow Halo */}
      <div 
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none"
        style={{ backgroundColor: highlightColor }}
      />

      <div className="flex justify-between items-start mb-2 sm:mb-4 relative z-10 gap-1.5">
        <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400 line-clamp-1 truncate">
          {label}
        </span>
        <span className="font-extrabold text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors shrink-0">
          {indexNumber}
        </span>
      </div>

      <div className="space-y-1 relative z-10">
        <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
          {value}
        </div>
        {sublabel && (
          <p className="text-[9px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between gap-1">
            <span className="truncate">{sublabel}</span>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: highlightColor }} />
          </p>
        )}
      </div>

      <div
        className="absolute top-0 left-0 w-full h-[3px] opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: highlightColor }}
      />
    </div>
  );
}
