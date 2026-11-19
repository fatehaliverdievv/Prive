import { z } from 'zod';

/* ───────── small building blocks (messages are shown to the admin as-is) ───────── */
const text = (max, { min = 0, label = 'Sahə' } = {}) =>
  z.string({ invalid_type_error: `${label} mətn olmalıdır` }).trim()
    .min(min, `${label} boş ola bilməz`).max(max, `${label} ən çox ${max} simvol ola bilər`);

/** Bilingual { az, en } — Azerbaijani is mandatory when `required`, English is always optional */
const L = (max, { required = false, label = 'Sahə' } = {}) =>
  z.object({
    az: text(max, { min: required ? 1 : 0, label: `${label} (AZ)` }).default(''),
    en: text(max, { label: `${label} (EN)` }).default(''),
  }).default({ az: '', en: '' });

export const slug = z.string().trim().min(2, 'Slug ən azı 2 simvol olmalıdır').max(80, 'Slug çox uzundur')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug yalnız kiçik latın hərfləri, rəqəmlər və tire (-) ola bilər');

const image = z.string().trim().max(500)
  .refine((v) => v === '' || /^(\/images\/|\/uploads\/|https:\/\/)/.test(v), 'Şəkil yolu /images/, /uploads/ və ya https:// ilə başlamalıdır')
  .default('');

const order = z.coerce.number({ invalid_type_error: 'Sıra rəqəm olmalıdır' }).int('Sıra tam ədəd olmalıdır').min(0, 'Sıra 0-dan kiçik ola bilməz').max(9999, 'Sıra çox böyükdür').default(0);
const published = z.boolean().default(true);
const phone = z.string().trim().max(30).refine((v) => v === '' || /^\+?[0-9 ()\-]{7,20}$/.test(v), 'Telefon düzgün deyil (məs. +994 12 000 00 00)').default('');
const email = z.string().trim().max(160).refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), 'E-poçt düzgün deyil').default('');
const url = z.string().trim().max(300).refine((v) => v === '' || /^https:\/\/[^\s]+\.[^\s]+$/.test(v), 'Link https:// ilə başlamalıdır').default('');
const gallery = z.array(image.refine((v) => v !== '', 'Boş şəkil')).max(12, 'Qalereyada ən çox 12 şəkil ola bilər').default([]);

/* ───────── resources ───────── */
export const schemas = {
  destinations: z.object({
    slug, name: L(80, { required: true, label: 'Ad' }), country: L(80, { label: 'Ölkə' }), tagline: L(120, { label: 'Şüar' }),
    description: L(1500, { label: 'Təsvir' }), image, gallery, published, order,
  }),
  hotels: z.object({
    slug, name: L(80, { required: true, label: 'Ad' }), description: L(1500, { label: 'Təsvir' }),
    destinationSlug: z.string().trim().max(80).default(''), stars: z.coerce.number().int().min(1, 'Ulduz 1-5 arası olmalıdır').max(5, 'Ulduz 1-5 arası olmalıdır').default(5),
    image, gallery, published, order,
  }),
  news: z.object({
    slug, title: L(160, { required: true, label: 'Başlıq' }), excerpt: L(400, { label: 'Qısa mətn' }), content: L(10000, { label: 'Məzmun' }),
    image, date: z.coerce.date({ invalid_type_error: 'Tarix düzgün deyil' }).default(() => new Date()), published, order,
  }),
  agencies: z.object({
    name: text(100, { min: 1, label: 'Ad' }), city: L(60, { required: true, label: 'Şəhər' }), address: L(200, { label: 'Ünvan' }),
    phone, email, published, order,
  }),
  experiences: z.object({
    image: image.refine((v) => v !== '', 'Şəkil mütləqdir'), title: L(80, { required: true, label: 'Başlıq' }), desc: L(240, { label: 'Təsvir' }), published, order,
  }),
};

export const settingsSchema = z.object({
  phone, email, whatsapp: phone, instagram: url, facebook: url, address: L(300, { label: 'Ünvan' }),
  heroImage: image, portalImage: image, aboutImage: image,
  stats: z.object({
    countries: z.coerce.number().int().min(0).max(999).default(0), hotels: z.coerce.number().int().min(0).max(99999).default(0),
    guests: z.coerce.number().int().min(0).max(9999999).default(0), years: z.coerce.number().int().min(0).max(200).default(0),
  }).default({}),
  seoTitle: L(70, { label: 'SEO başlıq' }), seoDescription: L(200, { label: 'SEO təsvir' }),
}).partial();

export const textOverride = z.object({
  az: text(1500, { label: 'AZ mətn' }), en: text(1500, { label: 'EN mətn' }),
});
export const textKey = z.string().regex(/^[a-zA-Z0-9._-]{1,60}$/, 'Açar düzgün deyil');

export const passwordRule = z.string().min(8, 'Parol ən azı 8 simvol olmalıdır').max(100)
  .regex(/[A-Za-z]/, 'Parolda ən azı bir hərf olmalıdır').regex(/[0-9]/, 'Parolda ən azı bir rəqəm olmalıdır');
export const adminCreate = z.object({
  name: text(80, { min: 2, label: 'Ad' }), email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'E-poçt düzgün deyil'), password: passwordRule,
});
export const inquiryCreate = z.object({
  name: text(120, { min: 2, label: 'Ad' }), phone, email,
  message: text(2000, { label: 'Mesaj' }).default(''),
}).refine((v) => v.phone || v.email, { message: 'Telefon və ya e-poçt yazın', path: ['phone'] });
export const inquiryPatch = z.object({ read: z.boolean().optional(), note: text(1000, { label: 'Qeyd' }).optional() });

/** Turns a ZodError into { message, errors: { "name.az": "..." } } */
export function parse(schema, data) {
  const r = schema.safeParse(data ?? {});
  if (r.success) return { data: r.data };
  const errors = {};
  r.error.issues.forEach((i) => { const k = i.path.join('.') || '_'; if (!errors[k]) errors[k] = i.message; });
  return { errors, message: Object.values(errors)[0] };
}
