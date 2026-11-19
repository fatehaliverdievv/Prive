import { useEffect, useState } from 'react';
import { api } from './api';
import type { L10n } from '../i18n/dict';

export interface Destination { _id: string; slug: string; name: L10n; country: L10n; tagline: L10n; description: L10n; image: string; }
export interface Hotel { _id: string; slug: string; name: L10n; description: L10n; destinationSlug: string; stars: number; image: string; }
export interface NewsItem { _id: string; slug: string; title: L10n; excerpt: L10n; content: L10n; image: string; date: string; }
export interface Agency { _id: string; name: string; city: L10n; address: L10n; phone: string; email: string; }

const d = (slug: string, az: string, en: string, tAz: string, tEn: string, dAz: string, dEn: string): Destination => ({
  _id: slug, slug, image: `/images/${slug}.webp`, name: { az, en }, country: { az, en },
  tagline: { az: tAz, en: tEn }, description: { az: dAz, en: dEn },
});

/** Offline fallback so the site always looks alive, even before the API/MongoDB is running */
export const FALLBACK = {
  destinations: [
    d('turkiye', 'Türkiyə', 'Türkiye', 'İstədiyiniz hər yerdə', 'Everywhere you want to be', 'Antalya, Bodrum və Egey sahillərində ultra-lüks otellər və unudulmaz gün batımları.', 'Ultra-luxury hotels and unforgettable sunsets across Antalya, Bodrum and the Aegean.'),
    d('maldives', 'Maldiv', 'Maldives', 'Okeanın üstündə sakitlik', 'Stillness above the ocean', 'Su üstündə villalar, büllur laqunlar və tam məxfilik.', 'Overwater villas, crystal lagoons and total privacy.'),
    d('thailand', 'Tailand', 'Thailand', 'Tropik ritm', 'A tropical rhythm', 'Phuket-dən Krabi-yə: təmiz çimərliklər və qaya adaları.', 'From Phuket to Krabi: powder beaches and limestone islands.'),
    d('seychelles', 'Seyşel', 'Seychelles', 'Qranit və firuzə', 'Granite and turquoise', 'Nəhəng qranit qayalar və dünyanın ən gözəl çimərlikləri.', 'Giant granite boulders and some of the most beautiful beaches on Earth.'),
    d('italy', 'İtaliya', 'Italy', 'Göl kənarında la dolce vita', 'La dolce vita by the lake', 'Como gölü, taxta katerlər və sahil villaları: yavaş və zərif İtaliya.', 'Lake Como, wooden speedboats and lakeside villas: Italy, slow and elegant.'),
    d('uae', 'BƏƏ', 'UAE', 'Səhra və şəhər', 'Desert meets skyline', 'Dubay və Abu-Dabi: səma tikililəri və səhra safarisi.', 'Dubai and Abu Dhabi: skyscrapers and desert safaris.'),
  ] as Destination[],
  hotels: [
    { _id: 'h1', slug: 'hotel-aegean', destinationSlug: 'turkiye', stars: 5, image: '/images/hotel-aegean.webp', name: { az: 'Aegean Pearl', en: 'Aegean Pearl' }, description: { az: 'Bodrumda dənizə baxan memarlıq incisi.', en: 'An architectural gem overlooking the Bodrum sea.' } },
    { _id: 'h2', slug: 'hotel-lagoon', destinationSlug: 'maldives', stars: 5, image: '/images/hotel-lagoon.webp', name: { az: 'Lagoon Atoll', en: 'Lagoon Atoll' }, description: { az: 'Şəxsi laqun və su üstündə villalar.', en: 'Private lagoon and overwater villas.' } },
    { _id: 'h3', slug: 'hotel-orchid', destinationSlug: 'thailand', stars: 5, image: '/images/hotel-orchid.webp', name: { az: 'Orchid Bay', en: 'Orchid Bay' }, description: { az: 'Phuket sahilində tropik bağlar arasında.', en: 'Set in tropical gardens on the Phuket coast.' } },
  ] as Hotel[],
  news: [
    { _id: 'n1', slug: 'news-new-resort', image: '/images/news-new-resort.webp', date: '2026-11-01', title: { az: 'Yeni kurort açıldı', en: 'A new resort opens' }, excerpt: { az: 'Bodrumda yeni art-otel qonaqlarını qəbul etməyə başladı.', en: 'A new art hotel in Bodrum has started welcoming guests.' }, content: { az: 'Bodrumda yeni art-otel qonaqlarını qəbul etməyə başladı.', en: 'A new art hotel in Bodrum has started welcoming guests.' } },
    { _id: 'n2', slug: 'news-winter', image: '/images/news-winter.webp', date: '2026-10-20', title: { az: 'Qış istiqamətləri', en: 'Winter destinations' }, excerpt: { az: 'Qış mövsümü üçün ən yaxşı isti istiqamətlər.', en: 'The best warm destinations for the winter season.' }, content: { az: 'Qış mövsümü üçün ən yaxşı isti istiqamətlər.', en: 'The best warm destinations for the winter season.' } },
    { _id: 'n3', slug: 'news-flights', image: '/images/news-flights.webp', date: '2026-10-05', title: { az: 'Birbaşa reyslər', en: 'Direct flights' }, excerpt: { az: 'Bakıdan yeni birbaşa reyslər əlavə olundu.', en: 'New direct flights from Baku have been added.' }, content: { az: 'Bakıdan yeni birbaşa reyslər əlavə olundu.', en: 'New direct flights from Baku have been added.' } },
  ] as NewsItem[],
  agencies: [
    { _id: 'a1', name: 'Peak Tour Baku', city: { az: 'Bakı', en: 'Baku' }, address: { az: 'Nizami küç. 10', en: '10 Nizami St.' }, phone: '+994 12 000 00 00', email: 'baku@peaktour.az' },
    { _id: 'a2', name: 'Peak Tour Ganja', city: { az: 'Gəncə', en: 'Ganja' }, address: { az: 'Cavad Xan küç. 5', en: '5 Javad Khan St.' }, phone: '+994 22 000 00 00', email: 'ganja@peaktour.az' },
  ] as Agency[],
};

function useList<T>(path: string, fallback: T[]): T[] {
  const [data, setData] = useState<T[]>(fallback);
  useEffect(() => {
    let alive = true;
    api<T[]>(path).then((r) => alive && Array.isArray(r) && r.length && setData(r)).catch(() => {});
    return () => { alive = false; };
  }, [path]);
  return data;
}

export const useDestinations = () => useList<Destination>('/destinations', FALLBACK.destinations);
export const useHotels = () => useList<Hotel>('/hotels', FALLBACK.hotels);
export const useNews = () => useList<NewsItem>('/news', FALLBACK.news);
export const useAgencies = () => useList<Agency>('/agencies', FALLBACK.agencies);
