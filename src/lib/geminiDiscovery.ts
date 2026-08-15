import { GoogleGenAI } from '@google/genai';
import type { ProviderWithModels, Model } from './types';

// Web Discovery Prompt Definition with explicit instruction to scan current free AI APIs
const DISCOVERY_PROMPT = `
You are an expert AI infrastructure analyst with live web search capability.
Search and analyze the current global landscape of AI providers offering 100% FREE LLM APIs or permanent developer free tiers.

Target active free providers and their latest models, especially:
1. Google AI Studio (MUST include latest releases: gemini-3.7-flash, gemini-3.7-flash-thinking, gemini-3.1-flash-lite, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro, gemma-2-27b-it)
2. Groq (llama-3.3-70b-versatile, deepseek-r1-distill-llama-70b, deepseek-r1-distill-qwen-32b, llama-3.1-8b-instant, gemma2-9b-it, whisper-large-v3)
3. Cerebras AI (llama3.3-70b, llama3.1-8b, deepseek-r1-distill-llama-70b at 2000+ tok/s free)
4. SambaNova Systems (Meta-Llama-3.3-70B-Instruct, DeepSeek-R1, Qwen2.5-Coder-32B-Instruct)
5. GitHub Models (gpt-4o-mini, o3-mini, Phi-4, Meta-Llama-3.3-70B-Instruct)
6. OpenRouter Free Tier (all :free models)
7. Cloudflare Workers AI (@cf/meta/llama-3.3-70b-instruct, @cf/deepseek-ai/deepseek-r1-distill-qwen-32b)
8. NVIDIA Build NIMs, SiliconFlow, Hugging Face Inference API

STRICT REQUIREMENTS:
1. ONLY include providers that offer at least ONE completely FREE LLM model (0$ cost / generous free daily limits).
2. NEVER include paid-only providers.
3. For each model provide exact model_api_id, accurate human-readable name, context_window, rate limits, multimodal flag, and category.

Return ONLY a valid JSON object with the following schema (no additional conversational text):
{
  "discovered_providers": [
    {
      "name": "Google AI Studio",
      "slug": "google-aistudio",
      "website": "https://aistudio.google.com",
      "signup_url": "https://aistudio.google.com/app/apikey",
      "logo_url": "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a611345.svg",
      "description": "Official developer platform for Google Gemini models with 1M+ token context and free tier quotas.",
      "is_free": true,
      "models": [
        {
          "model_api_id": "gemini-3.7-flash",
          "name": "Gemini 3.7 Flash",
          "context_window": 1048576,
          "is_free": true,
          "rate_limit_per_minute": 15,
          "rate_limit_per_day": 1500,
          "multimodal": true,
          "category": "Multimodal",
          "popularity_score": 100
        }
      ]
    }
  ]
}
`;

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
];

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Directly queries Google Generative Language official models endpoint
 * for real-time live ground-truth model discovery and token specs.
 */
