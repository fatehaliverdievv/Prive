export const API = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message: string, public status = 0, public errors: Record<string, string> = {}) { super(message); }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new ApiError(j.message || res.statusText, res.status, j.errors || {});
  }
  return res.json();
}

/** Resolve image paths (public assets stay as-is, uploads go through the proxy / API host) */
export const img = (src?: string) => {
  if (!src) return '/images/hero.webp';
  if (/^https?:/.test(src)) return src;
  if (src.startsWith('/uploads') && import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '') + src;
  return src;
};
