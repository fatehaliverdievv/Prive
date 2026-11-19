import { Link, Navigate, useParams } from 'react-router-dom';
import { useLang } from '../../i18n/LangContext';
import { useNews } from '../../lib/data';
import { img } from '../../lib/api';
import SplitText from '../../components/SplitText';
import Reveal from '../../components/Reveal';
import './page.scss';

export default function NewsDetail() {
  const { slug } = useParams();
  const { t, l, to, lang } = useLang();
  const all = useNews();
  const n = all.find((x) => x.slug === slug);
  if (!n) return all.length ? <Navigate to={to('/news')} replace /> : null;
  return (
    <article className="container page-top nd">
      <Link to={to('/news')} className="nd__back">← {t('detail.back')}</Link>
      <time className="eyebrow">{new Date(n.date).toLocaleDateString(lang === 'az' ? 'az-AZ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
      <SplitText as="h1" text={l(n.title)} className="nd__title" immediate />
      <Reveal><div className="nd__img"><img src={img(n.image)} alt={l(n.title)} /></div></Reveal>
      <Reveal><div className="nd__text">{l(n.content).split('\n').map((p, i) => (<p key={i}>{p}</p>))}</div></Reveal>
    </article>
  );
}
