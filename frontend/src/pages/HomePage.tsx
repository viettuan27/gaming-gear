import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Boxes, ChevronLeft, ChevronRight, Gamepad2, Headphones, Keyboard, Monitor, Mouse, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { catalogApi, cmsApi } from '../api/services';
import { InlineError, PageLoader } from '../components/common/States';
import { ProductCard } from '../components/catalog/ProductCard';
import type { CategoryMenuOutletContext } from '../components/layout/StoreLayout';
import { CategoryMenuPreview } from '../components/layout/CategoryMenuOverlay';
import type { Category } from '../types/api';

const categoryIcons = [Mouse, Keyboard, Headphones, Monitor, Gamepad2, Boxes];

export function HomePage() {
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null);
  const { categoryMenuOpen, closeCategoryMenu } = useOutletContext<CategoryMenuOutletContext>();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: catalogApi.getCategories });
  const bannersQuery = useQuery({
    queryKey: ['banners', 'HOME_HERO'],
    queryFn: () => cmsApi.getPublicBanners('HOME_HERO'),
  });
  const promotionBannersQuery = useQuery({
    queryKey: ['banners', 'HOME_PROMOTION'],
    queryFn: () => cmsApi.getPublicBanners('HOME_PROMOTION'),
  });
  const heroBanners = bannersQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const hoveredCategory = categories.find((category) => category.id === hoveredCategoryId) ?? null;
  const featuredBanner = heroBanners[activeHeroIndex];
  const heroImage = featuredBanner?.imageUrl ?? '/hero-gaming-desk.png';
  const heroAlt = featuredBanner?.title ?? 'Góc máy gaming với bàn phím, tai nghe và chuột phát sáng';

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [heroBanners.length]);

  useEffect(() => {
    if (categoryMenuOpen && categories.length > 0) {
      setHoveredCategoryId((currentId) => currentId ?? categories[0].id);
      return;
    }

    setHoveredCategoryId(null);
  }, [categoryMenuOpen, categories]);

  useEffect(() => {
    if (heroBanners.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveHeroIndex((currentIndex) => (currentIndex + 1) % heroBanners.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [heroBanners.length]);

  const showPreviousHero = () => {
    setActiveHeroIndex((currentIndex) => (currentIndex - 1 + heroBanners.length) % heroBanners.length);
  };

  const showNextHero = () => {
    setActiveHeroIndex((currentIndex) => (currentIndex + 1) % heroBanners.length);
  };

  return (
    <>
      <section className="home-hero">
        {categoryMenuOpen && <button className="category-menu-backdrop" aria-label="Đóng danh mục" onClick={closeCategoryMenu} />}
        <div className="container hero-layout">
          <aside className={`hero-category-list ${categoryMenuOpen ? 'is-focused' : ''}`}>
            <p>Danh mục nổi bật</p>
            {categories.slice(0, 7).map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              return (
                <Link
                  key={category.id}
                  className={hoveredCategoryId === category.id ? 'is-hovered' : ''}
                  to={`/products?categoryId=${category.id}`}
                  onMouseEnter={() => setHoveredCategoryId(category.id)}
                  onFocus={() => setHoveredCategoryId(category.id)}
                  onClick={closeCategoryMenu}
                >
                  <Icon size={17} />{category.name}<ArrowRight size={15} />
                </Link>
              );
            })}
            <Link className="all-categories-link" to="/products" onClick={closeCategoryMenu}>Xem toàn bộ <ArrowRight size={15} /></Link>
            {categoryMenuOpen && hoveredCategory && <CategoryMenuPreview category={hoveredCategory} onNavigate={closeCategoryMenu} />}
          </aside>

          <div className="hero-banner">
            <img key={featuredBanner?.id ?? 'fallback'} className="hero-banner-image" src={heroImage} alt={heroAlt} />
            <div className="hero-overlay" />
            <div className="hero-content">
              <span className="eyebrow"><Sparkles size={15} /> Nova Gear selection</span>
              {featuredBanner ? (
                <>
                  <h1>{featuredBanner.title}</h1>
                  <p>Khám phá ưu đãi và thiết bị phù hợp với góc máy của bạn.</p>
                </>
              ) : (
                <>
                  <h1>Góc máy đúng chất.<br /><em>Hiệu năng đúng ý.</em></h1>
                  <p>Khám phá thiết bị gaming được sắp xếp theo cách bạn thật sự sử dụng.</p>
                </>
              )}
              <Link className="button button-lime" to={featuredBanner?.redirectUrl || '/products'}>Khám phá sản phẩm <ArrowRight size={18} /></Link>
            </div>
            {heroBanners.length > 1 && (
              <>
                <div className="hero-controls" aria-label="Điều hướng banner">
                  <button type="button" onClick={showPreviousHero} aria-label="Banner trước"><ChevronLeft size={20} /></button>
                  <button type="button" onClick={showNextHero} aria-label="Banner tiếp theo"><ChevronRight size={20} /></button>
                </div>
                <div className="hero-dots" aria-label="Chọn banner">
                  {heroBanners.map((banner, index) => (
                    <button
                      key={banner.id}
                      type="button"
                      className={index === activeHeroIndex ? 'active' : ''}
                      aria-label={`Hiển thị banner ${index + 1}: ${banner.title}`}
                      aria-current={index === activeHeroIndex}
                      onClick={() => setActiveHeroIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="hero-meta"><span>BUILD / PLAY / CREATE</span><span>{String(activeHeroIndex + 1).padStart(2, '0')} — {String(Math.max(heroBanners.length, 1)).padStart(2, '0')}</span></div>
          </div>

        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-strip-inner">
          <span><ShieldCheck size={20} /> Sản phẩm được chọn lọc kỹ lưỡng</span>
          <span><Sparkles size={20} /> Nhiều lựa chọn cho mọi nhu cầu</span>
          <span><Gamepad2 size={20} /> Tư vấn gear phù hợp với bạn</span>
        </div>
      </section>

      {promotionBannersQuery.data && promotionBannersQuery.data.length > 0 && (
        <section className="container promotion-section">
          <div className="section-heading promotion-heading">
            <div><span className="eyebrow dark">Ưu đãi tại Nova Gear</span><h2>Khuyến mãi đang diễn ra</h2></div>
            <Link to="/products?discounted=true">Xem sản phẩm <ArrowRight size={17} /></Link>
          </div>
          <div className="promotion-grid">
            {promotionBannersQuery.data.map((banner) => (
              <Link key={banner.id} to="/products?discounted=true" className="promotion-card">
                <img src={banner.imageUrl} alt={banner.title} />
                <div className="promotion-card-overlay" />
                <div className="promotion-card-content">
                  <span>ƯU ĐÃI</span>
                  <h3>{banner.title}</h3>
                  <p>Khám phá ngay <ArrowRight size={16} /></p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {categoriesQuery.isLoading ? <section className="container section-space"><PageLoader label="Đang tải sản phẩm..." /></section> : categoriesQuery.isError ? <section className="container section-space"><InlineError /></section> : (
        <div className="category-shelves">
          {categories.map((category) => <CategoryProductShelf key={category.id} category={category} />)}
        </div>
      )}

      <section className="container section-space setup-callout">
        <div>
          <span className="eyebrow">Need a starting point?</span>
          <h2>Chưa biết chọn gì cho góc máy?</h2>
          <p>Lọc theo danh mục, thương hiệu và tên sản phẩm để tìm thiết bị phù hợp với nhu cầu và ngân sách của bạn.</p>
        </div>
        <Link className="button button-dark" to="/products">Mở danh mục <ArrowRight size={18} /></Link>
      </section>
    </>
  );
}

function CategoryProductShelf({ category }: { category: Category }) {
  const productsQuery = useQuery({
    queryKey: ['products', 'home-category-shelf', category.id],
    queryFn: () => catalogApi.getProducts({ categoryId: category.id, page: 0, size: 4, sortBy: 'createdAt', sortDirection: 'desc' }),
  });

  if (!productsQuery.data?.content.length) return null;

  return (
    <section className="category-shelf-section">
      <div className="container">
        <div className="section-heading shelf-heading">
          <div><span className="eyebrow dark">Khám phá theo danh mục</span><h2>{category.name} nổi bật</h2></div>
          <Link to={`/products?categoryId=${category.id}`}>Xem tất cả <ArrowRight size={17} /></Link>
        </div>
        <div className="product-grid category-shelf-grid">
          {productsQuery.data.content.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}
