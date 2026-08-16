import { GoogleGenAI } from '@google/genai';
import type { ProviderWithModels, Model } from './types';
import { formatModelDisplayName } from './utils';

// Web Discovery Prompt Definition with explicit instruction to scan current free AI APIs and model routers
const DISCOVERY_PROMPT = `
You are an expert AI infrastructure analyst with live Google web search capability.
Perform deep real-time web search and analysis on the global landscape of AI model routers, unified API gateways, and cloud inference platforms that offer 100% FREE LLM APIs, developer free tiers, or 0$ token endpoints.

SEARCH & ANALYZE TARGETS:
1. Multi-Model Free AI Routers & Unified Gateways (similar to OrcaRouter & xKiro):
   - OrcaRouter (https://www.orcarouter.ai): Search verified free models like deepseek/deepseek-v4-flash-free, deepseek/deepseek-v4-pro-free, qwen/qwen3.8-27b-free. (external_url: https://www.orcarouter.ai/models/{model_id})
   - xKiro (https://xkiro.com): Search all free models at https://xkiro.com/dashboard/models?sort=recommended&price=free (mistralai/mistral-large-2512, minimax/minimax-m2.7, deepseek/deepseek-v4-pro, qwen/qwen3.8-max, xiaomi/mimo-v2.5-pro, deepseek/deepseek-v4-flash, qwen/qwen3.7-max, etc. NEVER include gpt-5.6-luna as it is paid).
   - OpenRouter (https://openrouter.ai): Search all 0$ models with ':free' suffix or free tier at https://openrouter.ai/models?max_price=0.
   - SiliconFlow / SiliconCloud (https://cloud.siliconflow.cn): Search free models with 0$ pricing like DeepSeek-V3, Qwen2.5-7B, GLM-4-9B-Chat.
   - Zhipu AI BigModel (https://bigmodel.cn): Search GLM-4-Flash permanently 100% free API.
   - AiHubMix & Infini-AI (https://cloud.infini-ai.com): Search free developer models.
2. Fast Free Cloud Inference Providers:
   - Google AI Studio (https://aistudio.google.com): gemini-3.7-flash, gemini-3.7-flash-thinking, gemini-3.1-flash-lite, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro, gemma-2-27b-it.
   - Groq (https://console.groq.com): llama-3.3-70b-versatile, deepseek-r1-distill-llama-70b, deepseek-r1-distill-qwen-32b, llama-3.1-8b-instant, gemma2-9b-it, whisper-large-v3.
   - Cerebras AI (https://inference.cerebras.ai): llama3.3-70b, llama3.1-8b, deepseek-r1-distill-llama-70b.
   - SambaNova Systems (https://cloud.sambanova.ai): Meta-Llama-3.3-70B-Instruct, DeepSeek-R1, Qwen2.5-Coder-32B-Instruct.
   - GitHub Models (https://github.com/marketplace/models): gpt-4o-mini, o3-mini, Phi-4, Meta-Llama-3.3-70B-Instruct.
   - Cloudflare Workers AI (https://developers.cloudflare.com/workers-ai/models): @cf/meta/llama-3.3-70b-instruct, @cf/deepseek-ai/deepseek-r1-distill-qwen-32b.
   - NVIDIA Build NIMs (https://build.nvidia.com): meta/llama-3.3-70b-instruct, deepseek-ai/deepseek-r1.

STRICT VALIDATION REQUIREMENTS:
1. 100% FREE ONLY: Include ONLY models that have $0.00 / 0$ input & output cost or an active permanent free tier. NEVER include paid-only models (e.g. gpt-5.6-luna is PAID, paid Claude or OpenAI tiers).
2. ACCURATE MODEL URL: Each model MUST have a real, valid "external_url" pointing to the provider's official model page or free models console.
3. CONTEXT WINDOW: Numerical integer token count (e.g. 131072 for 128k, 200000 for MiniMax, 262144 for 256k, 1048576 for 1M).
4. MODEL DISPLAY NAME: Hyphen-joined name without brackets (e.g., "DeepSeek-V4-Flash-Free", "Mistral-Large-2512", "Gemini-3.7-Flash").

Return ONLY a valid JSON object matching this schema:
{
  "discovered_providers": [
    {
      "name": "OrcaRouter",
      "slug": "orcarouter",
      "website": "https://www.orcarouter.ai",
      "signup_url": "https://www.orcarouter.ai/console/token",
      "logo_url": "https://www.orcarouter.ai/favicon.ico",
      "description": "Unified AI model routing and aggregation gateway with free tiers.",
      "is_free": true,
      "models": [
        {
          "model_api_id": "deepseek/deepseek-v4-flash-free",
          "name": "DeepSeek-V4-Flash-Free",
          "context_window": 131072,
          "is_free": true,
          "external_url": "https://www.orcarouter.ai/models/deepseek/deepseek-v4-flash-free",
          "rate_limit_per_minute": 30,
          "rate_limit_per_day": 2000,
          "multimodal": false,
          "category": "General LLM",
          "popularity_score": 99
        }
      ]
    }
  ]
}
`;

