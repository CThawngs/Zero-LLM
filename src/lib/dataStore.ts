import type { ProviderWithModels, FlatModel } from './types';
import { INITIAL_PROVIDERS } from './mockData';

// Global singleton cache in Node.js runtime
declare global {
  // eslint-disable-next-line no-var
  var __ZEROLLM_CACHE__: {
    providers: ProviderWithModels[];
    lastScannedAt: string;
    scanCount: number;
  } | undefined;
}

function initializeCache() {
  if (!global.__ZEROLLM_CACHE__) {
    const timestamp = new Date().toISOString();
    global.__ZEROLLM_CACHE__ = {
      providers: JSON.parse(JSON.stringify(INITIAL_PROVIDERS)),
      lastScannedAt: timestamp,
      scanCount: 0,
    };
  }
  return global.__ZEROLLM_CACHE__;
}

export function getCachedProviders(): ProviderWithModels[] {
  const cache = initializeCache();
  return cache.providers;
}

export function updateCachedProviders(
  newProviders: ProviderWithModels[],
  timestamp: string
): void {
  const cache = initializeCache();
  cache.providers = newProviders;
  cache.lastScannedAt = timestamp;
  cache.scanCount += 1;
}

export function getLastScannedTimestamp(): string {
  const cache = initializeCache();
  return cache.lastScannedAt;
}
