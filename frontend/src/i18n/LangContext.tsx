import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dict, type Key, type Lang, type L10n } from './dict';
import { useTexts } from '../lib/content';

interface Ctx {
  lang: Lang;
  t: (k: Key) => string;
  /** pick the current-language value from a bilingual object */
  l: (o?: L10n) => string;
  /** build a language-prefixed path */
  to: (p?: string) => string;
  switchTo: (l: Lang) => void;
}

const LangCtx = createContext<Ctx>(null!);
export const useLang = () => useContext(LangCtx);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const nav = useNavigate();
  const { pathname, search } = useLocation();
  const texts = useTexts();
  const value = useMemo<Ctx>(() => ({
    lang,
    t: (k) => texts[k]?.[lang] || dict[lang][k] || k,
    l: (o) => (o && (o[lang] || o.en || o.az)) || '',
    to: (p = '') => `/${lang}${p}`,
    switchTo: (next) => {
      localStorage.setItem('pt_lang', next);
      nav(pathname.replace(/^\/(az|en)/, `/${next}`) + search);
    },
  }), [lang, nav, pathname, search, texts]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const defaultLang = (): Lang => {
  const saved = localStorage.getItem('pt_lang');
  if (saved === 'az' || saved === 'en') return saved;
  return navigator.language?.toLowerCase().startsWith('az') ? 'az' : 'en';
};
