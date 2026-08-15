'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from './LocaleProvider';

export function Footer() {
  const { locale } = useLocale();

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0E17]/90 text-slate-500 dark:text-slate-400 text-xs py-6 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="font-semibold text-slate-900 dark:text-slate-100 text-center sm:text-left">
          © CThawngs (Zero)
        </div>

        <div className="flex items-center gap-4 font-semibold text-xs">
          <Link
            href="/llms.txt"
            target="_blank"
            className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          >
            {locale === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service'}
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            href="/api/health"
            target="_blank"
            className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          >
            {locale === 'vi' ? 'Trạng thái API' : 'API Status'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
