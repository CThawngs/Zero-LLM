import React from 'react';
import Link from 'next/link';
import { fetchProviderBySlug, fetchProvidersWithModels } from '@/lib/data';
import { ProviderDetail } from '@/components/ProviderDetail';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProviderPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params;
  const provider = await fetchProviderBySlug(slug);

  if (!provider) {
    return (
      <div className="py-20 text-center space-y-6">
        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          404 / NOT FOUND
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100">
          PROVIDER &ldquo;{slug}&rdquo; NOT INDEXED
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto font-medium">
          The requested provider slug does not exist in the ZeroLLM directory or has been archived.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3 rounded-xl transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO LEADERBOARD</span>
          </Link>
        </div>
      </div>
    );
  }

  return <ProviderDetail provider={provider} />;
}
