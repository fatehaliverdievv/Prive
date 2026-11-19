import { useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLang } from '../../i18n/LangContext';
import { useDestinations, useHotels } from '../../lib/data';
import { img } from '../../lib/api';
import SplitText from '../../components/SplitText';
import Reveal from '../../components/Reveal';
import TiltCard from '../../components/TiltCard';
import './page.scss';

export default function DestinationDetail() {
  const { slug } = useParams();
  const { t, l, to } = useLang();
  const all = useDestinations();
  const hotels = useHotels().filter((h) => h.destinationSlug === slug);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.3]);
  const tY = useTransform(scrollYProgress, [0, 1], ['0%', '-60%']);

  const idx = all.findIndex((d) => d.slug === slug);
  if (idx < 0) return all.length ? <Navigate to={to('/destinations')} replace /> : null;
  const d = all[idx];
  const next = all[(idx + 1) % all.length];

  return (
    <article className="dd">
      <section className="dd__hero" ref={ref}>
        <motion.img src={img(d.image)} alt="" style={{ y, scale }} />
        <div className="dd__shade" />
        <motion.div className="dd__title" style={{ y: tY }}>
          <span>{t('detail.welcome')}</span>
          <SplitText as="h1" text={l(d.name).toUpperCase()} immediate delay={0.2} />
        </motion.div>
      </section>

      <section className="container dd__body">
        <Reveal><p className="eyebrow">{l(d.tagline)}</p></Reveal>
        <SplitText as="p" text={l(d.description)} className="dd__lead" />
      </section>

      {hotels.length > 0 && (
        <section className="container dd__hotels">
          <SplitText text={t('detail.hotels')} className="dd__h2" />
          <div className="dd__grid">
            {hotels.map((h, i) => (
              <Reveal key={h._id} delay={i * 0.1}>
                <TiltCard>
                  <div className="dd__hotel">
                    <img src={img(h.image)} alt={l(h.name)} />
                    <div><span className="eyebrow">{'★'.repeat(h.stars)}</span><h3>{l(h.name)}</h3><p>{l(h.description)}</p></div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <Link to={to(`/destinations/${next.slug}`)} className="dd__next" data-cursor={t('show.open')}>
        <img src={img(next.image)} alt="" />
        <span>{l(next.name)} →</span>
      </Link>
    </article>
  );
}
