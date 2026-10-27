import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { StoreLayout } from './components/layout/StoreLayout';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { StaticPageView } from './pages/StaticPageView';
import { StaticPagesPage } from './pages/StaticPagesPage';
import { NotFoundPage } from './pages/NotFoundPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<CatalogPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="cart" element={<RequireAuth><CartPage /></RequireAuth>} />
        <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="orders/:orderId" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/:slug" element={<ArticleDetailPage />} />
        <Route path="pages" element={<StaticPagesPage />} />
        <Route path="pages/:slug" element={<StaticPageView />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
