import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalogApi } from '../api/services';
import type { SortDirection } from '../types/api';
import { Pagination } from '../components/common/Pagination';
import { EmptyState, InlineError, PageLoader } from '../components/common/States';
import { ProductCard } from '../components/catalog/ProductCard';

const sortOptions = [
  { value: 'name-asc', label: 'Tên A–Z', sortBy: 'name', sortDirection: 'asc' },
  { value: 'name-desc', label: 'Tên Z–A', sortBy: 'name', sortDirection: 'desc' },
];

function numberParam(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const keyword = searchParams.get('keyword') ?? '';
  const categoryId = numberParam(searchParams.get('categoryId'));
  const brandId = numberParam(searchParams.get('brandId'));
  const currentPage = Math.max(Number(searchParams.get('page') ?? 0), 0);
  const sortBy = searchParams.get('sortBy') ?? 'name';
  const sortDirection: SortDirection = searchParams.get('sortDirection') === 'desc' ? 'desc' : 'asc';
  const [keywordDraft, setKeywordDraft] = useState(keyword);

  useEffect(() => setKeywordDraft(keyword), [keyword]);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: catalogApi.getCategories });
  const brandsQuery = useQuery({ queryKey: ['brands'], queryFn: catalogApi.getBrands });
  const productsQuery = useQuery({
    queryKey: ['products', { keyword, categoryId, brandId, currentPage, sortBy, sortDirection }],
    queryFn: () => catalogApi.getProducts({
      keyword: keyword || undefined,
      categoryId,
      brandId,
      page: currentPage,
      size: 12,
      sortBy,
      sortDirection,
    }),
  });

  const activeSort = useMemo(
    () => sortOptions.find((option) => option.sortBy === sortBy && option.sortDirection === sortDirection)?.value ?? 'name-asc',
    [sortBy, sortDirection],
  );

  function updateParams(next: Record<string, string | number | undefined>) {
    const updated = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 0) updated.delete(key);
      else updated.set(key, String(value));
    });
    if (!Object.hasOwn(next, 'page')) updated.delete('page');
    setSearchParams(updated);
  }

  function submitKeyword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ keyword: keywordDraft.trim() });
  }

  const filterContent = (
    <>
      <div className="filter-group">
        <div className="filter-group-title"><span>Danh mục</span>{categoryId && <button onClick={() => updateParams({ categoryId: undefined })}>Bỏ chọn</button>}</div>
        <div className="filter-option-list">
          {categoriesQuery.data?.map((category) => <label key={category.id}><input type="radio" checked={categoryId === category.id} onChange={() => updateParams({ categoryId: category.id })} /><span>{category.name}</span></label>)}
        </div>
      </div>
      <div className="filter-group">
        <div className="filter-group-title"><span>Thương hiệu</span>{brandId && <button onClick={() => updateParams({ brandId: undefined })}>Bỏ chọn</button>}</div>
        <div className="filter-option-list">
          {brandsQuery.data?.map((brand) => <label key={brand.id}><input type="radio" checked={brandId === brand.id} onChange={() => updateParams({ brandId: brand.id })} /><span>{brand.name}</span></label>)}
        </div>
      </div>
    </>
  );

  return (
    <div className="catalog-page">
      <div className="container breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><span>Sản phẩm</span></div>
      <section className="container catalog-title-row">
        <div><span className="eyebrow dark">NOVA GEAR STORE</span><h1>Khám phá sản phẩm</h1><p>Chọn từ danh mục và thương hiệu đang có trong hệ thống.</p></div>
        <form className="catalog-search" onSubmit={submitKeyword}><Search size={18} /><input value={keywordDraft} onChange={(event) => setKeywordDraft(event.target.value)} placeholder="Tìm tên sản phẩm" /><button aria-label="Tìm kiếm"><Search size={18} /></button></form>
      </section>
      <div className="container catalog-layout">
        <aside className="filter-panel desktop-filter-panel">
          <div className="filter-panel-head"><span><Filter size={18} /> Bộ lọc</span><button onClick={() => setSearchParams({})}><RotateCcw size={15} /> Đặt lại</button></div>
          {filterContent}
        </aside>
        <section className="catalog-results">
          <div className="catalog-result-bar">
            <div><strong>{productsQuery.data?.totalElements ?? 0}</strong> sản phẩm{keyword && <span className="keyword-chip">“{keyword}” <button onClick={() => updateParams({ keyword: undefined })}><X size={13} /></button></span>}</div>
            <div className="catalog-toolbar">
              <button className="mobile-filter-button" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={17} /> Lọc</button>
              <label>Sắp xếp <select value={activeSort} onChange={(event) => {
                const selected = sortOptions.find((option) => option.value === event.target.value)!;
                updateParams({ sortBy: selected.sortBy, sortDirection: selected.sortDirection });
              }}>{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            </div>
          </div>
          {productsQuery.isLoading ? <PageLoader label="Đang tải danh sách sản phẩm..." /> : productsQuery.isError ? <InlineError /> : productsQuery.data?.content.length ? (
            <><div className="product-grid">{productsQuery.data.content.map((product) => <ProductCard key={product.id} product={product} />)}</div><Pagination page={productsQuery.data.page} totalPages={productsQuery.data.totalPages} onChange={(page) => updateParams({ page })} /></>
          ) : <EmptyState title="Chưa tìm thấy sản phẩm phù hợp" description="Thử bỏ bớt điều kiện lọc hoặc tìm kiếm bằng từ khoá khác." />}
        </section>
      </div>
      {filtersOpen && <div className="mobile-filter-backdrop" onClick={() => setFiltersOpen(false)}><aside className="mobile-filter-panel" onClick={(event) => event.stopPropagation()}><div className="filter-panel-head"><span><Filter size={18} /> Bộ lọc</span><button onClick={() => setFiltersOpen(false)}><X /></button></div>{filterContent}<button className="button button-dark full-width" onClick={() => setFiltersOpen(false)}>Xem kết quả</button></aside></div>}
    </div>
  );
}
