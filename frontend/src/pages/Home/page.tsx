import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, animate, motion, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from 'framer-motion';
import { useLang } from '../../i18n/LangContext';
import { useDestinations, useHotels, useNews } from '../../lib/data';
import { api, ApiError, img } from '../../lib/api';
import SplitText from '../../components/SplitText';
import Reveal from '../../components/Reveal';
import Magnetic from '../../components/Magnetic';
import Marquee from '../../components/Marquee';
import TiltCard from '../../components/TiltCard';
import Depth from '../../components/Depth';
import { useExperiences, useSettings, type Experience as Exp } from '../../lib/content';
import './page.scss';

const Hero3D = lazy(() => import('../../components/Hero3D'));

/* ───────────────────────── Hero ───────────────────────── */
function Hero() {
  const site = useSettings();
  const { t, to } = useLang();
  const ref = useRef<HTMLElement>(null);
  const [delay] = useState(() => (sessionStorage.getItem('pt_loaded') ? 0.15 : 3.5));
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.28]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-35%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section className="hero" ref={ref}>
      <motion.div className="hero__bg" style={{ y: bgY, scale: bgScale }}>
        <img src={img(site.heroImage)} alt="" />
      </motion.div>
      <div className="hero__shade" />
      <Link to={to('/about')} className="hero__link" data-cursor={t('hero.cta')} aria-label={t('hero.cta')} />
      <motion.div className="hero__3d" style={{ y: bgY, scale: bgScale }}>
        <Suspense fallback={null}><Hero3D src={img(site.heroImage)} /></Suspense>
      </motion.div>

      <motion.div className="hero__content" style={{ y: textY, opacity: fade }}>
        <SplitText as="h1" text={t('hero.title')} className="hero__title" delay={delay} immediate />
        <motion.p className="hero__sub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 0.8, duration: 1 }}>
          {t('hero.sub')}
        </motion.p>
      </motion.div>

      <motion.div className="hero__scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 1.4 }}>
        <span>{t('hero.scroll')}</span><i />
      </motion.div>
    </section>
  );
}

