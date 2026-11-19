import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLang } from '../../i18n/LangContext';
import { useSettings } from '../../lib/content';
import { img } from '../../lib/api';
import SplitText from '../../components/SplitText';
import Reveal from '../../components/Reveal';
import './page.scss';

export default function About() {
  const { t } = useLang();
  const site = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);
  const rot = useTransform(scrollYProgress, [0, 1], [-4, 4]);
  return (
    <div className="about">
      <div className="container page-top">
        <SplitText as="h1" text={t('about.title')} className="page-title" immediate />
      </div>
      <div className="container about__grid">
        <Reveal><p className="about__lead">{t('about.p1')}</p></Reveal>
        <div className="about__media" ref={ref}>
          <motion.img src={img(site.aboutImage)} alt="" style={{ y, rotate: rot, scale: 1.25 }} />
        </div>
        <Reveal><p className="about__p">{t('about.p2')}</p></Reveal>
      </div>
    </div>
  );
}
