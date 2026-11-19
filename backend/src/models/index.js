import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Bilingual string: { az, en }
const L = () => ({ az: { type: String, default: '' }, en: { type: String, default: '' } });
const base = { published: { type: Boolean, default: true }, order: { type: Number, default: 0 } };
const opts = { timestamps: true };

export const Destination = model('Destination', new Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  name: L(), country: L(), tagline: L(), description: L(), image: String, gallery: [String], ...base,
}, opts));

export const Hotel = model('Hotel', new Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  name: L(), description: L(), destinationSlug: { type: String, index: true },
  stars: { type: Number, default: 5 }, image: String, gallery: [String], ...base,
}, opts));

export const News = model('News', new Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  title: L(), excerpt: L(), content: L(), image: String, date: { type: Date, default: Date.now }, ...base,
}, opts));

export const Agency = model('Agency', new Schema({ name: String, city: L(), address: L(), phone: String, email: String, ...base }, opts));

/** "Every detail, designed" cards on the home page */
export const Experience = model('Experience', new Schema({ image: String, title: L(), desc: L(), ...base }, opts));

export const Inquiry = model('Inquiry', new Schema({
  name: { type: String, required: true }, phone: String, email: String, message: String,
  read: { type: Boolean, default: false }, note: { type: String, default: '' },
}, opts));

/** Singleton with contact info, social links, stats, hero/portal images and SEO */
export const Settings = model('Settings', new Schema({
  key: { type: String, default: 'site', unique: true },
  phone: { type: String, default: '+994 12 000 00 00' }, email: { type: String, default: 'hello@peaktour.az' },
  whatsapp: { type: String, default: '' }, instagram: { type: String, default: '' }, facebook: { type: String, default: '' },
  address: L(), heroImage: { type: String, default: '' }, portalImage: { type: String, default: '' }, aboutImage: { type: String, default: '' },
  stats: { countries: { type: Number, default: 24 }, hotels: { type: Number, default: 320 }, guests: { type: Number, default: 18500 }, years: { type: Number, default: 12 } },
  seoTitle: L(), seoDescription: L(),
}, opts));

/** Overrides for any text of the site (key = i18n key, e.g. "hero.title") */
export const TextOverride = model('TextOverride', new Schema({
  key: { type: String, required: true, unique: true }, az: { type: String, default: '' }, en: { type: String, default: '' },
}, opts));

export const Admin = model('Admin', new Schema({
  name: { type: String, default: 'Admin' },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
}, opts));
