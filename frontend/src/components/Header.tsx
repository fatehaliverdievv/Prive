import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/LangContext';
import { LANGS } from '../i18n/dict';
import { useDestinations } from '../lib/data';
import './Header.scss';

export default function Header() {
  const { t, l, to, lang, switchTo } = useLang();
  const destinations = useDestinations();
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 240);
      last = y;
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setMenu(false); setOpen(false); }, [pathname]);

  const links = [
    { k: 'nav.hotels', p: '/hotels' }, { k: 'nav.news', p: '/news' },
    { k: 'nav.about', p: '/about' }, { k: 'nav.agencies', p: '/agencies' },
  ] as const;

  return (
    <>
      <header className={`hdr ${hidden && !menu ? 'is-hidden' : ''}`}>
        <Link to={to()} className="hdr__logo" aria-label="Privé DMC"><img src="/images/logo-light.png" alt=" DMC" /></Link>

        <nav className="hdr__nav">
          <div className="hdr__drop" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <NavLink to={to('/destinations')}>{t('nav.destinations')}</NavLink>
            <AnimatePresence>
              {open && (
                <motion.ul initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}>
                  {destinations.map((d) => (<li key={d._id}><Link to={to(`/destinations/${d.slug}`)}>{l(d.name)}</Link></li>))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          {links.map((x) => (<NavLink key={x.p} to={to(x.p)}>{t(x.k)}</NavLink>))}
        </nav>

        <div className="hdr__right">
          <a className="hdr__call" href="tel:+994120000000">{t('nav.call')}</a>
          <div className="hdr__lang">
            {LANGS.map((x) => (
              <button key={x} className={x === lang ? 'on' : ''} onClick={() => switchTo(x)}>{x.toUpperCase()}</button>
            ))}
          </div>
          <button className={`hdr__burger ${menu ? 'on' : ''}`} onClick={() => setMenu((v) => !v)} aria-label={t('nav.menu')}><i /><i /></button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="mnav" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}>
            {[{ k: 'nav.destinations', p: '/destinations' }, ...links].map((x, i) => (
              <motion.div key={x.p} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 + i * 0.07, duration: 0.7 }}>
                <Link to={to(x.p)}>{t(x.k as never)}</Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
