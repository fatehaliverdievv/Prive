import { useEffect, useMemo, useState } from 'react';
import { dict } from '../../i18n/dict';
import { adm, ApiError } from '../api';
import { Empty, PageHead, Spinner, confirmDialog, toast } from '../ui';

type Pair = { az: string; en: string };
const GROUPS: Record<string, string> = {
  nav: 'Menyu', hero: 'Ana ekran', portal: 'Qapı bölməsi', show: 'Halqa (istiqamətlər)', dest: 'İstiqamət siyahısı', exp: 'Təcrübələr başlığı',
  stats: 'Statistika', hotels: 'Otellər', news: 'Xəbərlər', contact: 'Əlaqə bölməsi', form: 'Form sahələri', detail: 'Detal səhifələri',
  about: 'Şirkət haqqında', agencies: 'Agentliklər', footer: 'Footer', common: 'Ümumi',
};
const MAX = 1500;
const KEYS = Object.keys(dict.az) as (keyof typeof dict.az)[];

export default function Texts() {
  const [over, setOver] = useState<Record<string, Pair> | null>(null);
  const [edit, setEdit] = useState<Record<string, Pair>>({});
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { adm<Record<string, Pair>>('/texts').then(setOver).catch((e: ApiError) => { setOver({}); toast(e.message, 'err'); }); }, []);

  const def = (k: string): Pair => ({ az: dict.az[k as keyof typeof dict.az], en: dict.en[k as keyof typeof dict.en] });
  const eff = (k: string): Pair => edit[k] || { az: over?.[k]?.az || def(k).az, en: over?.[k]?.en || def(k).en };
  const saved = (k: string): Pair => ({ az: over?.[k]?.az || def(k).az, en: over?.[k]?.en || def(k).en });
  const isDirty = (k: string) => !!edit[k] && (edit[k].az !== saved(k).az || edit[k].en !== saved(k).en);
  const tooLong = (k: string) => eff(k).az.length > MAX || eff(k).en.length > MAX;
  const dirtyKeys = KEYS.filter(isDirty);

  const rows = useMemo(() => KEYS.filter((k) => {
    if (group !== 'all' && k.split('.')[0] !== group) return false;
    if (!q) return true;
    const s = `${k} ${dict.az[k]} ${dict.en[k]} ${over?.[k]?.az || ''} ${over?.[k]?.en || ''}`.toLowerCase();
    return s.includes(q.toLowerCase());
  }), [q, group, over]);

  const set = (k: string, lang: 'az' | 'en', v: string) => setEdit((s) => ({ ...s, [k]: { ...eff(k), [lang]: v } }));

  const saveOne = async (k: string) => {
    const v = eff(k);
    if (!v.az.trim() || !v.en.trim()) return toast('Hər iki dildə mətn yazın (boş saxlamaq üçün “Əsas mətnə qayıt” düyməsini istifadə edin)', 'err');
    if (tooLong(k)) return toast(`Mətn ən çox ${MAX} simvol ola bilər`, 'err');
    setBusy(k);
    try {
      const d = def(k);
      if (v.az === d.az && v.en === d.en) await adm(`/texts/${k}`, { method: 'DELETE' });
      else await adm(`/texts/${k}`, { method: 'PUT', json: v });
      setOver((s) => { const n = { ...(s || {}) }; if (v.az === d.az && v.en === d.en) delete n[k]; else n[k] = v; return n; });
      setEdit((s) => { const n = { ...s }; delete n[k]; return n; });
      return true;
    } catch (e) { toast((e as ApiError).message, 'err'); return false; }
    finally { setBusy(null); }
  };
  const reset = async (k: string) => {
    if (!(await confirmDialog({ title: 'Əsas mətnə qaytarılsın?', text: 'Bu mətn üçün etdiyiniz dəyişiklik silinəcək.', ok: 'Qaytar' }))) return;
    try {
      await adm(`/texts/${k}`, { method: 'DELETE' });
      setOver((s) => { const n = { ...(s || {}) }; delete n[k]; return n; });
      setEdit((s) => { const n = { ...s }; delete n[k]; return n; });
      toast('Əsas mətn bərpa olundu');
    } catch (e) { toast((e as ApiError).message, 'err'); }
  };
  const saveAll = async () => {
    for (const k of dirtyKeys) { if (!(await saveOne(k))) return; }
    toast(`${dirtyKeys.length} mətn saxlanıldı`);
  };

  return (
    <>
      <PageHead title="Sayt mətnləri" sub="Saytdakı bütün başlıq və yazılar. Dəyişiklik AZ və EN versiyalara ayrıca tətbiq olunur." />
      <div className="a-bar">
        <input className="a-search" placeholder="Mətn və ya açar axtar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="a-select" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="all">Bütün bölmələr</option>
          {Object.entries(GROUPS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <span className="a-count-lbl">{Object.keys(over || {}).length} dəyişdirilib</span>
      </div>

      {over === null ? <Spinner /> : rows.length === 0 ? <Empty>Nəticə tapılmadı.</Empty> : (
        <div className="a-texts">
          {rows.map((k) => {
            const v = eff(k), changed = !!over[k], d = isDirty(k);
            return (
              <article key={k} className={`a-text ${d ? 'dirty' : ''}`}>
                <header>
                  <code>{k}</code><span>{GROUPS[k.split('.')[0]] || ''}</span>
                  {changed && <em>dəyişdirilib</em>}
                  <div>
                    {changed && <button className="a-link" onClick={() => reset(k)}>Əsas mətnə qayıt</button>}
                    <button className="a-btn primary sm" disabled={!d || busy === k} onClick={() => saveOne(k)}>{busy === k ? '…' : 'Saxla'}</button>
                  </div>
                </header>
                <div className="a-text__cols">
                  {(['az', 'en'] as const).map((lg) => (
                    <div key={lg} className={`a-bi ${v[lg].length > MAX || !v[lg].trim() ? 'bad' : ''}`}>
                      <em>{lg.toUpperCase()}</em>
                      <textarea rows={Math.min(6, Math.max(1, Math.ceil(v[lg].length / 55)))} value={v[lg]} onChange={(e) => set(k, lg, e.target.value)} className={!v[lg].trim() || v[lg].length > MAX ? 'bad' : ''} />
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dirtyKeys.length > 0 && (
        <div className="a-savebar"><span>{dirtyKeys.length} saxlanılmamış dəyişiklik</span>
          <button className="a-btn ghost" onClick={() => setEdit({})}>Ləğv et</button><button className="a-btn primary" onClick={saveAll}>Hamısını saxla</button></div>
      )}
    </>
  );
}
