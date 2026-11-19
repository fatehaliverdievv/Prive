import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/LangContext';
import { useDestinations } from '../../lib/data';
import { img } from '../../lib/api';
import SplitText from '../../components/SplitText';
import Reveal from '../../components/Reveal';
import TiltCard from '../../components/TiltCard';
import './page.scss';

export default function Destinations() {
  const { t, l, to } = useLang();
  const items = useDestinations();
  return (
    <div className="container page-top dests">
      <SplitText as="h1" text={t('nav.destinations')} className="page-title" immediate />
      <div className="dests__grid">
        {items.map((d, i) => (
          <Reveal key={d._id} delay={(i % 3) * 0.08}>
            <TiltCard>
              <Link to={to(`/destinations/${d.slug}`)} className="dests__card" data-cursor={t('show.open')}>
                <img src={img(d.image)} alt={l(d.name)} />
                <div><small>{String(i + 1).padStart(2, '0')}</small><h3>{l(d.name)}</h3><span>{l(d.tagline)}</span></div>
              </Link>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
