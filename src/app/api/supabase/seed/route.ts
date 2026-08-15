import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';
import { INITIAL_PROVIDERS } from '@/lib/mockData';
import { deduplicateAndMergeProviders } from '@/lib/utils';
import { randomUUID } from 'crypto';

export async function POST() {
  const sb = getServerSupabase();

  if (!sb) {
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase URL and Key are not configured in environment variables.',
        instructions: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env or Settings.',
      },
      { status: 400 }
    );
  }

  try {
    const timestamp = new Date().toISOString();
    let providersSynced = 0;
    let modelsSynced = 0;
    const errors: string[] = [];

    const uniqueProviders = deduplicateAndMergeProviders(INITIAL_PROVIDERS);

    for (const p of uniqueProviders) {
      if (!p.is_free) continue;

      let providerDbId: string | null = null;

      // 1. Check if provider already exists by slug
      const { data: existingP } = await sb
        .from('providers')
        .select('id')
        .eq('slug', p.slug)
        .maybeSingle();

      if (existingP?.id) {
        providerDbId = existingP.id;
        const { error: pErr } = await sb
          .from('providers')
          .update({
            name: p.name,
            website: p.website,
            signup_url: p.signup_url,
            api_key_guide: p.api_key_guide,
            logo_url: p.logo_url,
            description: p.description,
            is_free: p.is_free,
            discovered_via: p.discovered_via,
            source_repo: p.source_repo,
            status: 'active',
            last_checked_at: timestamp,
            verified_at: timestamp,
            updated_at: timestamp,
          })
          .eq('id', providerDbId);

        if (!pErr) {
          providersSynced++;
        } else {
          errors.push(`Update provider ${p.slug}: ${pErr.message}`);
        }
      } else {
        providerDbId = randomUUID();
        const { error: pErr } = await sb.from('providers').insert({
          id: providerDbId,
          name: p.name,
          slug: p.slug,
          website: p.website,
          signup_url: p.signup_url,
          api_key_guide: p.api_key_guide,
          logo_url: p.logo_url,
          description: p.description,
          is_free: p.is_free,
          discovered_via: p.discovered_via,
          source_repo: p.source_repo,
          status: 'active',
          last_checked_at: timestamp,
          verified_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp,
        });

        if (!pErr) {
          providersSynced++;
        } else {
          errors.push(`Insert provider ${p.slug}: ${pErr.message}`);
        }
      }

      if (!providerDbId) continue;

      // 2. Sync all models for this provider
      for (const m of p.models) {
        if (!m.is_free) continue;

        const { data: existingM } = await sb
          .from('models')
          .select('id')
          .eq('provider_id', providerDbId)
          .eq('model_api_id', m.model_api_id)
          .maybeSingle();

        if (existingM?.id) {
          const { error: mErr } = await sb
            .from('models')
            .update({
              name: m.name,
              context_window: m.context_window,
              is_free: m.is_free,
              price_input_per_mtok: m.price_input_per_mtok,
              price_output_per_mtok: m.price_output_per_mtok,
              external_url: m.external_url,
              rate_limit_per_minute: m.rate_limit_per_minute,
              rate_limit_per_day: m.rate_limit_per_day,
              multimodal: m.multimodal,
              category: m.category,
              popularity_score: m.popularity_score,
              discovered_via: m.discovered_via,
              status: 'active',
              last_checked_at: timestamp,
              verified_at: timestamp,
              updated_at: timestamp,
            })
            .eq('id', existingM.id);

          if (!mErr) {
            modelsSynced++;
          } else {
            errors.push(`Update model ${m.model_api_id}: ${mErr.message}`);
          }
        } else {
          const newModelId = randomUUID();
          const { error: mErr } = await sb.from('models').insert({
            id: newModelId,
            provider_id: providerDbId,
            model_api_id: m.model_api_id,
            name: m.name,
            context_window: m.context_window,
            is_free: m.is_free,
            price_input_per_mtok: m.price_input_per_mtok,
            price_output_per_mtok: m.price_output_per_mtok,
            external_url: m.external_url,
            rate_limit_per_minute: m.rate_limit_per_minute,
            rate_limit_per_day: m.rate_limit_per_day,
            multimodal: m.multimodal,
            category: m.category,
            popularity_score: m.popularity_score,
            discovered_via: m.discovered_via,
            status: 'active',
            last_checked_at: timestamp,
            verified_at: timestamp,
            created_at: timestamp,
            updated_at: timestamp,
          });

          if (!mErr) {
            modelsSynced++;
          } else {
            errors.push(`Insert model ${m.model_api_id}: ${mErr.message}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded/synced Supabase database with Free LLM providers and models.',
      providersSynced,
      modelsSynced,
      errors: errors.slice(0, 5),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to seed Supabase database',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
