'use client';

import { getBrowserSupabase } from '@/lib/supabase';
import type { RealtimeStatus, RealtimeOptions, RealtimeHandle } from '@/lib/types';

const REFETCH_DEBOUNCE_MS = 800;
const POLL_FALLBACK_MS = 60_000;
const HEARTBEAT_TIMEOUT_MS = 45_000;

export function subscribeToProvidersAndModels(opts: RealtimeOptions): RealtimeHandle | null {
  const sb = getBrowserSupabase();
  if (!sb) {
    opts.onStatus?.('connected');
    return {
      stop: () => {},
      refetch: () => { opts.onChange(); },
    };
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let lastHeartbeat = Date.now();
  let isConnected = false;
  let activeChannel: ReturnType<typeof sb.channel> | null = null;

  const triggerRefetch = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { opts.onChange(); }, REFETCH_DEBOUNCE_MS);
  };

  const setStatus = (s: RealtimeStatus) => { opts.onStatus?.(s); };

  const createAndSubscribe = () => {
    if (activeChannel) { sb.removeChannel(activeChannel); activeChannel = null; }
    const topicName = `zerollm-realtime-${Date.now()}`;
    const ch = sb.channel(topicName, {
      config: { broadcast: { self: false }, presence: { key: '' } },
    });

    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => {
      lastHeartbeat = Date.now(); triggerRefetch();
    }).on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, () => {
      lastHeartbeat = Date.now(); triggerRefetch();
    });

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isConnected = true; lastHeartbeat = Date.now(); setStatus('connected');
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        isConnected = false; setStatus('disconnected'); startPollingFallback();
      } else { setStatus('connecting'); }
    });
    activeChannel = ch;
  };

  const startPollingFallback = () => {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
      if (isConnected && pollTimer) { clearInterval(pollTimer); pollTimer = null; return; }
      triggerRefetch();
    }, POLL_FALLBACK_MS);
  };

  createAndSubscribe();

  heartbeatTimer = setInterval(() => {
    if (!isConnected) return;
    if (Date.now() - lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
      isConnected = false; setStatus('disconnected'); createAndSubscribe();
    }
  }, HEARTBEAT_TIMEOUT_MS / 2);

  setStatus('connecting');

  return {
    stop: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (activeChannel) { sb.removeChannel(activeChannel); activeChannel = null; }
      setStatus('disconnected');
    },
    refetch: triggerRefetch,
  };
}
