import { useLang } from '../../i18n/LangContext';
import { useAgencies } from '../../lib/data';
import SplitText from '../../components/SplitText';
import Reveal from '../../components/Reveal';
import './page.scss';

export default function Agencies() {
  const { t, l } = useLang();
  const items = useAgencies();
  return (
    <div className="container page-top ag">
      <SplitText as="h1" text={t('agencies.title')} className="page-title" immediate />
      <p className="ag__sub">{t('agencies.sub')}</p>
      <div className="ag__grid">
        {items.map((a, i) => (
          <Reveal key={a._id} delay={i * 0.08}>
            <div className="ag__card">
              <h3>{l(a.city)}</h3>
              <p>{l(a.address)}</p>
              <a href={`tel:${a.phone.replace(/\s/g, '')}`}>{a.phone}</a>
              <a href={`mailto:${a.email}`}>{a.email}</a>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
