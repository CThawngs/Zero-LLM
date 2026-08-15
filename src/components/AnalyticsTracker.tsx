'use client';

import { useEffect, useRef } from 'react';
import { trackPageView } from '@/lib/track';

export function AnalyticsTracker() {
  const isTracked = useRef(false);

  useEffect(() => {
    if (isTracked.current) return;
    isTracked.current = true;
    trackPageView();
  }, []);

  return null;
}
