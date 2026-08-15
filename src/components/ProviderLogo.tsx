'use client';

import React, { useState } from 'react';
import { getInitials, getProviderColor } from '@/lib/utils';

interface ProviderLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Custom vector SVG logos for top AI Providers (renders instantly & 100% reliable)
function getProviderVectorLogo(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes('google') || lower.includes('gemini')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z"
          fill="url(#geminiGrad)"
        />
        <defs>
          <linearGradient id="geminiGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4285F4" />
            <stop offset="0.3" stopColor="#9B51E0" />
            <stop offset="0.7" stopColor="#E91E63" />
            <stop offset="1" stopColor="#FFC107" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (lower.includes('groq')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#F04438" />
        <path d="M7 7H17V11H11V13H17V17H7V7Z" fill="white" />
      </svg>
    );
  }

  if (lower.includes('openrouter')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#6366F1" />
        <circle cx="7" cy="12" r="2.5" fill="white" />
        <circle cx="17" cy="7" r="2.5" fill="white" />
        <circle cx="17" cy="17" r="2.5" fill="white" />
        <path d="M7 12L17 7M7 12L17 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (lower.includes('cerebras')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#E11D48" />
        <path d="M6 6H18V18H6V6Z" stroke="white" strokeWidth="2" strokeDasharray="3 2" />
        <circle cx="12" cy="12" r="3" fill="white" />
      </svg>
    );
  }

  if (lower.includes('sambanova')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#0284C7" />
        <path d="M6 16C9 16 10 8 18 8" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <path d="M6 8C14 8 15 16 18 16" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (lower.includes('hugging')) {
    return (
      <div className="w-full h-full flex items-center justify-center text-base leading-none select-none">
        🤗
      </div>
    );
  }

  if (lower.includes('nvidia')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#10B981" />
        <path d="M6 15C6 10 10 7 15 7C17 7 18 8 18 8M6 11C6 9 9 8 12 8M6 17H18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (lower.includes('deepseek')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#2563EB" />
        <path d="M5 14C8 10 14 9 19 12C19 16 15 18 10 18C7 18 5 16 5 14Z" fill="white" />
        <circle cx="15" cy="12" r="1" fill="#2563EB" />
      </svg>
    );
  }

  if (lower.includes('mistral')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#F97316" />
        <path d="M6 6H9V18H6V6ZM11 6H14V18H11V6ZM16 6H19V18H16V6Z" fill="white" />
      </svg>
    );
  }

  if (lower.includes('meta') || lower.includes('llama')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#06B6D4" />
        <path d="M6 12C6 9.5 8 8 10 8C12 8 13.5 10 14.5 12C15.5 14 17 16 19 16C21 16 22 14.5 22 12C22 9.5 20 8 18 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (lower.includes('anthropic') || lower.includes('claude')) {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#D97706" />
        <path d="M12 5L15 18H13.2L12.2 13.5H9.8L8.8 18H7L10 5H12ZM11.8 12L11 8.5L10.2 12H11.8Z" fill="white" />
      </svg>
    );
  }

  return null;
}

export function ProviderLogo({ name, logoUrl, size = 'md', className = '' }: ProviderLogoProps) {
  const [error, setError] = useState(false);

  const dimensions = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-11 h-11 text-xs',
    lg: 'w-14 h-14 text-sm',
  }[size];

  const initials = getInitials(name);
  const color = getProviderColor(name);
  const vectorLogo = getProviderVectorLogo(name);

  // If we have a custom vector logo and either no URL or image failed to load, use vector logo!
  if (vectorLogo && (error || !logoUrl)) {
    return (
      <div
        className={`${dimensions} flex-shrink-0 rounded-xl border border-black/10 dark:border-white/15 p-1 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-md ${className}`}
      >
        {vectorLogo}
      </div>
    );
  }

  // If logoUrl is provided and hasn't errored
  if (logoUrl && !error) {
    return (
      <div
        className={`${dimensions} flex-shrink-0 rounded-xl border border-black/10 dark:border-white/15 p-1.5 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-md ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-110"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Fallback: Gradient avatar with crisp initials
  return (
    <div
      className={`${dimensions} flex-shrink-0 rounded-xl border border-white/20 flex items-center justify-center font-black text-white shadow-md tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
      }}
    >
      {initials}
    </div>
  );
}
