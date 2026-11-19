import { useEffect, useRef, type MouseEvent } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useReducedMotion,
  useInView,
  animate,
} from 'framer-motion';
import { useLang } from '../../i18n/LangContext';
import { useSettings } from '../../lib/content';
import { img } from '../../lib/api';
import SplitText from '../../components/SplitText';
import './page.scss';

const RING_WORDS = ['PRIVÉ', 'LUXURY', 'TRAVEL', 'ESCAPE', 'JOURNEY', 'ELEGANCE'];
const RING_ITEM_W = 360;
/* radius = (itemWidth / 2) / tan(PI / count) + boşluq */
const RING_RADIUS = Math.round(RING_ITEM_W / 2 / Math.tan(Math.PI / RING_WORDS.length)) + 30;

const EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

/* Hər sözü 3D flip ilə gətirir.
   Paraqrafın özü izlənir (sözlər yox), çünki rotateX -90 olanda söz 0px hündürlüyə düşür
   və IntersectionObserver onu görmür. */
const wordsParent = {
  hidden: {},
  show: (reduce: boolean) => ({ transition: { staggerChildren: reduce ? 0 : 0.03 } }),
};
const wordChild = {
  hidden: { rotateX: -80, y: '60%', opacity: 0 },
  show: { rotateX: 0, y: '0%', opacity: 1, transition: { duration: 1, ease: EASE } },
};

function Words3D({ text, className }: { text: string; className?: string }) {
  const reduce = !!useReducedMotion();
  return (
    <motion.p
      className={className}
      variants={wordsParent}
      custom={reduce}
      initial={reduce ? 'show' : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      {text.split(' ').map((w, i) => (
        <span className="w3d" key={i}>
          <motion.span
            className="w3d__inner"
            variants={wordChild}
            style={{ transformPerspective: 900, transformOrigin: '50% 100%' }}
          >
            {w}
          </motion.span>{' '}
        </span>
      ))}
    </motion.p>
  );
}

/* Saygac ilə rəqəm: görünəndə 0-dan hədəfə qədər sayır */
const STATS = [
  { to: 15, suffix: '+', key: 'about.stat1', fb: 'Years of experience' },
  { to: 40, suffix: '+', key: 'about.stat2', fb: 'Destinations' },
  { to: 5000, suffix: '+', key: 'about.stat3', fb: 'Happy travelers' },
];

function Stat({ to, suffix, label, index }: { to: number; suffix: string; label: string; index: number }) {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const mv = useMotionValue(reduce ? to : 0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString('en-US'));

  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(mv, to, { duration: 2.2, delay: index * 0.15, ease: EASE });
    return () => c.stop();
  }, [inView, reduce, mv, to, index]);

  return (
    <motion.div
      ref={ref}
      className="about__stat"
      initial={reduce ? false : { opacity: 0, rotateX: -50, y: 30 }}
      animate={inView ? { opacity: 1, rotateX: 0, y: 0 } : undefined}
      transition={{ duration: 1, delay: index * 0.15, ease: EASE }}
      style={{ transformPerspective: 900, transformOrigin: '50% 100%' }}
    >
      <span className="about__stat-num">
        <motion.span>{text}</motion.span>
        {suffix}
      </span>
      <span className="about__stat-label">{label}</span>
    </motion.div>
  );
}

export default function About() {
  const { t } = useLang();
  const site = useSettings();
  const reduce = useReducedMotion();
  /* i18n açarı yoxdursa ingiliscə mətn göstərilir */
  const tr = (key: string, fb: string) => {
    const v = t(key);
    return !v || v === key ? fb : v;
  };

  /* ---------- Şəkil: scroll parallax (yalnız şəklin içində) ---------- */
  const mediaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: mediaRef, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '8%']);

  /* ---------- Şəkil: mouse ilə 3D tilt ---------- */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.6 });

  const tiltY = useTransform(sx, [-0.5, 0.5], [-8, 8]);
  const tiltX = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const gx = useTransform(sx, [-0.5, 0.5], ['0%', '100%']);
  const gy = useTransform(sy, [-0.5, 0.5], ['0%', '100%']);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,.28), transparent 60%)`;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  /* ---------- 3D halqa: scroll ilə fırlanır ---------- */
  const ringRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: ringP } = useScroll({ target: ringRef, offset: ['start end', 'end start'] });
  const ringRot = useTransform(ringP, [0, 1], reduce ? [0, 0] : [-90, 200]);

  return (
    <div className="about">
      <div className="container page-top">
        <SplitText as="h1" text={t('about.title')} className="page-title" immediate />
      </div>

      <div className="container about__grid">
        <Words3D text={t('about.p1')} className="about__lead" />

        {/* Giriş: aşağıdan yatıq vəziyyətdən düzəlir, sonra qalır */}
        <motion.div
          className="about__scene"
          initial={reduce ? false : { opacity: 0, rotateX: 22, y: 70 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: '-12% 0px' }}
          transition={{ duration: 1.2, ease: EASE }}
          style={{ transformPerspective: 1200 }}
        >
          <motion.div
            className="about__tilt"
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1000 }}
          >
            <div className="about__media" ref={mediaRef}>
              <motion.img src={img(site.aboutImage)} alt="" style={{ y: imgY, scale: 1.2 }} />
              <motion.span className="about__glare" style={{ background: glare }} />
            </div>
          </motion.div>
        </motion.div>

        <div className="about__side">
          <div className="about__stats">
            {STATS.map((st, i) => (
              <Stat key={st.key} to={st.to} suffix={st.suffix} label={tr(st.key, st.fb)} index={i} />
            ))}
          </div>

          <motion.div
            className="about__pwrap"
            initial={reduce ? false : { opacity: 0, rotateY: 35, x: 40 }}
            whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 1.1, ease: EASE }}
            style={{ transformPerspective: 1000, transformOrigin: '0% 50%' }}
          >
            <p className="about__p">{t('about.p2')}</p>
          </motion.div>
        </div>
      </div>

      {/* Scroll ilə fırlanan 3D halqa */}
      <div className="about__ring" ref={ringRef} aria-hidden="true">
        <div className="about__ring-stage">
          <motion.div className="about__ring-track" style={{ rotateY: ringRot }}>
            {RING_WORDS.map((w, i) => (
              <span
                key={i}
                className="about__ring-item"
                style={{
                  transform: `rotateY(${(360 / RING_WORDS.length) * i}deg) translateZ(${RING_RADIUS}px)`,
                }}
              >
                {w}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}