import { useRef, useState, type ReactNode } from 'react';
import { img } from '../lib/api';
import { Switch } from './ui';
import MediaPicker from './MediaPicker';

export type FieldType = 'text' | 'textarea' | 'number' | 'bool' | 'image' | 'images' | 'date' | 'select' | 'slug' | 'tel' | 'email' | 'url' | 'heading';
export interface FieldDef {
  path: string; label: string; type: FieldType;
  bi?: boolean; required?: boolean; max?: number; min?: number; int?: boolean; rows?: number;
  hint?: string; placeholder?: string; options?: { value: string; label: string }[];
  slugFrom?: string[]; wide?: boolean;
}
export type Values = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/* ───────── path helpers ───────── */
export const getIn = (o: Values, path: string) => path.split('.').reduce<any>((a, k) => (a == null ? a : a[k]), o); // eslint-disable-line @typescript-eslint/no-explicit-any
export function setIn(o: Values, path: string, v: unknown): Values {
  const [h, ...rest] = path.split('.');
  return { ...o, [h]: rest.length ? setIn((o[h] as Values) || {}, rest.join('.'), v) : v };
}

const AZ: Record<string, string> = { ə: 'e', ı: 'i', ö: 'o', ü: 'u', ç: 'c', ş: 's', ğ: 'g', İ: 'i', Ə: 'e', Ö: 'o', Ü: 'u', Ç: 'c', Ş: 's', Ğ: 'g' };
export const slugify = (s: string) => s.replace(/[əıöüçşğİƏÖÜÇŞĞ]/g, (c) => AZ[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const RX = { email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, tel: /^\+?[0-9 ()\-]{7,20}$/, url: /^https:\/\/[^\s]+\.[^\s]+$/, slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ };

/** Same rules as the server (backend/src/validators.js) so errors show instantly, before saving */
export function validate(fields: FieldDef[], values: Values): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === 'heading' || f.type === 'bool') continue;
    const check = (key: string, raw: unknown, label: string, req: boolean) => {
      if (f.type === 'images') {
        const a = (raw as string[]) || [];
        if (a.length > 12) errs[key] = 'Qalereyada ən çox 12 şəkil ola bilər';
        return;
      }
      const v = raw == null ? '' : String(raw).trim();
      if (!v) { if (req) errs[key] = `${label} boş ola bilməz`; return; }
      if (f.type === 'number') {
        const n = Number(v);
        if (Number.isNaN(n)) errs[key] = `${label} rəqəm olmalıdır`;
        else if (f.int !== false && !Number.isInteger(n)) errs[key] = `${label} tam ədəd olmalıdır`;
        else if (f.min != null && n < f.min) errs[key] = `${label} ən azı ${f.min} olmalıdır`;
        else if (f.max != null && n > f.max) errs[key] = `${label} ən çox ${f.max} ola bilər`;
        return;
      }
      if (f.max && v.length > f.max) errs[key] = `${label} ən çox ${f.max} simvol ola bilər`;
      else if (f.type === 'email' && !RX.email.test(v)) errs[key] = 'E-poçt düzgün deyil';
      else if (f.type === 'tel' && !RX.tel.test(v)) errs[key] = 'Telefon düzgün deyil (məs. +994 12 000 00 00)';
      else if (f.type === 'url' && !RX.url.test(v)) errs[key] = 'Link https:// ilə başlamalıdır';
      else if (f.type === 'slug' && !RX.slug.test(v)) errs[key] = 'Yalnız kiçik latın hərfləri, rəqəmlər və tire (-)';
      else if (f.type === 'slug' && v.length < 2) errs[key] = 'Slug ən azı 2 simvol olmalıdır';
      else if (f.type === 'date' && Number.isNaN(Date.parse(v))) errs[key] = 'Tarix düzgün deyil';
      else if (f.type === 'image' && !/^(\/images\/|\/uploads\/|https:\/\/)/.test(v)) errs[key] = 'Şəkil yolu düzgün deyil';
    };
    if (f.bi) {
      check(`${f.path}.az`, getIn(values, `${f.path}.az`), `${f.label} (AZ)`, !!f.required);
      check(`${f.path}.en`, getIn(values, `${f.path}.en`), `${f.label} (EN)`, false);
    } else check(f.path, getIn(values, f.path), f.label, !!f.required);
  }
  return errs;
}

/* ───────── rendering ───────── */
function Wrap({ f, err, children, count }: { f: FieldDef; err?: string; children: ReactNode; count?: ReactNode }) {
  return (
    <div className={`a-field ${err ? 'has-err' : ''} ${f.wide === false ? 'half' : ''}`} data-field={f.path}>
      <label><span>{f.label}{f.required && <b> *</b>}</span>{count}</label>
      {children}
      {err ? <p className="a-err">{err}</p> : f.hint ? <p className="a-hint">{f.hint}</p> : null}
    </div>
  );
}

function Input({ f, value, onChange, invalid, lang }: { f: FieldDef; value: string; onChange: (v: string) => void; invalid: boolean; lang?: string }) {
  const common = { value: value ?? '', onChange: (e: { target: { value: string } }) => onChange(e.target.value), className: invalid ? 'bad' : '', placeholder: f.placeholder, 'aria-invalid': invalid };
  const inner = f.type === 'textarea'
    ? <textarea rows={f.rows || 4} {...common} />
    : <input {...common} type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
        inputMode={f.type === 'number' ? 'numeric' : undefined} autoComplete="off" spellCheck={f.type === 'text'} />;
  return lang ? <div className="a-bi"><em>{lang}</em>{inner}</div> : inner;
}

