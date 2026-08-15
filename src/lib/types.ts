export interface Provider {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  signup_url: string | null;
  api_key_guide: string | null;
  logo_url: string | null;
  description: string | null;
  is_free: boolean;
  discovered_via: string | null;
  source_repo: string | null;
  status: 'active' | 'deprecated' | 'archived';
  last_checked_at: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  models?: Model[];
}

export interface Model {
  id: string;
  provider_id: string;
  model_api_id: string;
  name: string;
  context_window: number | null;
  is_free: boolean;
  price_input_per_mtok: number | null;
  price_output_per_mtok: number | null;
  external_url: string | null;
  rate_limit_per_minute: number | null;
  rate_limit_per_day: number | null;
  multimodal: boolean;
  category: string | null;
  popularity_score: number;
  discovered_via: string | null;
  status: 'active' | 'deprecated' | 'archived';
  last_checked_at: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderWithModels extends Provider {
  models: Model[];
}

export interface FlatModel {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_slug: string;
  provider_logo_url: string | null;
  provider_is_free: boolean;
  model_api_id: string;
  name: string;
  context_window: number | null;
  is_free: boolean;
  price_input_per_mtok: number | null;
  price_output_per_mtok: number | null;
  external_url: string | null;
  rate_limit_per_minute: number | null;
  rate_limit_per_day: number | null;
  multimodal: boolean;
  category: string | null;
  popularity_score: number;
  status: string;
  verified_at?: string | null;
  created_at?: string | null;
  last_checked_at?: string | null;
}

export interface FilterState {
  search: string;
  provider: string | null;
  is_free: boolean | null;
  category: string | null;
  sort_by: 'context_window' | 'name' | 'popularity' | 'price_input' | 'price_output';
  sort_order: 'asc' | 'desc';
}

export const DEFAULT_FILTER: FilterState = {
  search: '',
  provider: null,
  is_free: null,
  category: null,
  sort_by: 'context_window',
  sort_order: 'desc',
};

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface RealtimeOptions {
  onChange: () => void | Promise<void>;
  onStatus?: (status: RealtimeStatus) => void;
}

export interface RealtimeHandle {
  stop: () => void;
  refetch: () => void;
}

export type AllowedEvent = 'page_view' | 'signup' | 'cta_click' | 'pricing_view';

export interface AnalyticsPayload {
  event_type: AllowedEvent;
  ref?: string;
}

export interface ZeroInvoiceResponse {
  data: { counted: boolean } | null;
  error: string | null;
}
