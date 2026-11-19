import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/LangContext';
import { useDestinations } from '../lib/data';
import { useSettings } from '../lib/content';
import './Footer.scss';

export default function Footer() {
  const { t, l, to } = useLang();
  const dest = useDestinations().slice(0, 6);
  const s = useSettings();
  const digits = (v: string) => v.replace(/[^\d+]/g, '');
  const socials = [['Instagram', s.instagram], ['Facebook', s.facebook], ['WhatsApp', s.whatsapp ? `https://wa.me/${digits(s.whatsapp).replace('+', '')}` : '']].filter(([, u]) => u);
  return (
    <footer className="ftr">
      <div className="container ftr__top">
        <div>
          <img className="ftr__logo" src="/images/logo-light.png" alt="Privé by Peaktour" />
          <p className="eyebrow">{t('footer.tag')}</p>
          <a className="ftr__mail" href={`mailto:${s.email}`}>{s.email}</a>
          <a className="ftr__tel" href={`tel:${digits(s.phone)}`}>{s.phone}</a>
          {l(s.address) && <p className="ftr__addr">{l(s.address)}</p>}
          {socials.length > 0 && <p className="ftr__soc">{socials.map(([n, u]) => (<a key={n} href={u} target="_blank" rel="noreferrer">{n}</a>))}</p>}
        </div>
        <ul>{dest.map((d) => (<li key={d._id}><Link to={to(`/destinations/${d.slug}`)}>{l(d.name)}</Link></li>))}</ul>
        <ul>
          <li><Link to={to('/hotels')}>{t('nav.hotels')}</Link></li>
          <li><Link to={to('/news')}>{t('nav.news')}</Link></li>
          <li><Link to={to('/about')}>{t('nav.about')}</Link></li>
          <li><Link to={to('/agencies')}>{t('nav.agencies')}</Link></li>
        </ul>
      </div>
      <motion.div className="ftr__big" aria-hidden initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} transition={{ staggerChildren: 0.06 }}>
        {'PRIVE TOUR'.split('').map((c, i) => (
          <motion.span key={i} variants={{ hidden: { rotateX: -95, y: '40%', opacity: 0 }, show: { rotateX: 0, y: 0, opacity: 1 } }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>{c === ' ' ? '\u00A0' : c}</motion.span>
        ))}
      </motion.div>
      <div className="container ftr__bottom">
        <span>© {new Date().getFullYear()} Peak Tour. {t('footer.rights')}</span>
        <span>peaktour.az</span>
      </div>
    </footer>
  );
}
