import { useCallback, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import Lenis from 'lenis';
import { LangProvider } from '../i18n/LangContext';
import type { Lang } from '../i18n/dict';
import Preloader from './Preloader';
import Cursor from './Cursor';
import Header from './Header';
import Footer from './Footer';
import { useSettings } from '../lib/content';

export default function SiteLayout() {
  const { lang } = useParams();
  const { pathname } = useLocation();
  const site = useSettings();
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('pt_loaded'));
  const done = useCallback(() => { sessionStorage.setItem('pt_loaded', '1'); setLoading(false); }, []);

  // smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => { document.documentElement.lang = lang || 'az'; }, [lang]);

  useEffect(() => {
    const L = (lang === 'en' ? 'en' : 'az') as Lang;
    document.title = site.seoTitle[L] || 'Privé DMC';
    const d = site.seoDescription[L];
    let m = document.querySelector('meta[name="description"]');
    if (d) { if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); } m.setAttribute('content', d); }
  }, [lang, site.seoTitle, site.seoDescription]);

  if (lang !== 'az' && lang !== 'en') return <Navigate to="/az" replace />;

  return (
    <LangProvider lang={lang as Lang}>
      <AnimatePresence>{loading && <Preloader key="pre" onDone={done} />}</AnimatePresence>
      <motion.i className="progress" style={{ scaleX: bar }} />
      <Cursor />
      <Header />
      <motion.main key={pathname} initial={{ opacity: 0 }} animate={{ opacity: loading ? 0 : 1 }} transition={{ duration: 0.8 }}>
        <Outlet />
      </motion.main>
      <Footer />
    </LangProvider>
  );
}
