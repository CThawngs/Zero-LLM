'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useLocale } from './LocaleProvider';

interface CopyModelButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
}

export function CopyModelButton({ textToCopy, label, className = '' }: CopyModelButtonProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      suppressHydrationWarning
      title={copied ? t('accordion.copied') : (label || t('accordion.copy_model_name'))}
      aria-label={label || t('accordion.copy_model_name')}
      className={`cursor-pointer inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold rounded-md border transition-all active:scale-95 select-none ${
        copied
          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
          <span className="text-[10px] uppercase font-bold">{t('accordion.copied')}</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase font-bold">Copy</span>
        </>
      )}
    </button>
  );
}
