'use client';

import React from 'react';
import { X, ExternalLink, Key } from 'lucide-react';
import type { ProviderWithModels } from '@/lib/types';
import { useLocale } from './LocaleProvider';

interface ApiKeyGuideModalProps {
  provider: ProviderWithModels;
  onClose: () => void;
}

export function ApiKeyGuideModal({ provider, onClose }: ApiKeyGuideModalProps) {
  const { t, locale } = useLocale();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-7 space-y-4 sm:space-y-6 shadow-2xl cursor-default max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Key className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block truncate">
                {locale === 'vi' ? 'HƯỚNG DẪN LẤY API KEY' : 'API KEY SETUP'}
              </span>
              <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 truncate">{provider.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
          <div className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {locale === 'vi' ? 'CÁC BƯỚC THỰC HIỆN:' : 'INSTRUCTIONS:'}
          </div>
          <div className="whitespace-pre-line font-bold text-xs">
            {provider.api_key_guide || (locale === 'vi' ? '1. Truy cập trang chủ nhà cung cấp\n2. Đăng ký tài khoản miễn phí\n3. Tạo API Key tại phần Developer Settings' : '1. Visit provider website\n2. Register free account\n3. Generate API Key in Developer Settings')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-1">
          {provider.signup_url && (
            <a
              href={provider.signup_url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer w-full sm:w-auto justify-center px-5 py-2.5 sm:py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <span>{t('provider.getApiKey')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
