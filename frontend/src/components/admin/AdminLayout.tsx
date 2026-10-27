import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Boxes,
  ChevronLeft,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  PanelsTopLeft,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../admin/auth/AdminAuthContext';

type NavigationItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  description: string;
};

const navigationItems: NavigationItem[] = [
  {
    label: 'Tổng quan',
    to: '/',
    icon: LayoutDashboard,
    description: 'Theo dõi nhanh hệ thống',
  },
  {
    label: 'Danh mục sản phẩm',
    to: '/catalog',
    icon: Boxes,
    description: 'Danh mục, thương hiệu, sản phẩm',
  },
  {
    label: 'Đơn hàng',
    to: '/orders',
    icon: ShoppingBag,
    description: 'Xử lý trạng thái đơn hàng',
  },
  {
    label: 'Nội dung CMS',
    to: '/cms',
    icon: PanelsTopLeft,
    description: 'Banner, trang và bài viết',
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { logout, user } = useAdminAuth();
  const storefrontUrl = (import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:5173').replace(/\/$/, '');

  async function handleLogout() {
    await logout();
    onNavigate?.();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <div className="flex h-20 items-center border-b border-slate-100 px-6">
        <Link className="flex items-center gap-3" to="/" onClick={onNavigate}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b5cff] text-lg font-black text-white shadow-[0_8px_22px_rgba(11,92,255,0.22)]">
            N
          </span>
          <span>
            <strong className="block text-sm tracking-[0.13em] text-slate-900">NOVA GEAR</strong>
            <span className="text-xs text-slate-400">Trang quản trị</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">
          Quản lý cửa hàng
        </p>
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              end={item.to === '/'}
              to={item.to}
              onClick={onNavigate}
              title={item.description}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-blue-50 text-[#0b5cff] shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')
              }
            >
              <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" strokeWidth={2.1} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">
            AD
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{user?.email ?? 'Quản trị viên'}</p>
            <p className="truncate text-xs text-slate-400">Quản trị viên Nova Gear</p>
          </div>
        </div>
        <a
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#0b5cff]"
          href={storefrontUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Xem cửa hàng
        </a>
        <button
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
          type="button"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất
        </button>
      </div>
    </>
  );
}

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      {isSidebarOpen && (
        <button
          aria-label="Đóng menu quản trị"
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white shadow-[10px_0_35px_rgba(15,23,42,0.06)] transition-transform duration-200 lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <button
          aria-label="Đóng menu"
          className="absolute right-3 top-6 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent onNavigate={() => setIsSidebarOpen(false)} />
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button
              aria-label="Mở menu quản trị"
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b5cff] lg:hidden"
              type="button"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-900">Bảng điều khiển</p>
              <p className="text-xs text-slate-400">Quản lý nội dung và vận hành cửa hàng</p>
            </div>
          </div>
          <a
            className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b5cff] sm:flex"
            href={(import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:5173').replace(/\/$/, '')}
            target="_blank"
            rel="noreferrer"
          >
            <PackageSearch className="h-4 w-4" />
            Cửa hàng
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </a>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
