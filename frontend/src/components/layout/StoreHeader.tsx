import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ClipboardList,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';

const quickLinks = [
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Khuyến mãi', to: '/products?sortBy=name&sortDirection=asc' },
  { label: 'Bài viết', to: '/articles' },
  { label: 'Hỗ trợ', to: '/pages' },
];

export function StoreHeader() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: catalogApi.getCategories,
  });

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const keyword = query.trim();
    navigate(keyword ? `/products?keyword=${encodeURIComponent(keyword)}` : '/products');
    setMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    setAccountOpen(false);
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="header-primary">
        <div className="container header-primary-inner">
          <button
            className="icon-button mobile-menu-button"
            aria-label="Mở danh mục"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} />
          </button>

          <Link className="brand-mark" to="/" aria-label="Nova Gear - Trang chủ">
            <span className="brand-symbol"><Zap size={20} fill="currentColor" /></span>
            <span>NOVA<span>GEAR</span></span>
          </Link>

          <button className="category-trigger" onClick={() => setMenuOpen(true)}>
            <Menu size={18} />
            <span>Danh mục</span>
            <ChevronDown size={15} />
          </button>

          <form className="header-search" onSubmit={submitSearch}>
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm chuột, bàn phím, tai nghe..."
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit">Tìm kiếm</button>
          </form>

          <nav className="header-actions" aria-label="Tài khoản và giỏ hàng">
            <Link className="header-action" to="/orders">
              <ClipboardList size={20} />
              <span>Đơn hàng</span>
            </Link>
            <Link className="header-action" to="/cart">
              <ShoppingBag size={20} />
              <span>Giỏ hàng</span>
            </Link>
            <div className="account-area">
              <button className="header-action account-button" onClick={() => setAccountOpen((current) => !current)}>
                <UserRound size={20} />
                <span>{isAuthenticated ? (user?.email?.split('@')[0] ?? 'Tài khoản') : 'Tài khoản'}</span>
              </button>
              {accountOpen && (
                <div className="account-menu">
                  {isAuthenticated ? (
                    <>
                      <p className="account-menu-email">{user?.email}</p>
                      <Link to="/orders" onClick={() => setAccountOpen(false)}><ClipboardList size={16} /> Đơn hàng của tôi</Link>
                      <button onClick={handleLogout}><LogOut size={16} /> Đăng xuất</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setAccountOpen(false)}>Đăng nhập</Link>
                      <Link className="account-menu-register" to="/register" onClick={() => setAccountOpen(false)}>Tạo tài khoản</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      <div className="header-secondary">
        <div className="container header-secondary-inner">
          <nav className="quick-links" aria-label="Điều hướng chính">
            {quickLinks.map((link) => <NavLink key={link.label} to={link.to}>{link.label}</NavLink>)}
          </nav>
          <p className="header-assurance"><ShieldCheck size={16} /> Sản phẩm chính hãng · Hỗ trợ tận tâm</p>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-drawer-head">
              <span>Khám phá danh mục</span>
              <button className="icon-button" aria-label="Đóng menu" onClick={() => setMenuOpen(false)}><X /></button>
            </div>
            <form className="mobile-search" onSubmit={submitSearch}>
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm sản phẩm" />
            </form>
            <div className="drawer-categories">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?categoryId=${category.id}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {category.name}
                  <ChevronDown size={16} />
                </Link>
              ))}
            </div>
            <div className="drawer-links">
              {quickLinks.map((link) => <Link key={link.label} to={link.to} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