/* ───────────────────── Portal: an arch opens into the destination ───────────────────── */
function Portal() {
  const { t, to } = useLang();
  const site = useSettings();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const clip = useTransform(p, [0, 0.65], ['inset(16% 36% 12% 36% round 999px 999px 0px 0px)', 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)']);
  const tilt = useTransform(p, [0, 0.65], [20, 0]);
  const zoom = useTransform(p, [0, 0.7], [1.7, 1.02]);
  const ghostY = useTransform(p, [0, 1], ['30%', '-55%']);
  const ghostZ = useTransform(p, [0, 1], [-200, 300]);
  const txtO = useTransform(p, [0.5, 0.75], [0, 1]);
  const txtY = useTransform(p, [0.5, 0.8], [70, 0]);
  const txtB = useTransform(p, [0.5, 0.78], ['blur(14px)', 'blur(0px)']);
  const hint = useTransform(p, [0, 0.12], [1, 0]);
  return (
    <section className="portal" ref={ref}>
      <div className="portal__stage">
        <motion.div className="portal__ghost" aria-hidden style={{ y: ghostY, z: ghostZ }}>PRIVÉ</motion.div>
        <motion.div className="portal__arch" style={{ clipPath: clip, rotateX: tilt }}>
          <motion.img src={img(site.portalImage)} alt="" style={{ scale: zoom }} />
          <div className="portal__shade" />
        </motion.div>
        <motion.div className="portal__txt" style={{ opacity: txtO, y: txtY, filter: txtB }}>
          <h2>{t('portal.title')}</h2>
          <p>{t('portal.sub')}</p>
          <Magnetic><Link className="btn light" to={to('/destinations')}>{t('portal.cta')}</Link></Magnetic>
        </motion.div>
        <motion.span className="portal__hint" style={{ opacity: hint }}>{t('hero.scroll')}</motion.span>
      </div>
    </section>
  );
}

/* ───────────────────── 3D ring carousel (scroll spins it) ───────────────────── */
function Showcase() {
  const { t, l, to } = useLang();
  const items = useDestinations().slice(0, 6);
  const n = items.length;
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [w, setW] = useState(300);
  useEffect(() => {
    const on = () => setW(Math.max(200, Math.min(400, window.innerWidth * (window.innerWidth < 820 ? 0.5 : 0.21))));
    on(); window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const R = (w * 1.12) / (2 * Math.tan(Math.PI / n));
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const spin = useSpring(useTransform(scrollYProgress, [0.04, 0.96], [0, -(n - 1) * (360 / n)]), { stiffness: 70, damping: 20, mass: 0.6 });
  const lean = useTransform(scrollYProgress, [0, 0.5, 1], [10, -4, 10]);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setI(Math.max(0, Math.min(n - 1, Math.round(((v - 0.04) / 0.92) * (n - 1))))));
  const go = (idx: number) => {
    const el = ref.current!;
    window.scrollTo({ top: el.offsetTop + (0.04 + (idx / (n - 1)) * 0.92) * (el.offsetHeight - window.innerHeight), behavior: 'smooth' });
  };
  const cur = items[i];
  return (
    <section className="show" ref={ref} style={{ height: `${n * 105}vh` }}>
      <div className="show__stage">
        <div className="show__left">
          <p className="eyebrow">{t('show.eyebrow')}</p>
          <h2 className="show__title">{t('show.title')}</h2>
          <AnimatePresence mode="wait">
            <motion.div key={cur?.slug} className="show__meta" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.45 }}>
              <span className="show__num">{String(i + 1).padStart(2, '0')}</span>
              <p>{l(cur?.description)}</p>
              <Link className="btn" to={to(`/destinations/${cur?.slug}`)}>{t('show.open')} →</Link>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="show__world">
          <motion.div className="show__ring" style={{ z: -R, rotateY: spin, rotateX: lean }}>
            {items.map((d, idx) => {
              const dist = Math.min(Math.abs(idx - i), n - Math.abs(idx - i));
              return (
                <Link key={d._id} to={to(`/destinations/${d.slug}`)} data-cursor={idx === i ? t('show.open') : l(d.name)}
                  className={`show__panel d${Math.min(dist, 2)}`} style={{ width: w, transform: `rotateY(${idx * (360 / n)}deg) translateZ(${R}px)` }}
                  onClick={(e) => { if (idx !== i) { e.preventDefault(); go(idx); } }}>
                  <img src={img(d.image)} alt={l(d.name)} />
                  <div className="show__poster"><strong>{l(d.name)}</strong><small>by Privé DMC</small><em>{l(d.tagline)}</em></div>
                </Link>
              );
            })}
          </motion.div>
          <div className="show__floor" />
        </div>

        <ol className="show__pager">
          {items.map((d, idx) => (
            <li key={d._id}><button className={idx === i ? 'on' : ''} onClick={() => go(idx)} aria-label={l(d.name)}>{String(idx + 1).padStart(2, '0')}</button></li>
          ))}
        </ol>
      </div>
    </section>
  );
}
/* ───────────────────── Full-screen gallery: each scroll step reveals the next image ───────────────────── */
function ExpSlide({ i, n, u, item }: { i: number; n: number; u: MotionValue<number>; item: Exp }) {
  const { l } = useLang();
  const clip = useTransform(u, [i - 1, i], ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)']);
  const scale = useTransform(u, [i - 1, i, i + 1], [1.35, 1.06, 1]);
  const o = useTransform(u, [i - 0.6, i - 0.15, i + 0.15, i + 0.6], [0, 1, 1, 0]);
  const y = useTransform(u, [i - 0.6, i, i + 0.6], [80, 0, -80]);
  const rx = useTransform(u, [i - 0.6, i, i + 0.6], [-28, 0, 28]);
  return (
    <motion.div className="exp__slide" style={{ zIndex: i + 1, clipPath: i === 0 ? undefined : clip }}>
      <motion.img src={img(item.image)} alt="" style={{ scale }} />
      <motion.div className="exp__txt" style={{ opacity: o, y, rotateX: rx }}>
        <h3>{l(item.title)}</h3>
        <p>{l(item.desc)}</p>
      </motion.div>
      <span className="exp__idx" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
    </motion.div>
  );
}

