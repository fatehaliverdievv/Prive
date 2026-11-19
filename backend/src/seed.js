import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Destination, Hotel, News, Agency, Experience, Settings, Admin } from './models/index.js';

const d = (slug, az, en, cAz, cEn, tAz, tEn, dAz, dEn, order) => ({
  slug, order, image: `/images/${slug}.webp`,
  name: { az, en }, country: { az: cAz, en: cEn }, tagline: { az: tAz, en: tEn }, description: { az: dAz, en: dEn },
});

const destinations = [
  d('turkiye', 'Türkiyə', 'Türkiye', 'Türkiyə', 'Türkiye', 'İstədiyiniz hər yerdə', 'Everywhere you want to be',
    'Antalya, Bodrum və Egey sahillərində ultra-lüks otellər, şəxsi çimərliklər və unudulmaz gün batımları.',
    'Ultra-luxury hotels, private beaches and unforgettable sunsets across Antalya, Bodrum and the Aegean coast.', 1),
  d('maldives', 'Maldiv', 'Maldives', 'Maldiv adaları', 'Maldives', 'Okeanın üstündə sakitlik', 'Stillness above the ocean',
    'Su üstündə villalar, büllur laqunlar və tam məxfilik: sakit istirahətin ən saf forması.',
    'Overwater villas, crystal lagoons and total privacy — the purest form of calm.', 2),
  d('thailand', 'Tailand', 'Thailand', 'Tailand', 'Thailand', 'Tropik ritm', 'A tropical rhythm',
    'Phuket-dən Krabi-yə qədər: təmiz çimərliklər, qaya adaları və dadlı mətbəx.',
    'From Phuket to Krabi: powder beaches, limestone islands and unforgettable cuisine.', 3),
  d('seychelles', 'Seyşel', 'Seychelles', 'Seyşel adaları', 'Seychelles', 'Qranit və firuzə', 'Granite and turquoise',
    'Nəhəng qranit qayalar, nadir təbiət və dünyanın ən gözəl çimərlikləri.',
    'Giant granite boulders, rare nature and some of the most beautiful beaches on Earth.', 4),
  d('italy', 'İtaliya', 'Italy', 'İtaliya', 'Italy', 'Göl kənarında la dolce vita', 'La dolce vita by the lake',
    'Como gölü, taxta katerlər və sahil villaları: yavaş və zərif İtaliya.',
    'Lake Como, wooden speedboats and lakeside villas: Italy, slow and elegant.', 5),
  d('uae', 'BƏƏ', 'UAE', 'Birləşmiş Ərəb Əmirlikləri', 'United Arab Emirates', 'Səhra və şəhər', 'Desert meets skyline',
    'Dubay və Abu-Dabi: səma tikililəri, səhra safarisi və dünya səviyyəli otellər.',
    'Dubai and Abu Dhabi: skyscrapers, desert safaris and world-class hotels.', 6),
];

const h = (slug, az, en, destinationSlug, stars, aAz, aEn, order) => ({
  slug, destinationSlug, stars, order, image: `/images/${slug}.webp`, name: { az, en }, description: { az: aAz, en: aEn },
});
const hotels = [
  h('hotel-aegean', 'Aegean Pearl', 'Aegean Pearl', 'turkiye', 5, 'Bodrumda dənizə baxan memarlıq incisi.', 'An architectural gem overlooking the Bodrum sea.', 1),
  h('hotel-lagoon', 'Lagoon Atoll', 'Lagoon Atoll', 'maldives', 5, 'Şəxsi laqun və su üstündə villalar.', 'Private lagoon and overwater villas.', 2),
  h('hotel-orchid', 'Orchid Bay', 'Orchid Bay', 'thailand', 5, 'Phuket sahilində tropik bağlar arasında.', 'Set in tropical gardens on the Phuket coast.', 3),
];

const n = (slug, az, en, eAz, eEn, order) => ({
  slug, order, image: `/images/${slug}.webp`, date: new Date(),
  title: { az, en }, excerpt: { az: eAz, en: eEn }, content: { az: eAz + ' ' + eAz, en: eEn + ' ' + eEn },
});
const news = [
  n('news-new-resort', 'Yeni kurort açıldı', 'A new resort opens', 'Bodrumda yeni art-otel qonaqlarını qəbul etməyə başladı.', 'A new art hotel in Bodrum has started welcoming guests.', 1),
  n('news-winter', 'Qış istiqamətləri', 'Winter destinations', 'Qış mövsümü üçün ən yaxşı isti istiqamətlər.', 'The best warm destinations for the winter season.', 2),
  n('news-flights', 'Birbaşa reyslər', 'Direct flights', 'Bakıdan yeni birbaşa reyslər əlavə olundu.', 'New direct flights from Baku have been added.', 3),
];

const agencies = [
  { name: 'Privé DMC Baku', city: { az: 'Bakı', en: 'Baku' }, address: { az: 'Nizami küç. 10', en: '10 Nizami St.' }, phone: '+994 12 000 00 00', email: 'baku@privedmc.az', order: 1 },
  { name: 'Privé DMC Ganja', city: { az: 'Gəncə', en: 'Ganja' }, address: { az: 'Cavad Xan küç. 5', en: '5 Javad Khan St.' }, phone: '+994 22 000 00 00', email: 'ganja@privedmc.az', order: 2 },
];

const experiences = [
  { image: '/images/transfer.webp', title: { az: 'Qapıdan qapıya transfer', en: 'Door-to-door transfers' }, desc: { az: 'Klassik avtomobillər və şəxsi sürücü.', en: 'Classic cars and a private driver.' }, order: 1 },
  { image: '/images/pool.webp', title: { az: 'Özəl qalma məkanları', en: 'Private stays' }, desc: { az: 'Dənizə baxan hovuzlar, sakit səhərlər.', en: 'Sea-view pools and quiet mornings.' }, order: 2 },
  { image: '/images/journal.webp', title: { az: 'Yavaş səyahət', en: 'Slow travel' }, desc: { az: 'Limon, qəzet və heç bir plan.', en: 'Lemons, a newspaper and no plan.' }, order: 3 },
  { image: '/images/italy.webp', title: { az: 'Suyun üstündə', en: 'On the water' }, desc: { az: 'Taxta katerlə göl sahili.', en: 'A lakeshore by wooden speedboat.' }, order: 4 },
];

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017', { dbName: process.env.MONGO_DB || 'peaktour' });
await Promise.all([Destination, Hotel, News, Agency, Experience].map((M) => M.deleteMany({})));
await Destination.insertMany(destinations);
await Hotel.insertMany(hotels);
await News.insertMany(news);
await Agency.insertMany(agencies);
await Experience.insertMany(experiences);
// settings are created once and never overwritten by re-seeding
await Settings.updateOne({ key: 'site' }, { $setOnInsert: { key: 'site', heroImage: '/images/hero.webp', portalImage: '/images/uae.webp', aboutImage: '/images/about.webp' } }, { upsert: true });

const email = (process.env.ADMIN_EMAIL || 'admin@peaktour.az').toLowerCase();
await Admin.deleteMany({ email });
await Admin.create({ name: 'Admin', email, password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin12345', 10) });

console.log('Seed done. Admin:', email);
await mongoose.disconnect();
