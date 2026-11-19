import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LangContext';
import { useNews } from '../../lib/data';
import { img } from '../../lib/api';
import SplitText from '../../components/SplitText';
import Reveal from '../../components/Reveal';
import './page.scss';

export default function News() {
  const { t, l, to, lang } = useLang();
  const news = useNews();
  return (
    <div className="container page-top news">
      <SplitText as="h1" text={t('nav.news')} className="page-title" immediate />
      <div className="news__list">
        {news.map((n, i) => (
          <Reveal key={n._id} delay={0.05}>
            <Link to={to(`/news/${n.slug}`)} className="news__row" data-cursor={t('detail.read')}>
              <span className="news__i">{String(i + 1).padStart(2, '0')}</span>
              <div><time className="eyebrow">{new Date(n.date).toLocaleDateString(lang === 'az' ? 'az-AZ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                <h3>{l(n.title)}</h3><p>{l(n.excerpt)}</p></div>
              <div className="news__img"><img src={img(n.image)} alt={l(n.title)} /></div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
