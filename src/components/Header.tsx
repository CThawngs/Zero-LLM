'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  realtimeStatus?: string;
  onScanComplete?: () => void;
}

export function Header({ realtimeStatus = 'connected' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0E17]/90 backdrop-blur-md transition-colors w-full">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Logo Section */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 p-[1.5px] flex items-center justify-center shadow-xs shrink-0 transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-slate-900 dark:bg-[#0B0E17] rounded-[10px] flex items-center justify-center">
                <span className="font-black text-sm text-amber-400 tracking-tighter">Z</span>
              </div>
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors whitespace-nowrap">
              Zero LLM
            </span>
          </Link>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <LanguageSelector />
        </div>
      </nav>
    </header>
  );
}


