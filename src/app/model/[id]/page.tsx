import React from 'react';
import Link from 'next/link';
import { fetchModelsFlat, fetchProviderBySlug } from '@/lib/data';
import { ModelDetail } from '@/components/ModelDetail';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ModelPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { id } = await params;
  const flatModels = await fetchModelsFlat();
  const matched = flatModels.find((m) => m.id === id || m.model_api_id === id);

  if (!matched) {
    return (
      <div className="py-20 text-center space-y-6">
        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          404 / NOT FOUND
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100">
          MODEL &ldquo;{id}&rdquo; NOT INDEXED
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto font-medium">
          The requested model ID was not found in the active ZeroLLM directory.
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

  const provider = await fetchProviderBySlug(matched.provider_slug);

  const modelObj = {
    id: matched.id,
    provider_id: matched.provider_id,
    model_api_id: matched.model_api_id,
    name: matched.name,
    context_window: matched.context_window,
    is_free: matched.is_free,
    price_input_per_mtok: matched.price_input_per_mtok,
    price_output_per_mtok: matched.price_output_per_mtok,
    external_url: matched.external_url,
    rate_limit_per_minute: matched.rate_limit_per_minute,
    rate_limit_per_day: matched.rate_limit_per_day,
    multimodal: matched.multimodal,
    category: matched.category,
    popularity_score: matched.popularity_score,
    discovered_via: 'tier1-api',
    status: matched.status as any,
    last_checked_at: new Date().toISOString(),
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <ModelDetail model={modelObj} provider={provider} />;
}
