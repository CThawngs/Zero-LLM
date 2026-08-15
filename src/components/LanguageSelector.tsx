'use client';

import { useLocale } from './LocaleProvider';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="inline-flex items-center rounded-lg bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 p-0.5 text-xs font-semibold shadow-sm">
      <button
        onClick={() => setLocale('vi')}
        type="button"
        suppressHydrationWarning
        className={`cursor-pointer px-2.5 py-1 rounded-md transition-all active:scale-95 ${
          locale === 'vi'
            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
        }`}
      >
        🇻🇳 VI
      </button>
      <button
        onClick={() => setLocale('en')}
        type="button"
        suppressHydrationWarning
        className={`cursor-pointer px-2.5 py-1 rounded-md transition-all active:scale-95 ${
          locale === 'en'
            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400'
        }`}
      >
        🇺🇸 EN
      </button>
    </div>
  );
}
