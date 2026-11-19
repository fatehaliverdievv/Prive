import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { parse } from '../validators.js';

/**
 * Generic REST factory with validation.
 *  GET    /            public, published only (supports ?<filter>=value)
 *  GET    /admin/all   admin, everything
 *  GET    /:key        public, by slug or _id (published only)
 *  POST   /            admin (full validation)
 *  PUT    /:id         admin (partial validation, so single-field updates like "published" work)
 *  DELETE /:id         admin
 */
export default function crud(Model, schema, { sort = { order: 1, createdAt: -1 }, filters = [], slug = true } = {}) {
  const r = Router();
  const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
  const bad = (res, v) => res.status(400).json({ message: v.message, errors: v.errors });

  r.get('/', wrap(async (req, res) => {
    const q = { published: true };
    filters.forEach((f) => typeof req.query[f] === 'string' && req.query[f] && (q[f] = req.query[f]));
    res.json(await Model.find(q).sort(sort).lean());
  }));

  r.get('/admin/all', requireAuth, wrap(async (_req, res) => res.json(await Model.find().sort(sort).lean())));

  r.get('/:key', wrap(async (req, res) => {
    const { key } = req.params, or = [];
    if (slug) or.push({ slug: key });
    if (mongoose.isValidObjectId(key)) or.push({ _id: key });
    const doc = or.length ? await Model.findOne({ $or: or, published: true }).lean() : null;
    if (!doc) return res.status(404).json({ message: 'Tapılmadı' });
    res.json(doc);
  }));

  r.post('/', requireAuth, wrap(async (req, res) => {
    const v = parse(schema, req.body); if (v.errors) return bad(res, v);
    res.status(201).json(await Model.create(v.data));
  }));

  r.put('/:id', requireAuth, wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Yanlış identifikator' });
    const v = parse(schema.partial(), req.body); if (v.errors) return bad(res, v);
    const doc = await Model.findByIdAndUpdate(req.params.id, v.data, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Tapılmadı' });
    res.json(doc);
  }));

  r.delete('/:id', requireAuth, wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Yanlış identifikator' });
    await Model.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  }));

  return r;
}
