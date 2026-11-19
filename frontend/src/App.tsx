import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import { defaultLang } from './i18n/LangContext';
import Home from './pages/Home/page';
import Destinations from './pages/Destinations/page';
import DestinationDetail from './pages/DestinationDetail/page';
import Hotels from './pages/Hotels/page';
import News from './pages/News/page';
import NewsDetail from './pages/NewsDetail/page';
import About from './pages/About/page';
import Agencies from './pages/Agencies/page';
import AdminApp from './admin/AdminApp';

export default function App() {
  const { pathname } = useLocation();
  // /admin/hotels etc. would otherwise lose to the public /:lang/hotels route, so admin gets its own router
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <Routes><Route path="/admin/*" element={<AdminApp />} /></Routes>;
  }
  return (
    <Routes>
      <Route path="/:lang" element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="destinations/:slug" element={<DestinationDetail />} />
        <Route path="hotels" element={<Hotels />} />
        <Route path="news" element={<News />} />
        <Route path="news/:slug" element={<NewsDetail />} />
        <Route path="about" element={<About />} />
        <Route path="agencies" element={<Agencies />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${defaultLang()}`} replace />} />
    </Routes>
  );
}
