import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LangContext';
import { useDestinations, useHotels } from '../../lib/data';
import { img } from '../../lib/api';
import SplitText from '../../components/SplitText';
import Reveal from '../../components/Reveal';
import TiltCard from '../../components/TiltCard';
import './page.scss';

export default function Hotels() {
  const { t, l, to } = useLang();
  const hotels = useHotels();
  const dest = useDestinations();
  return (
    <div className="container page-top hotels">
      <SplitText as="h1" text={t('nav.hotels')} className="page-title" immediate />
      <p className="hotels__sub">{t('hotels.sub')}</p>
      {hotels.length === 0 && <p className="empty">{t('common.empty')}</p>}
      <div className="hotels__grid">
        {hotels.map((h, i) => (
          <Reveal key={h._id} delay={(i % 3) * 0.08}>
            <TiltCard>
              <Link to={to(`/destinations/${h.destinationSlug}`)} className="hotels__card" data-cursor={t('show.open')}>
                <img src={img(h.image)} alt={l(h.name)} />
                <div>
                  <span className="eyebrow">{l(dest.find((d) => d.slug === h.destinationSlug)?.name)} · {'★'.repeat(h.stars)}</span>
                  <h3>{l(h.name)}</h3><p>{l(h.description)}</p>
                </div>
              </Link>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
