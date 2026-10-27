import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { adminApi } from '../api/services';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminCatalogPage } from '../pages/admin/AdminCatalogPage';
import { AdminCmsPage } from '../pages/admin/AdminCmsPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminLoginPage } from './AdminLoginPage';
import { useAdminAuth } from './auth/AdminAuthContext';

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { clearSession, isAdmin } = useAdminAuth();
  const location = useLocation();
  const sessionQuery = useQuery({
    queryKey: ['admin', 'session-validation'],
    queryFn: adminApi.getCategories,
    enabled: isAdmin,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (sessionQuery.isError) {
      clearSession();
    }
  }, [clearSession, sessionQuery.isError]);

  if (!isAdmin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (sessionQuery.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-white">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">Nova Gear Admin</p>
          <p className="mt-3 text-lg font-semibold">Đang xác minh phiên quản trị...</p>
        </div>
      </main>
    );
  }

  if (sessionQuery.isError) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ message: 'Không thể xác minh phiên quản trị. Vui lòng đăng nhập lại.' }}
      />
    );
  }

  return children;
}

export function AdminApp() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="catalog" element={<AdminCatalogPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="cms" element={<AdminCmsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
