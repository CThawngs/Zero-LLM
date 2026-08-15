'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import enMessages from '@/messages/en.json';
import viMessages from '@/messages/vi.json';

type Locale = 'vi' | 'en';

interface LocaleContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (keyPath: string) => string;
}

const messagesMap: Record<Locale, any> = {
  vi: viMessages,
  en: enMessages,
};

const LocaleContext = createContext<LocaleContextType>({
  locale: 'vi',
  setLocale: () => {},
  t: (keyPath: string) => keyPath,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('vi');

  useEffect(() => {
    const saved = localStorage.getItem('zerollm-locale') as Locale;
    if (saved === 'en' || saved === 'vi') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    localStorage.setItem('zerollm-locale', loc);
  };

  const t = (keyPath: string): string => {
    const parts = keyPath.split('.');
    let current: any = messagesMap[locale] || viMessages;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to English if key missing in VI
        let fallback: any = enMessages;
        for (const fp of parts) {
          if (fallback && typeof fallback === 'object' && fp in fallback) {
            fallback = fallback[fp];
          } else {
            return keyPath;
          }
        }
        return typeof fallback === 'string' ? fallback : keyPath;
      }
    }
    return typeof current === 'string' ? current : keyPath;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
