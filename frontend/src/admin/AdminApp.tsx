import { useCallback, useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { adm, auth } from './api';
import { ConfirmHost, Toaster } from './ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inquiries from './pages/Inquiries';
import Texts from './pages/Texts';
import Media from './pages/Media';
import Settings from './pages/Settings';
import Account from './pages/Account';
import { Agencies, Destinations, Experiences, Hotels, NewsPage } from './pages/content';
import './admin.scss';

interface Me { id: string; email: string; name: string }

const NAV: { title: string; items: [string, string][] }[] = [
  { title: 'Ümumi', items: [['/admin', 'Panel'], ['/admin/inquiries', 'Müraciətlər']] },
  { title: 'Məzmun', items: [['/admin/destinations', 'İstiqamətlər'], ['/admin/hotels', 'Otellər'], ['/admin/news', 'Xəbərlər'], ['/admin/experiences', 'Təcrübələr'], ['/admin/agencies', 'Agentliklər']] },
  { title: 'Sayt', items: [['/admin/texts', 'Mətnlər'], ['/admin/media', 'Şəkillər'], ['/admin/settings', 'Ayarlar']] },
];

function Shell({ me, unread, refresh }: { me: Me; unread: number; refresh: () => void }) {
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [pathname]);
  const logout = () => { auth.clear(); nav('/admin/login', { replace: true }); };
  return (
    <div className="a-shell">
      <header className="a-top"><button className="a-burger" onClick={() => setMenu(true)} aria-label="Menyu">☰</button><img src="/images/logo-dark.png" alt="Privé DMC" /></header>
      {menu && <div className="a-scrim" onClick={() => setMenu(false)} />}
      <aside className={`a-side ${menu ? 'open' : ''}`}>
        <NavLink to="/admin" className="a-side__logo"><img src="/images/logo-dark.png" alt="Privé DMC" /></NavLink>
        <nav>
          {NAV.map((g) => (
            <div key={g.title}>
              <p>{g.title}</p>
              {g.items.map(([to, n]) => (
                <NavLink key={to} to={to} end={to === '/admin'}>{n}{to === '/admin/inquiries' && unread > 0 && <b className="a-badge">{unread}</b>}</NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="a-side__foot">
          <a href="/az" target="_blank" rel="noreferrer">Sayta bax ↗</a>
          <NavLink to="/admin/account" className="me"><span>{me.name}</span><small>{me.email}</small></NavLink>
          <button onClick={logout}>Çıxış</button>
        </div>
      </aside>
      <main className="a-main">
        <Routes>
          <Route index element={<Dashboard name={me.name} />} />
          <Route path="inquiries" element={<Inquiries onChange={refresh} />} />
          <Route path="destinations" element={<Destinations />} />
          <Route path="hotels" element={<Hotels />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="experiences" element={<Experiences />} />
          <Route path="agencies" element={<Agencies />} />
          <Route path="texts" element={<Texts />} />
          <Route path="media" element={<Media />} />
          <Route path="settings" element={<Settings />} />
          <Route path="account" element={<Account me={me} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Guard() {
  const nav = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [unread, setUnread] = useState(0);
  const refresh = useCallback(() => { adm<{ unread: number }>('/stats').then((s) => setUnread(s.unread)).catch(() => {}); }, []);
  useEffect(() => {
    if (!auth.get()) { nav('/admin/login', { replace: true }); return; }
    adm<Me>('/auth/me').then((m) => { setMe(m); refresh(); }).catch(() => nav('/admin/login', { replace: true }));
    const out = () => nav('/admin/login', { replace: true });
    window.addEventListener('pt-logout', out); return () => window.removeEventListener('pt-logout', out);
  }, [nav, refresh]);
  if (!me) return <div className="a-boot"><div className="a-spin" /></div>;
  return <Shell me={me} unread={unread} refresh={refresh} />;
}

export default function AdminApp() {
  useEffect(() => {
    document.body.classList.add('is-admin');
    const prev = document.title; document.title = 'Privé · Admin';
    return () => { document.body.classList.remove('is-admin'); document.title = prev; };
  }, []);
  return (
    <div className="admin">
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="*" element={<Guard />} />
      </Routes>
      <Toaster /><ConfirmHost />
    </div>
  );
}
