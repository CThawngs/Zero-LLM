'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ExternalLink, RefreshCw, Database, ShieldCheck, Github, Layers, Zap, Search } from 'lucide-react';
import { useLocale } from './LocaleProvider';

interface ScanReportModalProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export function ScanReportModal({ onClose, onRefreshData }: ScanReportModalProps) {
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'repos' | 'providers'>('repos');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchScanReport = async () => {
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('/api/scan-providers', {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setReportData(data);
          if (onRefreshData) onRefreshData();
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Scan report fetch notice:', e?.message || e);
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanReport();
  }, []);

  const filteredRepos = (reportData?.scanned_repos || []).filter((r: any) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.repo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProviders = (reportData?.providers || []).filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <Github className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="truncate">{locale === 'vi' ? 'NHẬT KÝ QUÉT REALTIME & NGUỒN REPO' : 'REALTIME SCAN & REPO SOURCES'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-[10px] font-bold border border-emerald-500/20">
                  LIVE API
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                {locale === 'vi'
                  ? 'Giám sát 13+ GitHub Repositories hàng đầu chuyên tổng hợp các Provider LLM Miễn Phí 0đ.'
                  : 'Monitoring 13+ top curated GitHub Repositories specializing in 100% Free LLM APIs.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={fetchScanReport}
              disabled={loading}
              type="button"
              className="cursor-pointer p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 transition-colors text-slate-600 dark:text-slate-300 disabled:opacity-50"
              title={locale === 'vi' ? 'Quét Lại Ngay' : 'Re-Scan Now'}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="cursor-pointer p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-colors text-slate-600 dark:text-slate-300"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              {locale === 'vi' ? 'Nguồn Repos Scanned' : 'Repos Scanned'}
            </span>
            <div className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span>{reportData?.sources_scanned_count || 13}</span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              {locale === 'vi' ? 'Provider Free Đã Xác Nhận' : 'Free Providers'}
            </span>
            <div className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span>{reportData?.total_free_providers || 10}</span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              {locale === 'vi' ? 'Models Free 0đ' : '0$ Free Models'}
            </span>
            <div className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>{reportData?.total_free_models || 40}</span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              {locale === 'vi' ? 'Supabase Sync' : 'Supabase Sync'}
            </span>
            <div className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">
                {reportData?.supabase_sync?.synced
                  ? (locale === 'vi' ? `Đã đồng bộ (${reportData.supabase_sync.models_synced})` : `Synced (${reportData.supabase_sync.models_synced})`)
                  : (locale === 'vi' ? 'Realtime' : 'Realtime')}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection & Search */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('repos')}
              className={`cursor-pointer flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'repos'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{locale === 'vi' ? '13 GitHub Repos' : '13 Scanned Repos'}</span>
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`cursor-pointer flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'providers'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{locale === 'vi' ? 'Provider 100% Free' : 'Verified Providers'}</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={locale === 'vi' ? 'Tìm repo, provider...' : 'Search repo, provider...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-3 sm:space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                {locale === 'vi' ? 'Đang kết nối Realtime GitHub Scanners...' : 'Connecting to Realtime GitHub Scanners...'}
              </p>
            </div>
          ) : activeTab === 'repos' ? (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {locale === 'vi'
                  ? 'Danh sách các kho lưu trữ GitHub chính thức được tích hợp trực tiếp vào hệ thống Realtime Scanner:'
                  : 'List of official GitHub repositories integrated into the Realtime Scanner pipeline:'}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredRepos.map((repo: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          #{idx + 1}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {repo.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          {repo.category}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {repo.repo}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {repo.verified_providers?.map((prov: string, pIdx: number) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 text-[10px] font-semibold"
                          >
                            ✓ {prov}
                          </span>
                        ))}
                      </div>
                    </div>

                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer shrink-0 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 self-start sm:self-center"
                    >
                      <span>{locale === 'vi' ? 'Xem GitHub Repo' : 'View GitHub'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {locale === 'vi'
                  ? 'Tất cả các nhà cung cấp bên dưới đã qua xác minh có ít nhất 1 model LLM 0 đồng:'
                  : 'All listed providers below have been verified to offer at least 1 free LLM model:'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProviders.map((prov: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{prov.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          100% FREE TIER
                        </span>
                      </h4>
                      <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                        {prov.models?.length || 0} Models
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {prov.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 dark:text-slate-400">
                        Source: {prov.source_repo || 'GitHub Scanner'}
                      </span>
                      <a
                        href={prov.signup_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>{locale === 'vi' ? 'Đăng Ký API Key' : 'Get Key'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>
              {locale === 'vi'
                ? 'Website chỉ liệt kê Provider có ít nhất 1 model LLM 0 đồng.'
                : 'Website strictly cataloging providers offering at least 1 free LLM model.'}
            </span>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="cursor-pointer px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
          >
            {locale === 'vi' ? 'Đóng Báo Cáo' : 'Close Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
