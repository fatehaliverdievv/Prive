import { useSyncExternalStore } from 'react';
import { api } from './api';
import type { L10n } from '../i18n/dict';

/** Everything the admin panel can change on the public site: settings, text overrides, experience cards. */
export interface SiteSettings {
  phone: string; email: string; whatsapp: string; instagram: string; facebook: string; address: L10n;
  heroImage: string; portalImage: string; aboutImage: string;
  stats: { countries: number; hotels: number; guests: number; years: number };
  seoTitle: L10n; seoDescription: L10n;
}
export interface Experience { _id: string; image: string; title: L10n; desc: L10n }
type TextMap = Record<string, { az: string; en: string }>;

export const DEFAULT_SETTINGS: SiteSettings = {
  phone: '+994 12 000 00 00', email: 'hello@privedmc.az', whatsapp: '', instagram: '', facebook: '', address: {},
  heroImage: '/images/hero.webp', portalImage: '/images/uae.webp', aboutImage: '/images/about.webp',
  stats: { countries: 24, hotels: 320, guests: 18500, years: 12 }, seoTitle: {}, seoDescription: {},
};

export const DEFAULT_EXPERIENCES: Experience[] = [
  { _id: 'e1', image: '/images/transfer.webp', title: { az: 'Qapıdan qapıya transfer', en: 'Door-to-door transfers' }, desc: { az: 'Klassik avtomobillər və şəxsi sürücü.', en: 'Classic cars and a private driver.' } },
  { _id: 'e2', image: '/images/pool.webp', title: { az: 'Özəl qalma məkanları', en: 'Private stays' }, desc: { az: 'Dənizə baxan hovuzlar, sakit səhərlər.', en: 'Sea-view pools and quiet mornings.' } },
  { _id: 'e3', image: '/images/journal.webp', title: { az: 'Yavaş səyahət', en: 'Slow travel' }, desc: { az: 'Limon, qəzet və heç bir plan.', en: 'Lemons, a newspaper and no plan.' } },
  { _id: 'e4', image: '/images/italy.webp', title: { az: 'Suyun üstündə', en: 'On the water' }, desc: { az: 'Taxta katerlə göl sahili.', en: 'A lakeshore by wooden speedboat.' } },
];

interface State { settings: Partial<SiteSettings> | null; texts: TextMap; experiences: Experience[] | null }
const KEY = 'pt_content_v2';
const read = (): State => {
  try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j) return j; } catch { /* ignore */ }
  return { settings: null, texts: {}, experiences: null };
};

let state: State = read();
const subs = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage may be unavailable */ }
  subs.forEach((f) => f());
};

/** Called once at startup; the cached copy renders instantly, fresh data replaces it when it arrives */
export function loadContent() {
  api<Partial<SiteSettings>>('/settings').then((settings) => set({ settings })).catch(() => {});
  api<TextMap>('/texts').then((texts) => set({ texts })).catch(() => {});
  api<Experience[]>('/experiences').then((experiences) => Array.isArray(experiences) && set({ experiences })).catch(() => {});
}

const useStore = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => state);

export const useTexts = () => useStore().texts;

/** Settings merged over the defaults; empty values fall back to the default */
export function useSettings(): SiteSettings {
  const s = useStore().settings as Partial<SiteSettings> | null;
  if (!s) return DEFAULT_SETTINGS;
  const pick = <K extends 'heroImage' | 'portalImage' | 'aboutImage'>(k: K) => (s[k] as string) || DEFAULT_SETTINGS[k];
  return {
    ...DEFAULT_SETTINGS, ...s,
    phone: s.phone || DEFAULT_SETTINGS.phone, email: s.email || DEFAULT_SETTINGS.email,
    heroImage: pick('heroImage'), portalImage: pick('portalImage'), aboutImage: pick('aboutImage'),
    stats: { ...DEFAULT_SETTINGS.stats, ...(s.stats || {}) },
  };
}

export function useExperiences(): Experience[] {
  const e = useStore().experiences;
  return e && e.length ? e : DEFAULT_EXPERIENCES;
}
