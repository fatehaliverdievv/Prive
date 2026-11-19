export type Lang = 'az' | 'en';
export const LANGS: Lang[] = ['az', 'en'];
export type L10n = Partial<Record<Lang, string>>;

const en = {
  'nav.destinations': 'Destinations', 'nav.hotels': 'Hotels', 'nav.news': 'News',
  'nav.about': 'About Company', 'nav.agencies': 'Agencies', 'nav.call': 'Call us', 'nav.menu': 'Menu',
  'hero.title': 'Premium tours for a new perspective on travel',
  'hero.sub': 'Hand-picked destinations, private hotels and journeys designed around you.',
  'hero.cta': 'About Company', 'hero.scroll': 'Scroll',
  'show.eyebrow': 'Explore with Privé DMC', 'show.title': 'Beyond Borders', 'show.open': 'Open',
  'dest.eyebrow': 'Destinations', 'dest.all': 'All Destinations',
  'hotels.title': 'Hotels', 'hotels.sub': 'Places to stay that are an experience of their own.',
  'news.title': 'News', 'news.sub': 'Updates, destinations and hidden gems from our world of travel.',
  'stats.countries': 'Countries', 'stats.hotels': 'Partner hotels', 'stats.guests': 'Happy travellers', 'stats.years': 'Years of experience',
  'contact.title': 'Plan your next escape', 'contact.sub': 'Leave your details and our travel designer will contact you within the hour.',
  'form.name': 'Your name', 'form.phone': 'Phone', 'form.email': 'E-mail', 'form.message': 'Tell us about your trip',
  'form.send': 'Send request', 'form.sent': 'Thank you! We will be in touch very soon.', 'form.error': 'Something went wrong. Please try again.',
  'detail.welcome': 'Welcome to', 'detail.hotels': 'Where to stay', 'detail.back': 'Back', 'detail.read': 'Read more',
  'about.title': 'About Company',
  'about.p1': 'Privé DMC is a premium travel company that designs journeys for people who value time, privacy and detail.',
  'about.p2': 'From the first call to the last transfer, a personal travel designer takes care of every moment of your trip.',
  'agencies.title': 'Agencies', 'agencies.sub': 'Visit us — we would love to plan your next trip over coffee.',
  'portal.title': 'Every journey begins with a door', 'portal.sub': 'Open it. We design the rest.', 'portal.cta': 'Plan a trip',
  'exp.title': 'Every detail, designed',
  'footer.rights': 'All rights reserved.', 'footer.tag': 'Less is more.', 'common.stars': 'stars', 'common.empty': 'Nothing here yet.',
};

const az: typeof en = {
  'nav.destinations': 'İstiqamətlər', 'nav.hotels': 'Otellər', 'nav.news': 'Xəbərlər',
  'nav.about': 'Şirkət haqqında', 'nav.agencies': 'Agentliklər', 'nav.call': 'Zəng edin', 'nav.menu': 'Menyu',
  'hero.title': 'Səyahətə yeni baxış bucağı verən premium turlar',
  'hero.sub': 'Seçilmiş istiqamətlər, özəl otellər və məhz sizin üçün hazırlanmış səyahətlər.',
  'hero.cta': 'Şirkət haqqında', 'hero.scroll': 'Aşağı',
  'show.eyebrow': 'Privé DMC ilə kəşf edin', 'show.title': 'Sərhədlərdən kənarda', 'show.open': 'Aç',
  'dest.eyebrow': 'İstiqamətlər', 'dest.all': 'Bütün istiqamətlər',
  'hotels.title': 'Otellər', 'hotels.sub': 'Özlüyündə bir təcrübə olan qalma məkanları.',
  'news.title': 'Xəbərlər', 'news.sub': 'Səyahət dünyamızdan yeniliklər, istiqamətlər və gizli məkanlar.',
  'stats.countries': 'Ölkə', 'stats.hotels': 'Tərəfdaş otel', 'stats.guests': 'Məmnun səyyah', 'stats.years': 'İllik təcrübə',
  'contact.title': 'Növbəti qaçışınızı planlayın', 'contact.sub': 'Məlumatlarınızı buraxın, səyahət dizayneri bir saat ərzində sizinlə əlaqə saxlayacaq.',
  'form.name': 'Adınız', 'form.phone': 'Telefon', 'form.email': 'E-poçt', 'form.message': 'Səyahətiniz haqqında yazın',
  'form.send': 'Sorğu göndər', 'form.sent': 'Təşəkkürlər! Tezliklə sizinlə əlaqə saxlayacağıq.', 'form.error': 'Xəta baş verdi. Yenidən cəhd edin.',
  'detail.welcome': 'Xoş gəlmisiniz', 'detail.hotels': 'Harada qalmalı', 'detail.back': 'Geri', 'detail.read': 'Ətraflı oxu',
  'about.title': 'Şirkət haqqında',
  'about.p1': 'Privé DMC vaxta, məxfiliyə və detallara dəyər verən insanlar üçün səyahətlər dizayn edən premium turizm şirkətidir.',
  'about.p2': 'İlk zəngdən son transferə qədər şəxsi səyahət dizayneri səfərinizin hər anına qayğı göstərir.',
  'agencies.title': 'Agentliklər', 'agencies.sub': 'Bizə gəlin — növbəti səfəri bir fincan qəhvə ilə planlayaq.',
  'portal.title': 'Hər səyahət bir qapıdan başlayır', 'portal.sub': 'Qapını açın. Qalanını biz düzəldərik.', 'portal.cta': 'Səfəri planla',
  'exp.title': 'Hər detal dizayn olunub',
  'footer.rights': 'Bütün hüquqlar qorunur.', 'footer.tag': 'Azı çoxdur.', 'common.stars': 'ulduz', 'common.empty': 'Hələ ki, heç nə yoxdur.',
};

export type Key = keyof typeof en;
export const dict: Record<Lang, Record<Key, string>> = { en, az };