function Experience() {
  const { t } = useLang();
  const items = useExperiences();
  const n = items.length;
  const ref = useRef<HTMLElement>(null);
  const [act, setAct] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const u = useTransform(scrollYProgress, [0, 1], [0, Math.max(1, n - 1)]);
  useMotionValueEvent(u, 'change', (v) => setAct(Math.max(0, Math.min(n - 1, Math.round(v)))));
  const go = (i: number) => {
    const el = ref.current; if (!el) return;
    window.scrollTo({ top: el.offsetTop + (i / Math.max(1, n - 1)) * (el.offsetHeight - window.innerHeight), behavior: 'smooth' });
  };
  if (!n) return null;
  return (
    <section className="exp" ref={ref} style={{ height: `${Math.max(2, n) * 100}vh` }}>
      <div className="exp__stage">
        {items.map((e, i) => <ExpSlide key={e._id} i={i} n={n} u={u} item={e} />)}
        <h2 className="exp__title">{t('exp.title')}</h2>
        <div className="exp__count"><b>{String(act + 1).padStart(2, '0')}</b>/ {String(n).padStart(2, '0')}</div>
        <ol className="exp__dots">
          {items.map((e, i) => <li key={e._id}><button className={i === act ? 'on' : ''} onClick={() => go(i)} aria-label={String(i + 1)} /></li>)}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────── Destinations list with image reveal ───────────────────── */
function DestList() {
  const { t, l, to } = useLang();
  const items = useDestinations().slice(0, 6);
  const [active, setActive] = useState(0); // the first destination's photo is shown by default
  return (
    <section className="dl">
      <div className="dl__bg">
        {items.map((d, idx) => (<img key={d._id} src={img(d.image)} alt="" className={idx === active ? 'on' : ''} />))}
      </div>
      <p className="eyebrow dl__eyebrow">{t('dest.eyebrow')}</p>
      <ul className="dl__list">
        {items.map((d, idx) => (
          <motion.li key={d._id} initial={{ opacity: 0, y: 60, rotateX: -50 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true, margin: '-5%' }}
            transition={{ duration: 0.9, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={idx === active ? 'on' : ''} onMouseEnter={() => setActive(idx)}>
            {/* on touch screens (no hover) the name crossing the middle of the screen selects the photo */}
            <motion.i className="dl__spy" aria-hidden viewport={{ margin: '-45% 0px -45% 0px' }} onViewportEnter={() => window.matchMedia('(pointer: coarse)').matches && setActive(idx)} />
            <Link to={to(`/destinations/${d.slug}`)} data-cursor={t('show.open')}>
              <span className="dl__n">{String(idx + 1).padStart(2, '0')}</span>
              <span className="dl__name">{l(d.name)}</span>
              <span className="dl__tag">{l(d.tagline)}</span>
            </Link>
          </motion.li>
        ))}
      </ul>
      <div className="dl__cta"><Magnetic><Link className="btn light" to={to('/destinations')}>{t('dest.all')}</Link></Magnetic></div>
    </section>
  );
}

/* ───────────────────── Stats ───────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const c = animate(0, to, { duration: 2.2, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString() + suffix; } });
    return () => c.stop();
  }, [inView, to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

const FLIGHT = 'M0 150 C 180 150, 220 30, 400 50 S 620 190, 800 120 S 1080 20, 1200 70 S 1500 150, 1600 90';
function Stats() {
  const { t } = useLang();
  const ref = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  const plane = useRef<SVGGElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'end 40%'] });
  const prog = useSpring(scrollYProgress, { stiffness: 70, damping: 20 });
  useMotionValueEvent(prog, 'change', (v) => {
    const el = path.current, g = plane.current; if (!el || !g) return;
    const L = el.getTotalLength(), a = el.getPointAtLength(L * v), b = el.getPointAtLength(Math.min(L, L * v + 2));
    g.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI})`);
  });
  const st = useSettings().stats;
  const s = [
    { n: st.countries, k: 'stats.countries', suf: '' }, { n: st.hotels, k: 'stats.hotels', suf: '+' },
    { n: st.guests, k: 'stats.guests', suf: '+' }, { n: st.years, k: 'stats.years', suf: '' },
  ] as const;
  return (
    <section className="stats container" ref={ref}>
      <svg className="stats__flight" viewBox="0 0 1600 220" preserveAspectRatio="none" aria-hidden>
        <path d={FLIGHT} className="stats__ghost" />
        <motion.path ref={path} d={FLIGHT} className="stats__line" style={{ pathLength: prog }} />
        <g ref={plane}><path d="M16 0 L-10 -9 L-4 0 L-10 9 Z" fill="#e8553a" /></g>
      </svg>
      {s.map((x, i) => (
        <Reveal key={x.k} delay={i * 0.08}><div className="stats__item"><b><Counter to={x.n} suffix={x.suf} /></b><span>{t(x.k)}</span></div></Reveal>
      ))}
    </section>
  );
}

/* ───────────────────── Hotels ───────────────────── */
function HotelsRow() {
  const { t, l, to } = useLang();
  const hotels = useHotels().slice(0, 3);
  const dest = useDestinations();
  return (
    <section className="hot container">
      <div className="hot__head">
        <SplitText text={t('hotels.title')} className="hot__title" />
        <Reveal className="hot__sub"><p>{t('hotels.sub')}</p></Reveal>
      </div>
      <div className="hot__grid">
        {hotels.map((h) => {
          const d = dest.find((x) => x.slug === h.destinationSlug);
          return (
            <Depth key={h._id}>
              <TiltCard>
                <Link to={to(`/destinations/${h.destinationSlug}`)} className="hot__card" data-cursor={t('show.open')}>
                  <div className="hot__img"><img src={img(h.image)} alt={l(h.name)} /></div>
                  <div className="hot__info">
                    <span className="eyebrow">{l(d?.name)} · {'★'.repeat(h.stars)}</span>
                    <h3>{l(h.name)}</h3>
                    <p>{l(h.description)}</p>
                  </div>
                </Link>
              </TiltCard>
            </Depth>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────── News ───────────────────── */
function NewsRow() {
  const { t, l, to, lang } = useLang();
  const news = useNews().slice(0, 2);
  return (
    <section className="nws container">
      <div className="hot__head">
        <SplitText text={t('news.title')} className="hot__title" />
        <Reveal className="hot__sub"><p>{t('news.sub')}</p></Reveal>
      </div>
      <div className="nws__grid">
        {news.map((n, i) => (
          <Reveal key={n._id} delay={i * 0.12}>
            <Link to={to(`/news/${n.slug}`)} className="nws__card" data-cursor={t('detail.read')}>
              <div className="nws__img"><img src={img(n.image)} alt={l(n.title)} /></div>
              <time className="eyebrow">{new Date(n.date).toLocaleDateString(lang === 'az' ? 'az-AZ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
              <h3>{l(n.title)}</h3>
              <p>{l(n.excerpt)}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Contact ───────────────────── */
function Field({
  name, label, bad, type = 'text', maxLength,
}: { name: string; label: string; bad?: boolean; type?: string; maxLength: number }) {
  return (
    <label className={`field ${bad ? 'bad' : ''}`}>
      <input name={name} type={type} maxLength={maxLength} placeholder=" " aria-invalid={bad} />
      <span className="field__label">{label}</span>
      <i className="field__line" />
    </label>
  );
}

function Contact() {
  const { t, lang } = useLang();
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const local: Record<string, string> = {};
    if (!body.name?.trim() || body.name.trim().length < 2) local.name = '!';
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email)) local.email = '!';
    if (body.phone && !/^\+?[0-9 ()\-]{7,20}$/.test(body.phone)) local.phone = '!';
    if (!body.phone?.trim() && !body.email?.trim()) { local.phone = '!'; local.email = '!'; }
    setErrs(local);
    if (Object.keys(local).length) { setMsg(lang === 'en' ? 'Please enter your name and a valid phone or email.' : 'Adınızı və düzgün telefon və ya e-poçt yazın.'); setState('err'); return; }
    setState('sending'); setMsg('');
    try { await api('/inquiries', { method: 'POST', body: JSON.stringify(body) }); setState('ok'); form.reset(); }
    catch (er) {
      if (er instanceof ApiError) { setErrs(Object.fromEntries(Object.keys(er.errors).map((k) => [k, '!']))); if (er.status === 429) setMsg(er.message); }
      setState('err');
    }
  };
  return (
    <section className="cta">
      <div className="cta__glow cta__glow--warm" />
      <div className="cta__glow cta__glow--cool" />
      <div className="cta__grain" />
      <div className="container cta__in">
        <div>
          <Reveal><span className="cta__eyebrow">{lang === 'en' ? 'Contact' : 'Əlaqə'}</span></Reveal>
          <SplitText text={t('contact.title')} className="cta__title" />
          <Reveal><p className="cta__sub">{t('contact.sub')}</p></Reveal>
        </div>
        <Reveal delay={0.1}>
          <form className="cta__form" onSubmit={submit} noValidate>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden style={{ position: 'absolute', left: '-9999px', opacity: 0 }} />
            <Field name="name" label={t('form.name')} maxLength={120} bad={!!errs.name} />
            <div className="cta__row">
              <Field name="phone" label={t('form.phone')} maxLength={30} bad={!!errs.phone} />
              <Field name="email" type="email" label={t('form.email')} maxLength={160} bad={!!errs.email} />
            </div>
            <label className="field field--area">
              <textarea name="message" rows={3} maxLength={2000} placeholder=" " />
              <span className="field__label">{t('form.message')}</span>
              <i className="field__line" />
            </label>
            <Magnetic>
              <button className="btn light cta__btn" disabled={state === 'sending'}>
                <span>{t('form.send')}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </Magnetic>
            {state === 'ok' && <p className="cta__msg">{t('form.sent')}</p>}
            {state === 'err' && <p className="cta__msg err">{msg || t('form.error')}</p>}
          </form>
        </Reveal>
      </div>
    </section>
  );
}
export default function Home() {
  const { l } = useLang();
  const names = useDestinations().map((d) => l(d.name));
  return (
    <>
      <Hero />
      <Marquee items={names} />
      <Portal />
      <Showcase />
      <Experience />
      <DestList />
      <Stats />
      <HotelsRow />
      <NewsRow />
      <Contact />
    </>
  );
}