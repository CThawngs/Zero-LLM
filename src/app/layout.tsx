import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LocaleProvider } from '@/components/LocaleProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';

export const metadata: Metadata = {
  title: 'Zero LLM — Free LLM Providers & Models Realtime Directory (Updated by Gemini Flash)',
  description: 'Comprehensive directory aggregating AI providers offering free LLM models on the market, updated in real time by Google Gemini Flash.',
  keywords: ['LLM', 'Free LLM API', 'Free LLM Providers', 'Groq', 'OpenRouter', 'Google AI Studio', 'DeepSeek', 'Llama 3.3', 'Gemini Flash'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300 antialiased" suppressHydrationWarning>
        <AnalyticsTracker />
        <ThemeProvider>
          <LocaleProvider>
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
                {children}
              </main>
              <Footer />
            </div>
            <ScrollToTop />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

