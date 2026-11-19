import { useEffect, useState } from 'react';
import CrudPage from '../CrudPage';
import { adm, fmtDate } from '../api';
import { img } from '../../lib/api';
import type { L10n } from '../../i18n/dict';
import type { FieldDef } from '../fields';

const thumb = (src?: string) => (src ? <img className="a-thumb" src={img(src)} alt="" /> : <span className="a-thumb empty" />);
const two = (o?: L10n) => <><b>{o?.az || '—'}</b>{o?.en && <small className="muted">{o.en}</small>}</>;
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
const common: FieldDef[] = [
  { path: 'order', label: 'Sıra', type: 'number', min: 0, max: 9999, hint: 'Kiçik rəqəm əvvəldə görünür. Cədvəldəki ▲▼ ilə də dəyişə bilərsiniz.', wide: false },
  { path: 'published', label: 'Saytda göstər', type: 'bool' },
];

/* ───────── Destinations ───────── */
interface Dest { _id: string; slug: string; name: L10n; country: L10n; tagline: L10n; image: string; published?: boolean; order?: number }
export function Destinations() {
  const fields: FieldDef[] = [
    { path: 'name', label: 'Ad', type: 'text', bi: true, required: true, max: 80 },
    { path: 'slug', label: 'Slug (link)', type: 'slug', required: true, slugFrom: ['name.en', 'name.az'], hint: 'Ünvanda görünür: /destinations/slug. Yalnız kiçik latın hərfləri və tire.' },
    { path: 'country', label: 'Ölkə', type: 'text', bi: true, max: 80 },
    { path: 'tagline', label: 'Şüar', type: 'text', bi: true, max: 120 },
    { path: 'description', label: 'Təsvir', type: 'textarea', bi: true, max: 1500, rows: 4 },
    { path: 'image', label: 'Əsas şəkil', type: 'image' },
    { path: 'gallery', label: 'Qalereya', type: 'images' },
    ...common,
  ];
  return (
    <CrudPage<Dest> title="İstiqamətlər" sub="Ana səhifədəki halqada və istiqamətlər səhifəsində görünən məkanlar." noun="İstiqamət" endpoint="/destinations"
      fields={fields} name={(r) => r.name?.az || r.slug} viewUrl={(r) => `/az/destinations/${r.slug}`}
      defaults={{ slug: '', name: { az: '', en: '' }, country: { az: '', en: '' }, tagline: { az: '', en: '' }, description: { az: '', en: '' }, image: '', gallery: [], published: true, order: 0 }}
      columns={[{ label: 'Şəkil', render: (r) => thumb(r.image), cls: 'w-thumb' }, { label: 'Ad', render: (r) => two(r.name) }, { label: 'Şüar', render: (r) => <span className="muted">{r.tagline?.az}</span> }, { label: 'Slug', render: (r) => <code>{r.slug}</code> }]} />
  );
}

/* ───────── Hotels ───────── */
interface Hot { _id: string; slug: string; name: L10n; destinationSlug?: string; stars: number; image: string; published?: boolean; order?: number }
export function Hotels() {
  const [dest, setDest] = useState<Dest[]>([]);
  useEffect(() => { adm<Dest[]>('/destinations/admin/all').then(setDest).catch(() => {}); }, []);
  const fields: FieldDef[] = [
    { path: 'name', label: 'Ad', type: 'text', bi: true, required: true, max: 80 },
    { path: 'slug', label: 'Slug (link)', type: 'slug', required: true, slugFrom: ['name.en', 'name.az'] },
    { path: 'destinationSlug', label: 'İstiqamət', type: 'select', options: [{ value: '', label: '— Seçilməyib —' }, ...dest.map((d) => ({ value: d.slug, label: d.name?.az || d.slug }))], hint: 'Otel həmin istiqamətin səhifəsində görünəcək.' },
    { path: 'stars', label: 'Ulduz', type: 'number', required: true, min: 1, max: 5, wide: false },
    { path: 'description', label: 'Təsvir', type: 'textarea', bi: true, max: 1500, rows: 4 },
    { path: 'image', label: 'Əsas şəkil', type: 'image' },
    { path: 'gallery', label: 'Qalereya', type: 'images' },
    ...common,
  ];
  return (
    <CrudPage<Hot> title="Otellər" sub="Özlüyündə təcrübə olan qalma məkanları." noun="Otel" endpoint="/hotels" fields={fields} name={(r) => r.name?.az || r.slug}
      defaults={{ slug: '', name: { az: '', en: '' }, description: { az: '', en: '' }, destinationSlug: '', stars: 5, image: '', gallery: [], published: true, order: 0 }}
      columns={[{ label: 'Şəkil', render: (r) => thumb(r.image), cls: 'w-thumb' }, { label: 'Ad', render: (r) => two(r.name) }, { label: 'İstiqamət', render: (r) => <span className="muted">{dest.find((d) => d.slug === r.destinationSlug)?.name?.az || '—'}</span> }, { label: 'Ulduz', render: (r) => <span className="stars">{stars(r.stars)}</span> }]} />
  );
}