export async function fetchLiveGoogleStudioModels(): Promise<Model[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    const rawModels = Array.isArray(data?.models) ? data.models : [];
    const timestamp = new Date().toISOString();

    const freeGoogleModels = rawModels
      .filter((m: any) => {
        const id = (m.name || '').replace('models/', '').toLowerCase();
        // Keep relevant generative & embedding models supported on Google AI Studio Free Tier
        return (
          (id.includes('gemini') || id.includes('gemma') || id.includes('embedding') || id.includes('imagen')) &&
          !id.includes('deprecated') &&
          !id.includes('tuning')
        );
      })
      .map((m: any, idx: number) => {
        const modelApiId = (m.name || '').replace('models/', '');
        const inputLimit = Number(m.inputTokenLimit) || 1048576;
        const displayName = m.displayName || modelApiId;
        const isMultimodal =
          m.supportedGenerationMethods?.includes('generateContent') &&
          (modelApiId.includes('gemini') || modelApiId.includes('vision') || modelApiId.includes('vl'));

        let category = 'General & Chat';
        if (modelApiId.includes('code') || modelApiId.includes('thinking')) category = 'Code & Reasoning';
        else if (isMultimodal) category = 'Multimodal';
        else if (modelApiId.includes('embedding')) category = 'Embeddings & Search';

        return {
          id: `goog-live-${modelApiId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          provider_id: 'provider-google-aistudio',
          model_api_id: modelApiId,
          name: displayName,
          context_window: inputLimit,
          is_free: true,
          price_input_per_mtok: 0,
          price_output_per_mtok: 0,
          external_url: 'https://aistudio.google.com',
          rate_limit_per_minute: modelApiId.includes('pro') ? 2 : 15,
          rate_limit_per_day: modelApiId.includes('pro') ? 50 : 1500,
          multimodal: isMultimodal,
          category,
          popularity_score: 100 - Math.min(idx * 2, 20),
          discovered_via: 'Google Generative Language Live API (/v1beta/models)',
          status: 'active' as const,
          last_checked_at: timestamp,
          verified_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp,
        };
      });

    return freeGoogleModels;
  } catch (err) {
    console.warn('Direct Google AI Studio live models fetch error:', err);
    return [];
  }
}

function cleanJsonText(rawText: string): string {
  let cleaned = rawText.trim();
  // Remove markdown code block fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }
  
  // Find first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned.trim();
}

export async function discoverProvidersWithGemini(): Promise<ProviderWithModels[]> {
  const client = getGeminiClient();
  if (!client) {
    return [];
  }

  let text: string | undefined;

  // Try candidate models with Google Search Grounding for live real-time coverage
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: DISCOVERY_PROMPT,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        text = responseText;
        break; // Success with live search grounding!
      }
    } catch (err: any) {
      // If tools with googleSearch fails or model experiences high demand, try standard JSON mode
      try {
        const fallbackRes = await client.models.generateContent({
          model: modelName,
          contents: DISCOVERY_PROMPT,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const fallbackText = fallbackRes.text?.trim();
        if (fallbackText) {
          text = fallbackText;
          break;
        }
      } catch (innerErr) {
        // Fall back to next model
        continue;
      }
    }
  }

  if (!text) {
    return [];
  }

  try {
    const cleaned = cleanJsonText(text);
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed?.discovered_providers) ? parsed.discovered_providers : [];

    const timestamp = new Date().toISOString();

    const verifiedList: ProviderWithModels[] = list
      .filter((p: any) => {
        // STRICT FILTER: Provider must be free and have at least 1 free model
        return (
          p &&
          p.name &&
          p.slug &&
          p.website &&
          Array.isArray(p.models) &&
          p.models.some((m: any) => m && m.is_free && m.model_api_id)
        );
      })
      .map((p: any) => {
        const providerId = `prov-${p.slug}`;
        const domain = p.website.replace(/^https?:\/\//, '').split('/')[0];
        const logoUrl =
          p.logo_url || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

        const models: Model[] = p.models
          .filter((m: any) => m && m.is_free && m.model_api_id)
          .map((m: any, idx: number) => ({
            id: `mod-${p.slug}-${idx + 1}-${m.model_api_id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
            provider_id: providerId,
            model_api_id: m.model_api_id,
            name: m.name || m.model_api_id,
            context_window: Number(m.context_window) || 128000,
            is_free: true,
            price_input_per_mtok: 0,
            price_output_per_mtok: 0,
            external_url: m.external_url || p.website,
            rate_limit_per_minute: Number(m.rate_limit_per_minute) || 20,
            rate_limit_per_day: Number(m.rate_limit_per_day) || 1000,
            multimodal: Boolean(m.multimodal),
            category: m.category || 'General LLM',
            popularity_score: Number(m.popularity_score) || 90,
            discovered_via: 'Gemini AI Live Web Discovery',
            status: 'active' as const,
            last_checked_at: timestamp,
            verified_at: timestamp,
            created_at: timestamp,
            updated_at: timestamp,
          }));

        const providerObj: ProviderWithModels = {
          id: providerId,
          name: p.name,
          slug: p.slug,
          website: p.website,
          signup_url: p.signup_url || p.website,
          api_key_guide:
            p.api_key_guide ||
            `1. Sign up on ${p.name} (${p.website})\n2. Generate API key from Developer Console\n3. Start using free tier models without upfront cost.`,
          logo_url: logoUrl,
          description: p.description || `${p.name} official free tier API service.`,
          is_free: true,
          discovered_via: 'Gemini AI Live Web Discovery',
          source_repo: null,
          status: 'active' as const,
          last_checked_at: timestamp,
          verified_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp,
          models,
        };
        return providerObj;
      })
      .filter((p: ProviderWithModels) => p.models.length > 0);

    return verifiedList;
  } catch (err) {
    console.warn('[GeminiDiscovery] Failed to parse discovered providers payload:', err);
    return [];
  }
}
