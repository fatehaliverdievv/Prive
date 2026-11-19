import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adm, fmtDate, ApiError } from '../api';
import { PageHead, Spinner, toast } from '../ui';

interface Inq { _id: string; name: string; phone?: string; email?: string; message?: string; read?: boolean; createdAt: string }
interface Stats { destinations: number; hotels: number; news: number; agencies: number; experiences: number; inquiries: number; unread: number; recent: Inq[] }

export default function Dashboard({ name }: { name: string }) {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { adm<Stats>('/stats').then(setS).catch((e: ApiError) => toast(e.message, 'err')); }, []);
  const h = new Date().getHours();
  const hello = h < 6 ? 'Gecəniz xeyir' : h < 12 ? 'Sabahınız xeyir' : h < 18 ? 'Günortanız xeyir' : 'Axşamınız xeyir';
  const cards: [string, keyof Stats, string][] = [
    ['İstiqamətlər', 'destinations', '/admin/destinations'], ['Otellər', 'hotels', '/admin/hotels'], ['Xəbərlər', 'news', '/admin/news'],
    ['Təcrübələr', 'experiences', '/admin/experiences'], ['Agentliklər', 'agencies', '/admin/agencies'],
  ];
  return (
    <>
      <PageHead title={`${hello}, ${name}`} sub="Saytınızın bütün məzmunu buradan idarə olunur." actions={<a className="a-btn ghost" href="/az" target="_blank" rel="noreferrer">Sayta bax ↗</a>} />
      {!s ? <Spinner /> : (
        <>
          <div className="a-stats">
            <Link to="/admin/inquiries" className={`a-stat accent ${s.unread ? 'hot' : ''}`}>
              <small>Yeni müraciət</small><b>{s.unread}</b><span>cəmi {s.inquiries}</span>
            </Link>
            {cards.map(([n, k, to]) => (<Link key={k} to={to} className="a-stat"><small>{n}</small><b>{s[k] as number}</b><span>idarə et →</span></Link>))}
          </div>

          <div className="a-two">
            <section className="a-card">
              <div className="a-card__head"><h2>Son müraciətlər</h2><Link className="a-link" to="/admin/inquiries">Hamısı →</Link></div>
              {s.recent.length === 0 ? <p className="a-hint">Hələ müraciət yoxdur.</p> : (
                <ul className="a-list">
                  {s.recent.map((r) => (
                    <li key={r._id}><Link to="/admin/inquiries">
                      <i className={r.read ? '' : 'dot'} /><div><b>{r.name}</b><span>{r.message || r.phone || r.email || '—'}</span></div><time>{fmtDate(r.createdAt)}</time>
                    </Link></li>
                  ))}
                </ul>
              )}
            </section>
            <section className="a-card">
              <div className="a-card__head"><h2>Sürətli keçidlər</h2></div>
              <div className="a-quick">
                <Link to="/admin/texts">Sayt mətnlərini dəyiş</Link>
                <Link to="/admin/settings">Əlaqə və statistika</Link>
                <Link to="/admin/media">Şəkil kitabxanası</Link>
                <Link to="/admin/destinations">Yeni istiqamət</Link>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
