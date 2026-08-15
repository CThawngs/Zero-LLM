'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { LlmsTxtModal } from './LlmsTxtModal';
import { Sparkles } from 'lucide-react';
import { useLocale } from './LocaleProvider';

interface HeaderProps {
  realtimeStatus?: string;
  onScanComplete?: () => void;
}

export function Header({ realtimeStatus = 'connected' }: HeaderProps) {
  const { locale } = useLocale();
  const [showLlmsTxt, setShowLlmsTxt] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0E17]/90 backdrop-blur-md transition-colors w-full">
        <nav className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Logo Section */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 p-[1.5px] flex items-center justify-center shadow-xs shrink-0">
                <div className="w-full h-full bg-slate-900 dark:bg-[#0B0E17] rounded-full flex items-center justify-center">
                  <span className="font-black text-xs text-amber-400 tracking-tighter">Z</span>
                </div>
              </div>
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors whitespace-nowrap">
                Zero LLM
              </span>
            </Link>

            {/* Pill Badge (Desktop / Tablet only) */}
            <span className="hidden md:inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 whitespace-nowrap">
              {locale === 'vi' ? 'Trình theo dõi Provider LLM Miễn phí' : 'Free LLM Provider Tracker'}
            </span>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <ThemeToggle />
            <LanguageSelector />

            <button
              onClick={() => setShowLlmsTxt(true)}
              type="button"
              suppressHydrationWarning
              className="cursor-pointer text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-full bg-indigo-600/10 dark:bg-indigo-500/15 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 transition-all flex items-center gap-1 sm:gap-1.5 active:scale-95 shadow-xs whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="hidden sm:inline">{locale === 'vi' ? 'Dành cho AI đọc' : 'for AI Reading'}</span>
              <span className="sm:hidden font-mono">llms.txt</span>
            </button>
          </div>
        </nav>
      </header>

      {showLlmsTxt && <LlmsTxtModal onClose={() => setShowLlmsTxt(false)} />}
    </>
  );
}

