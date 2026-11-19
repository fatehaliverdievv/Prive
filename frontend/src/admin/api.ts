import { API, ApiError } from '../lib/api';

const TK = 'pt_admin_token';
export const auth = {
  get: () => localStorage.getItem(TK),
  set: (t: string) => localStorage.setItem(TK, t),
  clear: () => localStorage.removeItem(TK),
};

/** Authorized fetch; a 401 anywhere logs the admin out */
export async function adm<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  const t = auth.get();
  if (t) headers.Authorization = `Bearer ${t}`;
  let body = init.body;
  if (init.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(init.json); }
  let res: Response;
  try { res = await fetch(API + path, { ...init, headers, body }); }
  catch { throw new ApiError('Serverə qoşulmaq mümkün olmadı. Backend işləyir?', 0); }
  if (res.status === 401 && path !== '/auth/login') { auth.clear(); window.dispatchEvent(new Event('pt-logout')); }
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new ApiError(j.message || res.statusText, res.status, j.errors || {});
  }
  return res.json();
}

export async function uploadFiles(files: File[]): Promise<string[]> {
  const fd = new FormData();
  files.forEach((f) => fd.append('file', f));
  const r = await adm<{ urls: string[] }>('/upload', { method: 'POST', body: fd });
  return r.urls;
}

export const fmtDate = (d?: string | Date, withTime = false) => {
  if (!d) return '—';
  const x = new Date(d);
  const p = (n: number) => String(n).padStart(2, '0');
  const base = `${p(x.getDate())}.${p(x.getMonth() + 1)}.${x.getFullYear()}`;
  return withTime ? `${base} ${p(x.getHours())}:${p(x.getMinutes())}` : base;
};
export const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
export { ApiError };
