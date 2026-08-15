'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      suppressHydrationWarning
      className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-amber-500 dark:hover:border-amber-400 active:scale-95 transition-all shadow-sm"
      title="Toggle Theme"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="hidden sm:inline tracking-wider">LIGHT</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-amber-600" />
          <span className="hidden sm:inline tracking-wider">DARK</span>
        </>
      )}
    </button>
  );
}
