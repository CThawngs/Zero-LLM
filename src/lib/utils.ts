import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return 'N/A';
  return new Intl.NumberFormat().format(num);
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || amount === 0) return '$0.00';
  return `$${amount.toFixed(4)}`;
}

export function formatContextWindow(tokens: number | null | undefined): string {
  if (tokens == null || tokens === 0) return 'N/A';
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    const k = tokens / 1_000;
    return `${k % 1 === 0 ? k : k.toFixed(0)}K`;
  }
  return `${tokens}`;
}

export function truncate(text: string | null | undefined, length: number): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '…';
}

export function getInitials(name: string): string {
  if (!name) return 'LLM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getProviderColor(name: string): string {
  const colors = [
    '#C4A484', '#A8927A', '#8F9779', '#829AB1', 
    '#B197B3', '#D08770', '#88C0D0', '#B48EAD'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export type ModelCategoryKey = 'Text' | 'Vision' | 'Audio' | 'Speech' | 'Video';

export interface ModelCategoryInfo {
  key: ModelCategoryKey;
  labelEn: string;
  labelVi: string;
  badgeClass: string;
}

export function getModelCategoryInfo(model: {
  category?: string | null;
  name?: string | null;
  model_api_id?: string | null;
  multimodal?: boolean;
}): ModelCategoryInfo {
  const cat = (model.category || '').toLowerCase();
  const name = (model.name || '').toLowerCase();
  const apiId = (model.model_api_id || '').toLowerCase();
  const fullText = `${cat} ${name} ${apiId}`;

  // 1. SPEECH (Text-to-Speech / Voice Synthesis)
  if (
    /\b(tts|text-to-speech|voice|speech-synthesis|elevenlabs|xtts|vits|piper|chattts|cosyvoice|kokoro)\b/i.test(fullText) ||
    cat.includes('speech') ||
    cat.includes('tts')
  ) {
    return {
      key: 'Speech',
      labelEn: 'Speech',
      labelVi: 'Speech (Giọng nói)',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    };
  }

  // 2. AUDIO (Audio / Speech-to-Text / Music / Sound)
  if (
    /\b(whisper|audio|music|sound|bark|sensevoice|funasr|seamless|melo|asr|speech-to-text)\b/i.test(fullText) ||
    cat.includes('audio') ||
    cat.includes('asr')
  ) {
    return {
      key: 'Audio',
      labelEn: 'Audio',
      labelVi: 'Audio (Âm thanh)',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    };
  }

  // 3. VIDEO (Video Generation / Understanding)
  if (
    /\b(video|sora|runway|pika|kling|cogvideo|animatediff|ltx|hunyuanvideo)\b/i.test(fullText) ||
    cat.includes('video')
  ) {
    return {
      key: 'Video',
      labelEn: 'Video',
      labelVi: 'Video',
      badgeClass: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
    };
  }

  // 4. VISION (Multimodal / Vision / Image understanding)
  // Must be genuinely vision-capable models (e.g. Vision Instruct, VL, Pixtral, LLaVA, GPT-4o, Gemini Flash/Pro, Claude 3, etc.)
  const isVisionKeyword =
    /\b(vision|pixtral|llava|internvl|qwen-vl|qwen2-vl|qwen2.5-vl|minicpm-v|florence|bakllava|moondream|clip|ocr|image-to-text)\b/i.test(fullText) ||
    /-vl\b/i.test(apiId) ||
    /-vl-/i.test(apiId) ||
    /\bvision\b/i.test(name) ||
    /\bvision\b/i.test(apiId);

  const isKnownMultimodalFamily =
    /gpt-4o|gpt-4-turbo|gemini-1\.5|gemini-2\.0|gemini-2\.5|gemini-3\.|claude-3/i.test(apiId) ||
    /gpt-4o|gpt-4-turbo|gemini 1\.5|gemini 2\.0|gemini 2\.5|gemini 3\.|claude 3/i.test(name);

  // If text-only indicators are present (e.g. DeepSeek R1, Llama 3.3 text, Qwen Coder, Gemma, Mistral Nemo), prioritize Text
  const isExplicitlyTextOnly =
    /\b(coder|code|deepseek-r1|deepseek-v3|llama-3\.3|llama-3\.1|llama-3-8b|llama-3-70b|gemma-2|mistral-nemo|mistral-small|mistral-large|codestral|starcoder|math|reasoning|instruct)\b/i.test(apiId) &&
    !isVisionKeyword;

  if (!isExplicitlyTextOnly && (isVisionKeyword || (model.multimodal && (cat.includes('vision') || cat.includes('multimodal') || isKnownMultimodalFamily)))) {
    return {
      key: 'Vision',
      labelEn: 'Vision',
      labelVi: 'Vision (Thị giác)',
      badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    };
  }

  // 5. TEXT (Default for all LLMs: Chat, Reasoning, Code, Math, Instruction, General)
  return {
    key: 'Text',
    labelEn: 'Text',
    labelVi: 'Text (Văn bản)',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  };
}

/**
 * Intelligent fuzzy and multi-token search matching for models and providers.
 * Supports tokenized search (e.g. "gemini 3.7", "llama 3.3", "deepseek r1", "3.7 flash")
 * ignoring case, hyphens, colons, underscores, and slashes.
 */
export function normalizeSearchString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[-_/:,.]+/g, ' ') // convert punctuation to spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesSearchQuery(
  rawQuery: string | null | undefined,
  fields: (string | null | undefined | boolean | number)[]
): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;

  const cleanQuery = normalizeSearchString(rawQuery);
  if (!cleanQuery) return true;

  // Split query into tokens
  const queryTokens = cleanQuery.split(' ').filter(Boolean);

  // Combine all searchable field contents into one normalized corpus
  const joinedText = fields
    .filter((f) => f != null)
    .map((f) => String(f))
    .join(' ');

  const normalizedCorpus = normalizeSearchString(joinedText);
  const rawCorpusLower = joinedText.toLowerCase();

  // Also create a continuous alphanumeric version (e.g. "gemini3.7flash" / "llama3.3")
  const compactCorpus = normalizedCorpus.replace(/\s+/g, '');
  const compactQuery = cleanQuery.replace(/\s+/g, '');

  // If compact query directly exists in compact corpus (e.g. "gemini3.7" in "gemini37flash")
  if (compactCorpus.includes(compactQuery)) {
    return true;
  }

  // Every token in the search query must appear in the corpus
  return queryTokens.every((token) => {
    const compactToken = token.replace(/\s+/g, '');
    return (
      normalizedCorpus.includes(token) ||
      rawCorpusLower.includes(token) ||
      compactCorpus.includes(compactToken)
    );
  });
}

