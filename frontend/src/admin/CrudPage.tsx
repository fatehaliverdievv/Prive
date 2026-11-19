import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { adm, ApiError } from './api';
import { Drawer, Empty, PageHead, Spinner, Switch, confirmDialog, toast } from './ui';
import { FormFields, getIn, validate, type FieldDef, type Values } from './fields';

export interface Col<T> { label: string; render: (r: T) => ReactNode; cls?: string }
interface Row { _id: string; published?: boolean; order?: number }
interface Props<T extends Row> {
  title: string; sub: string; noun: string; endpoint: string;
  fields: FieldDef[]; columns: Col<T>[]; defaults: Values;
  name: (r: T) => string; viewUrl?: (r: T) => string;
}

const clean = (row: Values, fields: FieldDef[]): Values => {
  const v = JSON.parse(JSON.stringify(row)) as Values;
  delete v.__v; delete v.createdAt; delete v.updatedAt;
  fields.filter((f) => f.type === 'date').forEach((f) => { const d = getIn(v, f.path); if (d) v[f.path] = String(d).slice(0, 10); });
  return v;
};

export default function CrudPage<T extends Row>({ title, sub, noun, endpoint, fields, columns, defaults, name, viewUrl }: Props<T>) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'on' | 'off'>('all');
  const [form, setForm] = useState<{ values: Values; initial: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => adm<T[]>(`${endpoint}/admin/all`).then(setRows).catch((e: ApiError) => { setRows([]); toast(e.message, 'err'); }), [endpoint]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (rows || []).filter((r) => {
    if (filter === 'on' && r.published === false) return false;
    if (filter === 'off' && r.published !== false) return false;
    return !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase());
  }), [rows, q, filter]);

  const open = (row?: T, copy = false) => {
    let values = row ? clean(row as unknown as Values, fields) : { ...JSON.parse(JSON.stringify(defaults)) };
    if (row && copy) {
      delete values._id;
      const s = fields.find((f) => f.type === 'slug'); if (s) values = { ...values, [s.path]: `${values[s.path]}-kopya` };
    }
    if (!row) { fields.filter((f) => f.type === 'date').forEach((f) => { if (!values[f.path]) values[f.path] = new Date().toISOString().slice(0, 10); }); values.order = (rows?.length || 0) + 1; }
    setErrors({}); setForm({ values, initial: JSON.stringify(values) });
  };
  const dirty = !!form && JSON.stringify(form.values) !== form.initial;
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: 'Dəyişikliklər saxlanılmayıb', text: 'Bağlasanız, etdiyiniz dəyişikliklər itəcək.', ok: 'Bağla', danger: true }))) return;
    setForm(null);
  };
  const change = (path: string, v: unknown) => {
    setForm((f) => {
      if (!f) return f;
      const next = JSON.parse(JSON.stringify(f.values)) as Values;
      const keys = path.split('.'); let o = next;
      keys.slice(0, -1).forEach((k) => { o[k] = o[k] || {}; o = o[k]; });
      o[keys[keys.length - 1]] = v;
      return { ...f, values: next };
    });
    setErrors((e) => { if (!e[path]) return e; const n = { ...e }; delete n[path]; return n; });
  };
  const focusFirst = (errs: Record<string, string>) => {
    const key = Object.keys(errs)[0]?.replace(/\.(az|en)$/, '');
    requestAnimationFrame(() => document.querySelector(`[data-field="${key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const save = async () => {
    if (!form) return;
    const errs = validate(fields, form.values);
    if (Object.keys(errs).length) { setErrors(errs); focusFirst(errs); return toast('Formda xətalar var, qırmızı sahələri düzəldin', 'err'); }
    const payload = JSON.parse(JSON.stringify(form.values)) as Values;
    fields.filter((f) => f.type === 'number').forEach((f) => { if (payload[f.path] !== undefined) payload[f.path] = Number(payload[f.path]); });
    const id = payload._id; delete payload._id;
    setSaving(true);
    try {
      await adm(id ? `${endpoint}/${id}` : endpoint, { method: id ? 'PUT' : 'POST', json: payload });
      toast(id ? 'Yadda saxlanıldı' : `${noun} əlavə olundu`);
      setForm(null); load();
    } catch (e) {
      const er = e as ApiError;
      if (Object.keys(er.errors).length) { setErrors(er.errors); focusFirst(er.errors); }
      toast(er.message, 'err');
    } finally { setSaving(false); }
  };

  const remove = async (r: T) => {
    if (!(await confirmDialog({ title: `“${name(r)}” silinsin?`, text: 'Bu əməliyyat geri qaytarılmır.', ok: 'Sil', danger: true }))) return;
    try { await adm(`${endpoint}/${r._id}`, { method: 'DELETE' }); toast('Silindi'); load(); } catch (e) { toast((e as ApiError).message, 'err'); }
  };
  const togglePub = async (r: T, v: boolean) => {
    setRows((s) => (s || []).map((x) => (x._id === r._id ? { ...x, published: v } : x)));
    try { await adm(`${endpoint}/${r._id}`, { method: 'PUT', json: { published: v } }); toast(v ? 'Sayta əlavə olundu' : 'Saytdan gizlədildi'); }
    catch (e) { toast((e as ApiError).message, 'err'); load(); }
  };
  const move = async (i: number, d: number) => {
    const list = [...(rows || [])]; const j = i + d; if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const changed = list.map((r, k) => ({ r, order: k + 1 })).filter((x) => x.r.order !== x.order);
    setRows(list.map((r, k) => ({ ...r, order: k + 1 })));
    try { await Promise.all(changed.map((x) => adm(`${endpoint}/${x.r._id}`, { method: 'PUT', json: { order: x.order } }))); } catch (e) { toast((e as ApiError).message, 'err'); load(); }
  };

  const canMove = !q && filter === 'all';
  return (
    <>
      <PageHead title={title} sub={sub} actions={<button className="a-btn primary" onClick={() => open()}>+ Yeni {noun.toLocaleLowerCase('az')}</button>} />
      <div className="a-bar">
        <input className="a-search" placeholder="Axtar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="a-seg">
          {([['all', 'Hamısı'], ['on', 'Saytda'], ['off', 'Gizli']] as const).map(([k, n]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{n}</button>)}
        </div>
        <span className="a-count-lbl">{shown.length} / {rows?.length ?? 0}</span>
      </div>

      {rows === null ? <Spinner /> : shown.length === 0 ? (
        <Empty>{rows.length ? 'Axtarışa uyğun nəticə yoxdur.' : <>Hələ heç nə yoxdur.<br /><button className="a-btn primary" style={{ marginTop: 16 }} onClick={() => open()}>İlk {noun.toLocaleLowerCase('az')}i əlavə et</button></>}</Empty>
      ) : (
        <div className="a-card flush">
          <table className="a-table">
            <thead><tr>{canMove && <th className="w-order" />}{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th>Saytda</th><th /></tr></thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r._id} className={r.published === false ? 'dim' : ''}>
                  {canMove && <td className="w-order"><button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yuxarı">▲</button><button onClick={() => move(i, 1)} disabled={i === shown.length - 1} aria-label="Aşağı">▼</button></td>}
                  {columns.map((c) => <td key={c.label} data-label={c.label} className={c.cls}>{c.render(r)}</td>)}
                  <td data-label="Saytda"><Switch checked={r.published !== false} onChange={(v) => togglePub(r, v)} label="Saytda göstər" /></td>
                  <td className="a-actions">
                    {viewUrl && <a className="a-link" href={viewUrl(r)} target="_blank" rel="noreferrer">Bax</a>}
                    <button className="a-link" onClick={() => open(r)}>Redaktə</button>
                    <button className="a-link" onClick={() => open(r, true)}>Kopyala</button>
                    <button className="a-link danger" onClick={() => remove(r)}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={!!form} onClose={close} title={form?.values._id ? `${noun} redaktəsi` : `Yeni ${noun.toLocaleLowerCase('az')}`}
        footer={<><span className="a-dirty">{dirty ? '● Saxlanılmamış dəyişiklik' : ''}</span><button className="a-btn ghost" onClick={close}>Ləğv et</button><button className="a-btn primary" onClick={save} disabled={saving}>{saving ? 'Saxlanılır…' : 'Yadda saxla'}</button></>}>
        {form && <FormFields fields={fields} values={form.values} errors={errors} onChange={change} />}
      </Drawer>
    </>
  );
}