// Target dynamic candidate hierarchy - dynamically prioritized with newest Flash models
const DEFAULT_FLASH_CANDIDATES = [
  'gemini-flash-latest', // Official Google alias pointing directly to the latest production Flash model
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

let cachedFlashModels: { models: string[]; timestamp: number } | null = null;

/**
 * Dynamically queries Google Generative Language API to detect and rank
 * the absolute newest Gemini Flash models available in real-time.
 * Ensures the scanner is 100% future-proof as new Gemini Flash models are released.
 */
export async function getLatestGeminiFlashModels(): Promise<string[]> {
  const now = Date.now();
  if (cachedFlashModels && now - cachedFlashModels.timestamp < 10 * 60 * 1000) {
    return cachedFlashModels.models;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return DEFAULT_FLASH_CANDIDATES;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawModels: any[] = Array.isArray(data?.models) ? data.models : [];

      // Extract all Flash models supporting generateContent
      const discoveredFlash = rawModels
        .map((m) => (m.name || '').replace('models/', ''))
        .filter((id) => {
          const lower = id.toLowerCase();
          return (
            lower.includes('flash') &&
            !lower.includes('deprecated') &&
            !lower.includes('tuning') &&
            !lower.includes('embed')
          );
        });

      // Sort by version numbers (e.g. gemini-3.7 > gemini-3.5 > gemini-2.5)
      discoveredFlash.sort((a, b) => {
        const getVer = (name: string) => {
          const match = name.match(/gemini-(\d+(?:\.\d+)?)/i);
          return match ? parseFloat(match[1]) : 0;
        };
        const verA = getVer(a);
        const verB = getVer(b);
        if (verB !== verA) return verB - verA;
        // Prefer non-preview over preview, thinking over standard if same version
        return a.localeCompare(b);
      });

      // Build prioritized list: gemini-flash-latest, newest discovered versions, followed by defaults
      const combined = Array.from(
        new Set(['gemini-flash-latest', ...discoveredFlash, ...DEFAULT_FLASH_CANDIDATES])
      );

      cachedFlashModels = {
        models: combined,
        timestamp: now,
      };

      return combined;
    }
  } catch (err) {
    console.warn('[GeminiDiscovery] Flash model auto-discovery fallback:', err);
  }

  return DEFAULT_FLASH_CANDIDATES;
}

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

let cachedAiDiscovered: { providers: ProviderWithModels[]; timestamp: number } | null = null;

export async function discoverProvidersWithGemini(forceFresh = false): Promise<ProviderWithModels[]> {
  const now = Date.now();
  if (!forceFresh && cachedAiDiscovered && now - cachedAiDiscovered.timestamp < 15 * 60 * 1000) {
    return cachedAiDiscovered.providers;
  }

  const client = getGeminiClient();
  if (!client) {
    return cachedAiDiscovered?.providers || [];
  }

  let text: string | undefined;

  // Resolve prioritized fast candidate models (test at most 2 to avoid timeout)
  const candidateModels = (await getLatestGeminiFlashModels()).slice(0, 2);

  // Try candidate models with Google Search Grounding for live real-time coverage
  for (const modelName of candidateModels) {
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
    return cachedAiDiscovered?.providers || [];
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
          .filter((m: any) => {
            if (!m || !m.is_free || !m.model_api_id) return false;
            const lowerId = String(m.model_api_id).toLowerCase();
            const lowerName = String(m.name || '').toLowerCase();
            // STRICT EXCLUSION: exclude paid models (such as gpt-5.6-luna)
            if (
              lowerId.includes('gpt-5.6') ||
              lowerName.includes('gpt-5.6') ||
              lowerId.includes('luna') ||
              lowerName.includes('luna')
            ) {
              return false;
            }
            return true;
          })
          .map((m: any, idx: number) => {
            let modelUrl = m.external_url || p.website;
            const lowerSlug = p.slug.toLowerCase();
            const modelId = m.model_api_id;

            // Automatically resolve exact official model URLs
            if (lowerSlug.includes('orcarouter') || lowerSlug.includes('orca')) {
              modelUrl = `https://www.orcarouter.ai/models/${modelId}`;
            } else if (lowerSlug.includes('xkiro') || lowerSlug.includes('kiro')) {
              modelUrl = 'https://xkiro.com/dashboard/models?sort=recommended&price=free';
            } else if (lowerSlug.includes('openrouter')) {
              modelUrl = `https://openrouter.ai/${modelId}`;
            } else if (lowerSlug.includes('siliconflow') || lowerSlug.includes('siliconcloud')) {
              modelUrl = 'https://cloud.siliconflow.cn/models';
            } else if (lowerSlug.includes('zhipu') || lowerSlug.includes('bigmodel')) {
              modelUrl = 'https://bigmodel.cn/dev/api#glm-4-flash';
            } else if (lowerSlug.includes('groq')) {
              modelUrl = 'https://console.groq.com/docs/models';
            } else if (lowerSlug.includes('cerebras')) {
              modelUrl = 'https://inference.cerebras.ai';
            } else if (lowerSlug.includes('sambanova')) {
              modelUrl = 'https://cloud.sambanova.ai';
            } else if (lowerSlug.includes('github')) {
              modelUrl = 'https://github.com/marketplace/models';
            } else if (lowerSlug.includes('cloudflare')) {
              modelUrl = 'https://developers.cloudflare.com/workers-ai/models';
            } else if (lowerSlug.includes('google') || lowerSlug.includes('aistudio')) {
              modelUrl = 'https://aistudio.google.com';
            }

            return {
              id: `mod-${p.slug}-${idx + 1}-${m.model_api_id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
              provider_id: providerId,
              model_api_id: m.model_api_id,
              name: formatModelDisplayName(m.name || m.model_api_id),
              context_window: Number(m.context_window) || 128000,
              is_free: true,
              price_input_per_mtok: 0,
              price_output_per_mtok: 0,
              external_url: modelUrl,
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
            };
          });

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

    if (verifiedList.length > 0) {
      cachedAiDiscovered = {
        providers: verifiedList,
        timestamp: Date.now(),
      };
    }

    return verifiedList;
  } catch (err) {
    console.warn('[GeminiDiscovery] Failed to parse discovered providers payload:', err);
    return cachedAiDiscovered?.providers || [];
  }
}