/**
 * Canonical provider mappings to eliminate duplicate cards
 * (e.g. "cloudflare", "cloudflare-workers", "cloudflare-workers-ai" -> "cloudflare-workers-ai")
 */
export function getCanonicalProviderInfo(name: string, slug?: string): { canonicalSlug: string; canonicalName: string } {
  const norm = (name + ' ' + (slug || '')).toLowerCase();
  
  if (norm.includes('orcarouter') || norm.includes('orca-router') || slug === 'orcarouter') {
    return { canonicalSlug: 'orcarouter', canonicalName: 'OrcaRouter' };
  }
  if (norm.includes('xkiro') || norm.includes('kiro-ai') || slug === 'xkiro') {
    return { canonicalSlug: 'xkiro', canonicalName: 'xKiro' };
  }
  if (norm.includes('zhipu') || norm.includes('bigmodel') || norm.includes('glm-4-flash')) {
    return { canonicalSlug: 'zhipu-ai', canonicalName: 'Zhipu AI (BigModel)' };
  }
  if (norm.includes('infini') || norm.includes('infinigence')) {
    return { canonicalSlug: 'infini-ai', canonicalName: 'Infini-AI (Infinigence)' };
  }
  if (norm.includes('aihubmix')) {
    return { canonicalSlug: 'aihubmix', canonicalName: 'AiHubMix' };
  }
  if (norm.includes('cloudflare')) {
    return { canonicalSlug: 'cloudflare-workers-ai', canonicalName: 'Cloudflare Workers AI' };
  }
  if (norm.includes('cerebras')) {
    return { canonicalSlug: 'cerebras', canonicalName: 'Cerebras AI' };
  }
  if (
    norm.includes('google') &&
    (norm.includes('ai studio') || norm.includes('studio') || norm.includes('gemini') || slug === 'google-ai' || slug === 'google-aistudio')
  ) {
    return { canonicalSlug: 'google-aistudio', canonicalName: 'Google AI Studio' };
  }
  if (norm.includes('siliconflow') || norm.includes('siliconcloud')) {
    return { canonicalSlug: 'siliconflow', canonicalName: 'SiliconFlow (SiliconCloud)' };
  }
  if (norm.includes('sambanova')) {
    return { canonicalSlug: 'sambanova', canonicalName: 'SambaNova Systems' };
  }
  if (norm.includes('nvidia') && (norm.includes('nim') || norm.includes('build'))) {
    return { canonicalSlug: 'nvidia-nim', canonicalName: 'NVIDIA Build NIMs' };
  }
  if (norm.includes('hugging') && norm.includes('face')) {
    return { canonicalSlug: 'huggingface', canonicalName: 'Hugging Face Inference API' };
  }
  if (norm.includes('mistral')) {
    return { canonicalSlug: 'mistral', canonicalName: 'Mistral AI (La Plateforme)' };
  }
  if (norm.includes('github')) {
    return { canonicalSlug: 'github-models', canonicalName: 'GitHub Models' };
  }
  if (norm.includes('openrouter')) {
    return { canonicalSlug: 'openrouter', canonicalName: 'OpenRouter' };
  }
  if (norm.includes('groq')) {
    return { canonicalSlug: 'groq', canonicalName: 'Groq' };
  }
  if (norm.includes('deepinfra')) {
    return { canonicalSlug: 'deepinfra', canonicalName: 'DeepInfra' };
  }
  if (norm.includes('cohere')) {
    return { canonicalSlug: 'cohere', canonicalName: 'Cohere' };
  }
  if (norm.includes('fireworks')) {
    return { canonicalSlug: 'fireworks-ai', canonicalName: 'Fireworks AI' };
  }
  if (norm.includes('together')) {
    return { canonicalSlug: 'together-ai', canonicalName: 'Together AI' };
  }

  const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return { canonicalSlug: cleanSlug, canonicalName: name };
}

