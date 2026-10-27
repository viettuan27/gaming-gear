import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Footer } from './Footer';
import { StoreHeader } from './StoreHeader';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

export function StoreLayout() {
  return (
    <div className="store-shell">
      <ScrollToTop />
      <StoreHeader />
      <main className="store-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