const Counter = ({ v, max }: { v: string; max?: number }) => (max && (v || '').length >= max * 0.6 ? <small className={`a-count ${(v || '').length > max ? 'over' : ''}`}>{(v || '').length}/{max}</small> : null);

function ImageField({ f, value, onChange, err }: { f: FieldDef; value: string; onChange: (v: string) => void; err?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Wrap f={f} err={err}>
      <div className="a-img">
        <button type="button" className={`a-img__box ${err ? 'bad' : ''}`} onClick={() => setOpen(true)}>
          {value ? <img src={img(value)} alt="" /> : <span>+ Şəkil seç</span>}
        </button>
        <div className="a-img__act">
          <button type="button" className="a-btn ghost sm" onClick={() => setOpen(true)}>{value ? 'Dəyiş' : 'Seç / yüklə'}</button>
          {value && <button type="button" className="a-btn ghost sm" onClick={() => onChange('')}>Sil</button>}
          {value && <code>{value.length > 38 ? '…' + value.slice(-36) : value}</code>}
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(u) => { onChange(u[0]); setOpen(false); }} />
    </Wrap>
  );
}

function GalleryField({ f, value, onChange, err }: { f: FieldDef; value: string[]; onChange: (v: string[]) => void; err?: string }) {
  const [open, setOpen] = useState(false);
  const list = value || [];
  const move = (i: number, d: number) => { const a = [...list]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <Wrap f={f} err={err} count={<small className="a-count">{list.length}/12</small>}>
      <div className="a-gal">
        {list.map((u, i) => (
          <div key={u + i} className="a-gal__it">
            <img src={img(u)} alt="" />
            <div><button type="button" onClick={() => move(i, -1)} aria-label="Sola">‹</button><button type="button" onClick={() => move(i, 1)} aria-label="Sağa">›</button><button type="button" onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label="Sil">×</button></div>
          </div>
        ))}
        {list.length < 12 && <button type="button" className="a-gal__add" onClick={() => setOpen(true)}>+</button>}
      </div>
      <MediaPicker open={open} multiple onClose={() => setOpen(false)} onPick={(u) => { onChange([...list, ...u].slice(0, 12)); setOpen(false); }} />
    </Wrap>
  );
}

export function FormFields({ fields, values, errors, onChange }: { fields: FieldDef[]; values: Values; errors: Record<string, string>; onChange: (path: string, v: unknown) => void }) {
  const slugTouched = useRef(false);
  const slugField = fields.find((f) => f.type === 'slug');
  const change = (path: string, v: unknown) => {
    onChange(path, v);
    if (slugField?.slugFrom && !slugTouched.current && !values._id && slugField.slugFrom.includes(path)) {
      const src = slugField.slugFrom.map((p) => (p === path ? String(v) : String(getIn(values, p) || ''))).find(Boolean) || '';
      onChange(slugField.path, slugify(src));
    }
    if (path === slugField?.path) slugTouched.current = true;
  };
  return (
    <div className="a-form">
      {fields.map((f) => {
        if (f.type === 'heading') return <h3 key={f.path} className="a-sec">{f.label}</h3>;
        if (f.type === 'image') return <ImageField key={f.path} f={f} value={getIn(values, f.path)} onChange={(v) => change(f.path, v)} err={errors[f.path]} />;
        if (f.type === 'images') return <GalleryField key={f.path} f={f} value={getIn(values, f.path)} onChange={(v) => change(f.path, v)} err={errors[f.path]} />;
        if (f.type === 'bool') {
          return (
            <div key={f.path} className="a-field row" data-field={f.path}>
              <label><span>{f.label}</span></label>
              <Switch checked={!!getIn(values, f.path)} onChange={(v) => change(f.path, v)} label={f.label} />
              {f.hint && <p className="a-hint">{f.hint}</p>}
            </div>
          );
        }
        if (f.type === 'select') {
          return (
            <Wrap key={f.path} f={f} err={errors[f.path]}>
              <select value={getIn(values, f.path) ?? ''} onChange={(e) => change(f.path, e.target.value)} className={errors[f.path] ? 'bad' : ''}>
                {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Wrap>
          );
        }
        if (f.bi) {
          return (
            <Wrap key={f.path} f={f} err={errors[`${f.path}.az`] || errors[`${f.path}.en`]}>
              {(['az', 'en'] as const).map((lg) => (
                <div key={lg}>
                  <Input f={f} lang={lg.toUpperCase()} value={getIn(values, `${f.path}.${lg}`)} onChange={(v) => change(`${f.path}.${lg}`, v)} invalid={!!errors[`${f.path}.${lg}`]} />
                  {f.max && <Counter v={getIn(values, `${f.path}.${lg}`)} max={f.max} />}
                </div>
              ))}
            </Wrap>
          );
        }
        const v = getIn(values, f.path);
        return (
          <Wrap key={f.path} f={f} err={errors[f.path]} count={f.type !== 'number' ? <Counter v={String(v ?? '')} max={f.max} /> : null}>
            <Input f={f} value={v == null ? '' : String(v)} onChange={(x) => change(f.path, f.type === 'number' ? (x === '' ? '' : x) : x)} invalid={!!errors[f.path]} />
          </Wrap>
        );
      })}
    </div>
  );
}
