'use client';

import type { AllowedEvent } from './types';

// Helper: lấy path hiện tại
function getCurrentPath(): string {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname + window.location.search;
}

// Helper: gửi POST đến proxy /api/analytics (fire-and-forget, never block UI)
function sendToAnalytics(body: Record<string, unknown>): void {
  try {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true, // Quan trọng: đảm bảo request hoàn thành ngay cả khi user rời trang
    }).catch(() => {
      // Silent fail — tracking không bao giờ được làm crash app
    });
  } catch {
    // Silent fail
  }
}

// HÀM CHÍNH: Gọi CẢ HAI visit + event khi page load
export function trackPageView(): void {
  const path = getCurrentPath();
  const referrer = typeof document !== 'undefined' ? document.referrer : '';

  // 1. Gửi visit (anonymous) → tăng Visits + Unique Visitors trên dashboard Traffic
  sendToAnalytics({
    type: 'visit',
    path: path,
    referrer: referrer,
  });

  // 2. Gửi event (Bearer) → log page_view vào tracking_events
  sendToAnalytics({
    event_type: 'page_view',
    ref: path,
  });
}

// CTA click tracking
export function trackCtaClick(ref?: string): void {
  sendToAnalytics({
    event_type: 'cta_click',
    ref: ref || getCurrentPath(),
  });
}

// Pricing view tracking
export function trackPricingView(): void {
  sendToAnalytics({
    event_type: 'pricing_view',
    ref: getCurrentPath(),
  });
}

// Signup tracking
export function trackSignup(): void {
  sendToAnalytics({
    event_type: 'signup',
    ref: getCurrentPath(),
  });
}

// Backward-compatible track function
export function track(event: AllowedEvent | string, ref?: string): void {
  sendToAnalytics({
    event_type: event,
    ref: ref || getCurrentPath(),
  });
}

