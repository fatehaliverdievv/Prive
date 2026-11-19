import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import crud from './crud.js';
import { Destination, Hotel, News, Agency, Experience, Inquiry, Admin, Settings, TextOverride } from '../models/index.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { schemas, settingsSchema, textOverride, textKey, passwordRule, adminCreate, inquiryCreate, inquiryPatch, parse } from '../validators.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const api = Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
const bad = (res, v) => res.status(400).json({ message: v.message, errors: v.errors });

/** Tiny in-memory rate limiter (per IP): slows brute force and form spam */
const limiter = (max, windowMs, message) => {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now(), arr = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ message });
    arr.push(now); hits.set(req.ip, arr);
    if (hits.size > 5000) hits.clear();
    next();
  };
};
const loginLimit = limiter(10, 15 * 60 * 1000, 'Çox cəhd edildi. 15 dəqiqə sonra yenidən yoxlayın.');
const inquiryLimit = limiter(6, 60 * 60 * 1000, 'Çox sorğu göndərildi. Bir az sonra yenidən yoxlayın.');

// ───────── Auth ─────────
api.post('/auth/login', loginLimit, wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase(), password = String(req.body?.password || '');
  const admin = await Admin.findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.password))) return res.status(401).json({ message: 'E-poçt və ya parol yanlışdır' });
  res.json({ token: signToken(admin._id), email: admin.email, name: admin.name });
}));
api.get('/auth/me', requireAuth, wrap(async (req, res) => {
  const a = await Admin.findById(req.admin.id).lean();
  res.json({ id: a._id, email: a.email, name: a.name });
}));
api.post('/auth/password', requireAuth, wrap(async (req, res) => {
  const a = await Admin.findById(req.admin.id);
  if (!(await bcrypt.compare(String(req.body?.current || ''), a.password))) return res.status(400).json({ message: 'Cari parol yanlışdır', errors: { current: 'Cari parol yanlışdır' } });
  const chk = passwordRule.safeParse(req.body?.next);
  if (!chk.success) return res.status(400).json({ message: chk.error.issues[0].message, errors: { next: chk.error.issues[0].message } });
  a.password = await bcrypt.hash(chk.data, 10); await a.save();
  res.json({ ok: true });
}));

