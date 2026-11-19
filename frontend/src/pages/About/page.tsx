import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type PointerEvent,
} from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion';
import { useLang } from '../../i18n/LangContext';
import { useSettings } from '../../lib/content';
import { img } from '../../lib/api';
import './page.scss';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const RING_WORDS = [
  'PRIVÉ',
  'LUXURY',
  'TRAVEL',
  'ESCAPE',
  'JOURNEY',
  'ELEGANCE',
];

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const STATS = [
  {
    to: 15,
    key: 'about.stat1',
    en: 'Years of experience',
    az: 'İllik təcrübə',
  },
  {
    to: 40,
    key: 'about.stat2',
    en: 'Destinations',
    az: 'İstiqamət',
  },
  {
    to: 5000,
    key: 'about.stat3',
    en: 'Happy travelers',
    az: 'Məmnun səyyah',
  },
] as const;

function subscribeToMotionPreference(notify: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);

  media.addEventListener('change', notify);

  return () => media.removeEventListener('change', notify);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
}

const wordVariants: Variants = {
  hidden: {
    y: '80%',
    rotateX: -65,
    opacity: 0,
  },
  visible: {
    y: '0%',
    rotateX: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: EASE,
    },
  },
};

function Words3D({
  text,
  className,
  reduce,
}: {
  text: string;
  className: string;
  reduce: boolean;
}) {
  const words = text.trim().split(/\s+/);

  if (reduce) {
    return <p className={className}>{text}</p>;
  }

  return (
    <motion.p
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: Math.min(0.025, 0.5 / words.length),
          },
        },
      }}
    >
      {words.map((word, index) => (
        <span
          className="about__word"
          aria-hidden="true"
          key={`${index}-${word}`}
        >
          <motion.span
            className="about__word-inner"
            variants={wordVariants}
            style={{
              transformPerspective: 700,
              transformOrigin: '50% 100%',
            }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </motion.p>
  );
}

function Stat({
  to,
  label,
  index,
  locale,
  reduce,
}: {
  to: number;
  label: string;
  index: number;
  locale: string;
  reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const inView = useInView(ref, {
    once: true,
    amount: 0.5,
  });

  const value = useMotionValue(reduce ? to : 0);

  const formatted = useTransform(value, (current) =>
    Math.round(current).toLocaleString(locale),
  );

  useEffect(() => {
    if (reduce) {
      value.set(to);
      return;
    }

    if (!inView) return;

    const controls = animate(value, to, {
      duration: 1.7,
      delay: index * 0.08,
      ease: EASE,
    });

    return () => controls.stop();
  }, [inView, reduce, value, to, index]);

  return (
    <motion.div
      ref={ref}
      className="about__stat"
      initial={reduce ? false : { opacity: 0, y: 22 }}
      animate={reduce || inView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: reduce ? 0 : 0.65,
        delay: reduce ? 0 : index * 0.08,
        ease: EASE,
      }}
    >
      <dt className="about__stat-label">{label}</dt>

      <dd className="about__stat-num">
        <span className="about__sr-only">
          {to.toLocaleString(locale)}+
        </span>

        <span className="about__stat-value" aria-hidden="true">
          <motion.span>{formatted}</motion.span>
          <span className="about__stat-plus">+</span>
        </span>
      </dd>
    </motion.div>
  );
}

function Portrait({
  source,
  reduce,
}: {
  source: string;
  reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    ['-5%', '5%'],
  );

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, {
    stiffness: 140,
    damping: 25,
  });

  const smoothY = useSpring(mouseY, {
    stiffness: 140,
    damping: 25,
  });

  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5]);

  const lightX = useTransform(
    smoothX,
    [-0.5, 0.5],
    ['0%', '100%'],
  );

  const lightY = useTransform(
    smoothY,
    [-0.5, 0.5],
    ['0%', '100%'],
  );

  const glare = useMotionTemplate`
    radial-gradient(
      ellipse at ${lightX} ${lightY},
      rgba(255, 245, 218, 0.27),
      transparent 64%
    )
  `;

  function reset() {
    mouseX.set(0);
    mouseY.set(0);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType !== 'mouse') return;

    const bounds = event.currentTarget.getBoundingClientRect();

    mouseX.set(
      (event.clientX - bounds.left) / bounds.width - 0.5,
    );

    mouseY.set(
      (event.clientY - bounds.top) / bounds.height - 0.5,
    );
  }

  return (
    <div className="about__portrait" ref={ref}>
      <motion.div
        className="about__scene"
        initial={
          reduce
            ? false
            : {
                opacity: 0,
                y: 35,
                rotateX: 9,
              }
        }
        whileInView={{
          opacity: 1,
          y: 0,
          rotateX: 0,
        }}
        animate={
          reduce
            ? {
                opacity: 1,
                y: 0,
                rotateX: 0,
              }
            : undefined
        }
        viewport={{ once: true, amount: 0.18 }}
        transition={{
          duration: reduce ? 0 : 1.1,
          ease: EASE,
        }}
        style={
          reduce
            ? undefined
            : { transformPerspective: 1100 }
        }
      >
        <div
          className="about__photo-outline"
          aria-hidden="true"
        />

        <motion.div
          className="about__tilt"
          onPointerMove={move}
          onPointerLeave={reset}
          onPointerCancel={reset}
          style={
            reduce
              ? undefined
              : {
                  rotateX,
                  rotateY,
                  transformPerspective: 1100,
                }
          }
        >
          <div className="about__media">
            <motion.img
              src={source}
              alt=""
              decoding="async"
              style={
                reduce
                  ? { scale: 1.02, y: 0 }
                  : { y: imageY, scale: 1.16 }
              }
            />

            {!reduce && (
              <motion.span
                className="about__glare"
                style={{ background: glare }}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function WordRing({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rotation = useTransform(
    scrollYProgress,
    [0, 1],
    [-55, 165],
  );

  return (
    <div
      className="about__ring"
      ref={ref}
      aria-hidden="true"
    >
      <div className="about__ring-orbit" />

      <div className="about__ring-stage">
        <motion.div
          className="about__ring-track"
          style={{ rotateY: reduce ? 0 : rotation }}
        >
          {RING_WORDS.map((word, index) => (
            <span
              className="about__ring-item"
              key={word}
              style={{
                transform: `
                  rotateY(${(index * 360) / RING_WORDS.length}deg)
                  translateZ(var(--about-ring-radius))
                `,
              }}
            >
              {word}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default function About() {
  const { t, lang } = useLang();
  const site = useSettings();
  const reduce = useReducedMotion();

  const locale = lang === 'az' ? 'az-AZ' : 'en-US';

  function statLabel(stat: (typeof STATS)[number]) {
    const value = t(stat.key as Parameters<typeof t>[0]);

    return !value || value === stat.key
      ? lang === 'az'
        ? stat.az
        : stat.en
      : value;
  }

  return (
    <div className="about">
      <div className="container about__container">
        <header className="about__header">
          <motion.h1
            className="about__title"
            initial={
              reduce ? false : { opacity: 0, y: 20 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0 : 0.85,
              ease: EASE,
            }}
          >
            {t('about.title')}
          </motion.h1>

          <span
            className="about__header-mark"
            aria-hidden="true"
          />
        </header>

        <div className="about__grid">
          <Portrait
            source={img(site.aboutImage)}
            reduce={reduce}
          />

          <div className="about__story">
            <Words3D
              text={t('about.p1')}
              className="about__lead"
              reduce={reduce}
            />

            <motion.div
              className="about__body"
              initial={
                reduce
                  ? false
                  : { opacity: 0, y: 20 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              animate={
                reduce
                  ? { opacity: 1, y: 0 }
                  : undefined
              }
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: reduce ? 0 : 0.85,
                ease: EASE,
              }}
            >
              <span
                className="about__story-line"
                aria-hidden="true"
              />

              <p className="about__p">
                {t('about.p2')}
              </p>
            </motion.div>
          </div>
        </div>

        <dl className="about__stats">
          {STATS.map((stat, index) => (
            <Stat
              key={stat.key}
              to={stat.to}
              label={statLabel(stat)}
              index={index}
              locale={locale}
              reduce={reduce}
            />
          ))}
        </dl>
      </div>

      <WordRing reduce={reduce} />
    </div>
  );
}