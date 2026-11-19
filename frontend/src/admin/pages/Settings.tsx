import { useEffect, useState } from 'react';
import { adm, ApiError } from '../api';
import { FormFields, validate, type FieldDef, type Values } from '../fields';
import { PageHead, Spinner, toast } from '../ui';

const fields: FieldDef[] = [
  { path: 'h1', label: 'Əlaqə məlumatları', type: 'heading' },
  { path: 'phone', label: 'Telefon', type: 'tel', required: true, hint: 'Footer-də göstərilir və zəng linki olur.' },
  { path: 'email', label: 'E-poçt', type: 'email', required: true },
  { path: 'address', label: 'Ünvan', type: 'text', bi: true, max: 300 },
  { path: 'h2', label: 'Sosial şəbəkələr', type: 'heading' },
  { path: 'instagram', label: 'Instagram linki', type: 'url', placeholder: 'https://instagram.com/…' },
  { path: 'facebook', label: 'Facebook linki', type: 'url', placeholder: 'https://facebook.com/…' },
  { path: 'whatsapp', label: 'WhatsApp nömrəsi', type: 'tel', hint: 'Beynəlxalq formatda: +994 50 000 00 00' },
  { path: 'h3', label: 'Ana səhifə statistikası', type: 'heading' },
  { path: 'stats.countries', label: 'Ölkə', type: 'number', min: 0, max: 999, wide: false },
  { path: 'stats.hotels', label: 'Tərəfdaş otel', type: 'number', min: 0, max: 99999, wide: false },
  { path: 'stats.guests', label: 'Məmnun səyyah', type: 'number', min: 0, max: 9999999, wide: false },
  { path: 'stats.years', label: 'İllik təcrübə', type: 'number', min: 0, max: 200, wide: false },
  { path: 'h4', label: 'Əsas şəkillər', type: 'heading' },
  { path: 'heroImage', label: 'Ana ekran (hero) şəkli', type: 'image', hint: 'WebGL effektləri bu şəkil üzərində işləyir. Geniş (3:2) və yüksək keyfiyyətli olsun.' },
  { path: 'portalImage', label: 'Qapı (portal) şəkli', type: 'image' },
  { path: 'aboutImage', label: '“Şirkət haqqında” şəkli', type: 'image' },
  { path: 'h5', label: 'SEO (axtarış sistemləri)', type: 'heading' },
  { path: 'seoTitle', label: 'Səhifə başlığı', type: 'text', bi: true, max: 70, hint: 'Brauzer tabında görünür. Boş qalsa “Privé DMC”.' },
  { path: 'seoDescription', label: 'Qısa təsvir', type: 'textarea', bi: true, max: 200, rows: 2 },
];

export default function Settings() {
  const [values, setValues] = useState<Values | null>(null);
  const [initial, setInitial] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adm<Values>('/settings').then((s) => {
      const v = JSON.parse(JSON.stringify(s)) as Values;
      ['_id', '__v', 'key', 'createdAt', 'updatedAt'].forEach((k) => delete v[k]);
      ['address', 'seoTitle', 'seoDescription'].forEach((k) => { v[k] = { az: '', en: '', ...(v[k] || {}) }; });
      setValues(v); setInitial(JSON.stringify(v));
    }).catch((e: ApiError) => toast(e.message, 'err'));
  }, []);

  const dirty = !!values && JSON.stringify(values) !== initial;
  const change = (path: string, val: unknown) => {
    setValues((s) => {
      const n = JSON.parse(JSON.stringify(s)) as Values; const ks = path.split('.'); let o = n;
      ks.slice(0, -1).forEach((k) => { o[k] = o[k] || {}; o = o[k]; }); o[ks[ks.length - 1]] = val; return n;
    });
    setErrors((e) => { if (!e[path]) return e; const n = { ...e }; delete n[path]; return n; });
  };
  const save = async () => {
    if (!values) return;
    const errs = validate(fields, values);
    if (Object.keys(errs).length) {
      setErrors(errs); toast('Formda xətalar var', 'err');
      requestAnimationFrame(() => document.querySelector(`[data-field="${Object.keys(errs)[0].replace(/\.(az|en)$/, '')}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    const p = JSON.parse(JSON.stringify(values)) as Values;
    Object.keys(p.stats).forEach((k) => { p.stats[k] = Number(p.stats[k]); });
    setSaving(true);
    try { await adm('/settings', { method: 'PUT', json: p }); setInitial(JSON.stringify(values)); toast('Ayarlar saxlanıldı'); }
    catch (e) { const er = e as ApiError; setErrors(er.errors); toast(er.message, 'err'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <PageHead title="Sayt ayarları" sub="Əlaqə, sosial şəbəkələr, statistika, əsas şəkillər və SEO." actions={<button className="a-btn primary" onClick={save} disabled={!dirty || saving}>{saving ? 'Saxlanılır…' : 'Yadda saxla'}</button>} />
      {!values ? <Spinner /> : <div className="a-card pad narrow"><FormFields fields={fields} values={values} errors={errors} onChange={change} /></div>}
    </>
  );
}
