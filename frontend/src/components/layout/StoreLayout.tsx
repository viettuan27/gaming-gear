import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Footer } from './Footer';
import { CategoryMenuOverlay } from './CategoryMenuOverlay';
import { StoreHeader } from './StoreHeader';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

export interface CategoryMenuOutletContext {
  categoryMenuOpen: boolean;
  closeCategoryMenu: () => void;
}

export function StoreLayout() {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const { pathname } = useLocation();

  function closeCategoryMenu() {
    setCategoryMenuOpen(false);
  }

  return (
    <div className="store-shell">
      <ScrollToTop />
      <StoreHeader
        categoryMenuOpen={categoryMenuOpen}
        onToggleCategoryMenu={() => setCategoryMenuOpen((current) => !current)}
        onCloseCategoryMenu={closeCategoryMenu}
      />
      <main className="store-main">
        <Outlet context={{ categoryMenuOpen, closeCategoryMenu } satisfies CategoryMenuOutletContext} />
      </main>
      {categoryMenuOpen && pathname !== '/' && <CategoryMenuOverlay onClose={closeCategoryMenu} />}
      <Footer />
    </div>
  );
}
