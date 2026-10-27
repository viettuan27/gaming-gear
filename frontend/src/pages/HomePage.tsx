import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Boxes, Gamepad2, Headphones, Keyboard, Monitor, Mouse, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogApi, cmsApi } from '../api/services';
import { InlineError, PageLoader } from '../components/common/States';
import { ProductCard } from '../components/catalog/ProductCard';

const categoryIcons = [Mouse, Keyboard, Headphones, Monitor, Gamepad2, Boxes];

export function HomePage() {
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: catalogApi.getCategories });
  const productsQuery = useQuery({
    queryKey: ['products', 'home-shelf'],
    queryFn: () => catalogApi.getProducts({ page: 0, size: 8, sortBy: 'name', sortDirection: 'asc' }),
  });
  const bannersQuery = useQuery({
    queryKey: ['banners', 'HOME_HERO'],
    queryFn: () => cmsApi.getPublicBanners('HOME_HERO'),
  });
  const featuredBanner = bannersQuery.data?.[0];
  const heroImage = featuredBanner?.imageUrl ?? '/hero-gaming-desk.png';
  const heroAlt = featuredBanner?.title ?? 'Góc máy gaming với bàn phím, tai nghe và chuột phát sáng';

  return (
    <>
      <section className="home-hero">
        <div className="container hero-layout">
          <aside className="hero-category-list">
            <p>Danh mục nổi bật</p>
            {categoriesQuery.data?.slice(0, 7).map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              return <Link key={category.id} to={`/products?categoryId=${category.id}`}><Icon size={17} />{category.name}<ArrowRight size={15} /></Link>;
            })}
            <Link className="all-categories-link" to="/products">Xem toàn bộ <ArrowRight size={15} /></Link>
          </aside>

          <div className="hero-banner">
            <img src={heroImage} alt={heroAlt} />
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
            <div className="hero-meta"><span>BUILD / PLAY / CREATE</span><span>01 — 03</span></div>
          </div>

          <aside className="hero-sidecards">
            <Link to="/products?keyword=chuột" className="hero-mini-card hero-mini-mouse"><Mouse size={22} /><span>Chuột gaming</span><small>Độ chính xác trong từng thao tác</small></Link>
            <Link to="/products?keyword=bàn%20phím" className="hero-mini-card hero-mini-keyboard"><Keyboard size={22} /><span>Bàn phím cơ</span><small>Âm thanh, cảm giác, cá tính</small></Link>
          </aside>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-strip-inner">
          <span><ShieldCheck size={20} /> Backend có kiểm soát tồn kho</span>
          <span><Sparkles size={20} /> Danh mục được quản trị bằng CMS</span>
          <span><Gamepad2 size={20} /> Tối ưu cho góc máy của bạn</span>
        </div>
      </section>

      <section className="container section-space category-explore">
        <div className="section-heading">
          <div><span className="eyebrow dark">Bắt đầu tại đây</span><h2>Chọn theo setup của bạn</h2></div>
          <Link to="/products">Tất cả danh mục <ArrowRight size={17} /></Link>
        </div>
        {categoriesQuery.isLoading ? <PageLoader label="Đang tải danh mục..." /> : categoriesQuery.isError ? <InlineError /> : (
          <div className="category-tile-grid">
            {categoriesQuery.data?.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              return <Link key={category.id} to={`/products?categoryId=${category.id}`} className={`category-tile category-tone-${index % 5}`}>
                <div><Icon size={29} /><ArrowRight size={18} /></div>
                <h3>{category.name}</h3>
                <p>{category.description || 'Khám phá sản phẩm phù hợp với nhu cầu của bạn.'}</p>
              </Link>;
            })}
          </div>
        )}
      </section>

      <section className="section-space shelf-section">
        <div className="container">
          <div className="section-heading shelf-heading">
            <div><span className="eyebrow dark">Được khám phá nhiều</span><h2>Thiết bị mới trong kho</h2></div>
            <Link to="/products">Xem tất cả <ArrowRight size={17} /></Link>
          </div>
          {productsQuery.isLoading ? <PageLoader label="Đang tải sản phẩm..." /> : productsQuery.isError ? <InlineError /> : (
            <div className="product-grid home-product-grid">
              {productsQuery.data?.content.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </section>

      <section className="container section-space setup-callout">
        <div>
          <span className="eyebrow">Need a starting point?</span>
          <h2>Chưa biết chọn gì cho góc máy?</h2>
          <p>Lọc theo danh mục, thương hiệu và tên sản phẩm. Từng trang chi tiết đều cho biết phiên bản, giá và tồn kho đang có.</p>
        </div>
        <Link className="button button-dark" to="/products">Mở danh mục <ArrowRight size={18} /></Link>
      </section>
    </>
  );
}