/**
 * Deduplicates and merges multiple provider records with identical canonical identities.
 */
export function deduplicateAndMergeProviders<T extends { id: string; name: string; slug: string; logo_url?: string | null; description?: string | null; signup_url?: string | null; website?: string | null; api_key_guide?: string | null; models: any[] }>(
  providers: T[]
): T[] {
  const map = new Map<string, T>();

  for (const prov of providers) {
    if (!prov) continue;
    const { canonicalSlug, canonicalName } = getCanonicalProviderInfo(prov.name, prov.slug);
    const key = canonicalSlug;

    if (!map.has(key)) {
      map.set(key, {
        ...prov,
        name: canonicalName,
        slug: canonicalSlug,
        models: [...(prov.models || [])],
      });
    } else {
      const existing = map.get(key)!;
      // Merge models, avoiding duplicate model_api_id
      const existingModelIds = new Set((existing.models || []).map((m: any) => String(m.model_api_id || m.name).toLowerCase()));
      const mergedModels = [...(existing.models || [])];

      for (const m of prov.models || []) {
        const idKey = String(m.model_api_id || m.name).toLowerCase();
        if (!existingModelIds.has(idKey)) {
          existingModelIds.add(idKey);
          mergedModels.push({
            ...m,
            provider_id: existing.id,
          });
        }
      }

      map.set(key, {
        ...existing,
        // Prefer valid non-empty and higher quality fields
        logo_url: existing.logo_url || prov.logo_url,
        description: (existing.description && existing.description.length > (prov.description?.length || 0))
          ? existing.description
          : (prov.description || existing.description),
        signup_url: existing.signup_url || prov.signup_url,
        website: existing.website || prov.website,
        api_key_guide: existing.api_key_guide || prov.api_key_guide,
        models: mergedModels,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Cleans and formats model display name:
 * 1. Removes all parentheses `(...)`, brackets `[...]`, `{...}` along with their inner contents.
 * 2. Preserves casing (upper/lower case as provided by provider).
 * 3. Replaces spaces and underscores with hyphens `-` (no spaces allowed).
 * 4. Cleans redundant hyphens/spaces and trims ends.
 */
export function formatModelDisplayName(rawName: string | null | undefined): string {
  if (!rawName) return '';

  // 1. Remove all parentheses, brackets, curly braces and their inner content
  let cleaned = rawName
    .replace(/\([^()]*\)/g, '')
    .replace(/\[[^[\]]*\]/g, '')
    .replace(/\{[^{}]*\}/g, '');

  // Second pass in case of remaining or adjacent brackets
  cleaned = cleaned
    .replace(/\([^()]*\)/g, '')
    .replace(/\[[^[\]]*\]/g, '')
    .replace(/\{[^{}]*\}/g, '')
    .replace(/[()[\]{}]/g, ''); // strip any dangling bracket chars

  // 2. Normalize and replace spaces, underscores, multiple hyphens with a single hyphen
  cleaned = cleaned
    .trim()
    .replace(/[\s_]+/g, '-') // spaces and underscores to hyphens
    .replace(/-+/g, '-')     // collapse multiple consecutive hyphens
    .replace(/^[-:/. ]+|[-:/. ]+$/g, ''); // trim leading/trailing hyphens/colons/slashes/dots

  return cleaned || rawName.trim().replace(/\s+/g, '-');
}

