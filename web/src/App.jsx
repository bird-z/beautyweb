import { useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Space from './components/Space.jsx';
import { Footer, Header, Menu } from './components/Chrome.jsx';
import { sectionOf, ORG } from './data/site.js';
import { usePointerGlow } from './lib/hooks.js';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Org from './pages/Org.jsx';
import Science from './pages/Science.jsx';
import Events from './pages/Events.jsx';
import Members from './pages/Members.jsx';
import Wall from './pages/Wall.jsx';
import Studios from './pages/Studios.jsx';
import Join from './pages/Join.jsx';
import { NewsIndex, NewsDetail } from './pages/News.jsx';
import { PopularIndex, PopularDetail } from './pages/Popular.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  usePointerGlow();

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
    const d = sectionOf(pathname);
    document.title = d ? `${d.title} · ${ORG.name} BioQif` : `${ORG.name} BioQif · 启迪生命 扉向未来`;
  }, [pathname]);

  return (
    <>
      <Space />
      <a className="skip" href="#main">跳到正文</a>
      <Header menuOpen={menuOpen} onMenu={() => setMenuOpen((o) => !o)} />
      <Menu open={menuOpen} onClose={closeMenu} />
      <main id="main" key={pathname} className="route" inert={menuOpen || undefined}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/org" element={<Org />} />
          <Route path="/news" element={<NewsIndex />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/science" element={<Science />} />
          <Route path="/events" element={<Events />} />
          <Route path="/members" element={<Members />} />
          <Route path="/wall" element={<Wall />} />
          <Route path="/popular" element={<PopularIndex />} />
          <Route path="/popular/:id" element={<PopularDetail />} />
          <Route path="/studios" element={<Studios />} />
          <Route path="/join" element={<Join />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