// ───────── Admin users ─────────
api.get('/admins', requireAuth, wrap(async (_req, res) => res.json(await Admin.find().select('-password').sort({ createdAt: 1 }).lean())));
api.post('/admins', requireAuth, wrap(async (req, res) => {
  const v = parse(adminCreate, req.body); if (v.errors) return bad(res, v);
  if (await Admin.exists({ email: v.data.email })) return res.status(409).json({ message: 'Bu e-poçt artıq mövcuddur', errors: { email: 'Bu e-poçt artıq mövcuddur' } });
  const a = await Admin.create({ ...v.data, password: await bcrypt.hash(v.data.password, 10) });
  res.status(201).json({ _id: a._id, name: a.name, email: a.email });
}));
api.delete('/admins/:id', requireAuth, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Yanlış identifikator' });
  if (req.params.id === req.admin.id) return res.status(400).json({ message: 'Özünüzü silə bilməzsiniz' });
  if ((await Admin.countDocuments()) <= 1) return res.status(400).json({ message: 'Son admini silmək olmaz' });
  await Admin.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ───────── Content ─────────
api.use('/destinations', crud(Destination, schemas.destinations));
api.use('/hotels', crud(Hotel, schemas.hotels, { filters: ['destinationSlug'] }));
api.use('/news', crud(News, schemas.news, { sort: { date: -1 } }));
api.use('/agencies', crud(Agency, schemas.agencies, { slug: false }));
api.use('/experiences', crud(Experience, schemas.experiences, { slug: false }));

// ───────── Site settings ─────────
const getSettings = async () => (await Settings.findOne({ key: 'site' }).lean()) || (await Settings.create({ key: 'site' })).toObject();
api.get('/settings', wrap(async (_req, res) => res.json(await getSettings())));
api.put('/settings', requireAuth, wrap(async (req, res) => {
  const v = parse(settingsSchema, req.body); if (v.errors) return bad(res, v);
  res.json(await Settings.findOneAndUpdate({ key: 'site' }, { $set: v.data }, { new: true, upsert: true, setDefaultsOnInsert: true }));
}));

// ───────── Text overrides (every string of the site is editable) ─────────
api.get('/texts', wrap(async (_req, res) => {
  const map = {};
  (await TextOverride.find().lean()).forEach((t) => { map[t.key] = { az: t.az, en: t.en }; });
  res.json(map);
}));
api.put('/texts/:key', requireAuth, wrap(async (req, res) => {
  const k = textKey.safeParse(req.params.key); if (!k.success) return res.status(400).json({ message: k.error.issues[0].message });
  const v = parse(textOverride, req.body); if (v.errors) return bad(res, v);
  res.json(await TextOverride.findOneAndUpdate({ key: k.data }, v.data, { new: true, upsert: true, setDefaultsOnInsert: true }));
}));
api.delete('/texts/:key', requireAuth, wrap(async (req, res) => {
  await TextOverride.deleteOne({ key: String(req.params.key) });
  res.json({ ok: true });
}));

// ───────── Inquiries (public create, admin manage) ─────────
api.post('/inquiries', inquiryLimit, wrap(async (req, res) => {
  if (req.body?.website) return res.status(201).json({ ok: true }); // honeypot: bots fill hidden fields
  const v = parse(inquiryCreate, req.body); if (v.errors) return bad(res, v);
  await Inquiry.create(v.data);
  res.status(201).json({ ok: true });
}));
api.get('/inquiries', requireAuth, wrap(async (_req, res) => res.json(await Inquiry.find().sort({ createdAt: -1 }).lean())));
api.patch('/inquiries/:id', requireAuth, wrap(async (req, res) => {
  const v = parse(inquiryPatch, req.body); if (v.errors) return bad(res, v);
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Yanlış identifikator' });
  const doc = await Inquiry.findByIdAndUpdate(req.params.id, v.data, { new: true });
  if (!doc) return res.status(404).json({ message: 'Tapılmadı' });
  res.json(doc);
}));
api.delete('/inquiries/:id', requireAuth, wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Yanlış identifikator' });
  await Inquiry.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// ───────── Media library ─────────
const UPLOADS = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOADS, { recursive: true });
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };
const upload = multer({
  storage: multer.diskStorage({ destination: UPLOADS, filename: (_r, f, cb) => cb(null, crypto.randomBytes(8).toString('hex') + EXT[f.mimetype]) }),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_r, f, cb) => cb(null, !!EXT[f.mimetype]),
});
api.post('/upload', requireAuth, upload.array('file', 10), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: 'Yalnız JPG, PNG, WEBP, GIF və ya AVIF şəkil yükləyin (maks. 8 MB)' });
  const urls = req.files.map((f) => `/uploads/${f.filename}`);
  res.json({ url: urls[0], urls });
});
api.get('/media', requireAuth, wrap(async (_req, res) => {
  const files = (await fs.promises.readdir(UPLOADS)).filter((n) => /^[a-f0-9]{16}\.(jpg|png|webp|gif|avif)$/.test(n));
  const out = await Promise.all(files.map(async (name) => { const s = await fs.promises.stat(path.join(UPLOADS, name)); return { name, url: `/uploads/${name}`, size: s.size, date: s.mtime }; }));
  res.json(out.sort((a, b) => +new Date(b.date) - +new Date(a.date)));
}));
api.delete('/media/:name', requireAuth, wrap(async (req, res) => {
  if (!/^[a-f0-9]{16}\.(jpg|png|webp|gif|avif)$/.test(req.params.name)) return res.status(400).json({ message: 'Yanlış fayl adı' });
  await fs.promises.unlink(path.join(UPLOADS, req.params.name)).catch(() => {});
  res.json({ ok: true });
}));

// ───────── Dashboard ─────────
api.get('/stats', requireAuth, wrap(async (_req, res) => {
  const [destinations, hotels, news, agencies, experiences, inquiries, unread, recent] = await Promise.all([
    ...[Destination, Hotel, News, Agency, Experience, Inquiry].map((M) => M.countDocuments()),
    Inquiry.countDocuments({ read: { $ne: true } }),
    Inquiry.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  res.json({ destinations, hotels, news, agencies, experiences, inquiries, unread, recent });
}));

export default api;
