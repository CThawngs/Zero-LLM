'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { useLocale } from './LocaleProvider';

interface LlmsTxtModalProps {
  onClose: () => void;
}

export function LlmsTxtModal({ onClose }: LlmsTxtModalProps) {
  const { locale } = useLocale();
  const [content, setContent] = useState<string>(locale === 'vi' ? 'Đang tải chuẩn llms.txt...' : 'Loading llms.txt standard...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/llms.txt')
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch(() => setContent('# Error loading llms.txt endpoint'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llms.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-8 space-y-3 sm:space-y-4 max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4 gap-2">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {locale === 'vi' ? 'TIÊU CHUẨN ĐỊNH DẠNG' : 'SPECIFICATION'}
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 truncate">LLMS.TXT STANDARD</h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 font-mono text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
          {content}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-1 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={handleCopy}
            className="cursor-pointer w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 transition-colors active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (locale === 'vi' ? 'ĐÃ SAO CHÉP' : 'COPIED') : (locale === 'vi' ? 'SAO CHÉP NỘI DUNG' : 'COPY CONTENT')}</span>
          </button>
          <button
            onClick={handleDownload}
            className="cursor-pointer w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 transition-colors shadow-md active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{locale === 'vi' ? 'TẢI XUỐNG' : 'DOWNLOAD'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