/* ───────── News ───────── */
interface Nws { _id: string; slug: string; title: L10n; image: string; date: string; published?: boolean; order?: number }
export function NewsPage() {
  const fields: FieldDef[] = [
    { path: 'title', label: 'Başlıq', type: 'text', bi: true, required: true, max: 160 },
    { path: 'slug', label: 'Slug (link)', type: 'slug', required: true, slugFrom: ['title.en', 'title.az'] },
    { path: 'date', label: 'Tarix', type: 'date', required: true, wide: false },
    { path: 'excerpt', label: 'Qısa mətn', type: 'textarea', bi: true, max: 400, rows: 3, hint: 'Siyahıda görünən xülasə.' },
    { path: 'content', label: 'Tam məzmun', type: 'textarea', bi: true, max: 10000, rows: 9 },
    { path: 'image', label: 'Şəkil', type: 'image' },
    { path: 'published', label: 'Saytda göstər', type: 'bool' },
  ];
  return (
    <CrudPage<Nws> title="Xəbərlər" sub="Səyahət dünyasından yeniliklər." noun="Xəbər" endpoint="/news" fields={fields} name={(r) => r.title?.az || r.slug}
      defaults={{ slug: '', title: { az: '', en: '' }, excerpt: { az: '', en: '' }, content: { az: '', en: '' }, image: '', date: '', published: true, order: 0 }}
      viewUrl={(r) => `/az/news/${r.slug}`}
      columns={[{ label: 'Şəkil', render: (r) => thumb(r.image), cls: 'w-thumb' }, { label: 'Başlıq', render: (r) => two(r.title) }, { label: 'Tarix', render: (r) => fmtDate(r.date) }]} />
  );
}

/* ───────── Experiences (home page gallery) ───────── */
interface Exp { _id: string; image: string; title: L10n; desc: L10n; published?: boolean; order?: number }
export function Experiences() {
  const fields: FieldDef[] = [
    { path: 'title', label: 'Başlıq', type: 'text', bi: true, required: true, max: 80 },
    { path: 'desc', label: 'Qısa təsvir', type: 'text', bi: true, max: 240 },
    { path: 'image', label: 'Şəkil', type: 'image', required: true, hint: 'Üfüqi (16:10) şəkillər ən yaxşı görünür.' },
    ...common,
  ];
  return (
    <CrudPage<Exp> title="Təcrübələr" sub="Ana səhifədəki “Hər detal dizayn olunub” üfüqi 3D qalereyası." noun="Kart" endpoint="/experiences" fields={fields} name={(r) => r.title?.az || 'Kart'}
      defaults={{ image: '', title: { az: '', en: '' }, desc: { az: '', en: '' }, published: true, order: 0 }}
      columns={[{ label: 'Şəkil', render: (r) => thumb(r.image), cls: 'w-thumb' }, { label: 'Başlıq', render: (r) => two(r.title) }, { label: 'Təsvir', render: (r) => <span className="muted">{r.desc?.az}</span> }]} />
  );
}

/* ───────── Agencies ───────── */
interface Agc { _id: string; name: string; city: L10n; address: L10n; phone: string; email: string; published?: boolean; order?: number }
export function Agencies() {
  const fields: FieldDef[] = [
    { path: 'name', label: 'Agentliyin adı', type: 'text', required: true, max: 100 },
    { path: 'city', label: 'Şəhər', type: 'text', bi: true, required: true, max: 60 },
    { path: 'address', label: 'Ünvan', type: 'text', bi: true, max: 200 },
    { path: 'phone', label: 'Telefon', type: 'tel', hint: 'Məs. +994 12 000 00 00' },
    { path: 'email', label: 'E-poçt', type: 'email' },
    ...common,
  ];
  return (
    <CrudPage<Agc> title="Agentliklər" sub="Ofislər və filiallar." noun="Agentlik" endpoint="/agencies" fields={fields} name={(r) => r.name}
      defaults={{ name: '', city: { az: '', en: '' }, address: { az: '', en: '' }, phone: '', email: '', published: true, order: 0 }}
      columns={[{ label: 'Ad', render: (r) => <b>{r.name}</b> }, { label: 'Şəhər', render: (r) => two(r.city) }, { label: 'Ünvan', render: (r) => <span className="muted">{r.address?.az}</span> }, { label: 'Əlaqə', render: (r) => <span className="muted">{r.phone}<br />{r.email}</span> }]} />
  );
}
