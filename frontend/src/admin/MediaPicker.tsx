import { useCallback, useEffect, useRef, useState } from 'react';
import { img } from '../lib/api';
import { adm, fmtSize, uploadFiles, ApiError } from './api';
import { Drawer, Spinner, toast } from './ui';

export interface MediaFile { name: string; url: string; size: number; date: string }

/** Images that ship with the site (public/images) */
const BUNDLED = ['hero', 'about', 'turkiye', 'maldives', 'thailand', 'seychelles', 'italy', 'uae', 'pool', 'transfer', 'journal', 'hotel-aegean', 'hotel-lagoon', 'hotel-orchid', 'news-new-resort', 'news-winter', 'news-flights'].map((n) => `/images/${n}.webp`);

export function useMedia() {
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const load = useCallback(() => adm<MediaFile[]>('/media').then(setFiles).catch((e: ApiError) => { setFiles([]); toast(e.message, 'err'); }), []);
  useEffect(() => { load(); }, [load]);
  return { files, load };
}

export function Dropzone({ onUploaded, compact }: { onUploaded: (urls: string[]) => void; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const go = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => /^image\/(jpeg|png|webp|gif|avif)$/.test(f.type));
    if (!files.length) return toast('Yalnız JPG, PNG, WEBP, GIF və ya AVIF şəkil seçin', 'err');
    if (files.some((f) => f.size > 8 * 1024 * 1024)) return toast('Şəkil 8 MB-dan böyük ola bilməz', 'err');
    setBusy(true);
    try { const urls = await uploadFiles(files); toast(`${urls.length} şəkil yükləndi`); onUploaded(urls); }
    catch (e) { toast((e as ApiError).message, 'err'); }
    finally { setBusy(false); }
  };
  return (
    <div className={`a-drop ${over ? 'over' : ''} ${compact ? 'compact' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); go(e.dataTransfer.files); }}>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple hidden onChange={(e) => e.target.files && go(e.target.files)} />
      {busy ? <Spinner /> : <><b>Şəkli bura atın</b><span>və ya</span><button type="button" className="a-btn primary sm" onClick={() => input.current?.click()}>Kompüterdən seç</button><small>JPG, PNG, WEBP · maks. 8 MB</small></>}
    </div>
  );
}

type Tab = 'lib' | 'site' | 'url';
export default function MediaPicker({ open, onClose, onPick, multiple }: { open: boolean; onClose: () => void; onPick: (urls: string[]) => void; multiple?: boolean }) {
  const { files, load } = useMedia();
  const [tab, setTab] = useState<Tab>('lib');
  const [sel, setSel] = useState<string[]>([]);
  const [url, setUrl] = useState('');
  const [urlErr, setUrlErr] = useState('');
  useEffect(() => { if (open) { setSel([]); setUrl(''); setUrlErr(''); load(); } }, [open, load]);
  const toggle = (u: string) => (multiple ? setSel((s) => (s.includes(u) ? s.filter((x) => x !== u) : [...s, u])) : onPick([u]));
  const useUrl = () => {
    if (!/^(\/images\/|\/uploads\/|https:\/\/)\S+$/.test(url.trim())) return setUrlErr('Link /images/, /uploads/ və ya https:// ilə başlamalıdır');
    onPick([url.trim()]);
  };
  const grid = (list: { url: string; label?: string }[]) => (
    <div className="a-grid">
      {list.map((f) => (
        <button type="button" key={f.url} className={`a-tile ${sel.includes(f.url) ? 'on' : ''}`} onClick={() => toggle(f.url)}>
          <img src={img(f.url)} alt="" loading="lazy" />{sel.includes(f.url) && <i>✓</i>}{f.label && <span>{f.label}</span>}
        </button>
      ))}
    </div>
  );
  return (
    <Drawer open={open} onClose={onClose} title="Şəkil seç" wide
      footer={multiple ? <><button className="a-btn ghost" onClick={onClose}>Ləğv et</button><button className="a-btn primary" disabled={!sel.length} onClick={() => onPick(sel)}>Əlavə et ({sel.length})</button></> : undefined}>
      <div className="a-tabs">
        {([['lib', 'Yüklənmişlər'], ['site', 'Sayt şəkilləri'], ['url', 'Link']] as [Tab, string][]).map(([k, n]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{n}</button>
        ))}
      </div>
      {tab === 'lib' && (
        <>
          <Dropzone compact onUploaded={(urls) => { load(); if (!multiple) onPick(urls); else setSel((s) => [...s, ...urls]); }} />
          {files === null ? <Spinner /> : files.length ? grid(files.map((f) => ({ url: f.url, label: fmtSize(f.size) }))) : <p className="a-hint">Hələ şəkil yüklənməyib.</p>}
        </>
      )}
      {tab === 'site' && grid(BUNDLED.map((u) => ({ url: u, label: u.replace('/images/', '') })))}
      {tab === 'url' && (
        <div className="a-field">
          <label><span>Şəkil linki</span></label>
          <input value={url} onChange={(e) => { setUrl(e.target.value); setUrlErr(''); }} placeholder="https://… və ya /images/ad.webp" className={urlErr ? 'bad' : ''} />
          {urlErr && <p className="a-err">{urlErr}</p>}
          <button className="a-btn primary" style={{ marginTop: 12 }} onClick={useUrl}>İstifadə et</button>
        </div>
      )}
    </Drawer>
  );
}
