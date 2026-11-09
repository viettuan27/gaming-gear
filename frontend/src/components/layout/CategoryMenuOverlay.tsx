import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Boxes, Gamepad2, Headphones, Keyboard, Monitor, Mouse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogApi } from '../../api/services';
import type { Category } from '../../types/api';

const categoryIcons = [Mouse, Keyboard, Headphones, Monitor, Gamepad2, Boxes];

interface CategoryMenuPreviewProps {
  category: Category;
  onNavigate: () => void;
}

export function CategoryMenuPreview({ category, onNavigate }: CategoryMenuPreviewProps) {
  const productsQuery = useQuery({
    queryKey: ['products', 'category-menu', category.id],
    queryFn: () => catalogApi.getProducts({ categoryId: category.id, page: 0, size: 4, sortBy: 'createdAt', sortDirection: 'desc' }),
  });

  return (
    <section className="category-menu-preview" aria-label={`Gợi ý cho ${category.name}`}>
      <span className="eyebrow dark">Khám phá danh mục</span>
      <h2>{category.name}</h2>
      <p>{category.description || 'Khám phá các sản phẩm phù hợp với góc máy của bạn.'}</p>
      {productsQuery.data?.content.length ? (
        <div className="category-preview-products">
          {productsQuery.data.content.map((product) => <Link key={product.id} to={`/products/${product.id}`} onClick={onNavigate}><span>{product.brandName}</span>{product.name}</Link>)}
        </div>
      ) : productsQuery.isLoading ? <p className="category-preview-loading">Đang tải gợi ý...</p> : null}
      <Link className="category-preview-all" to={`/products?categoryId=${category.id}`} onClick={onNavigate}>Xem tất cả {category.name} <ArrowRight size={16} /></Link>
    </section>
  );
}

export function CategoryMenuOverlay({ onClose }: { onClose: () => void }) {
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null);
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: catalogApi.getCategories });
  const categories = categoriesQuery.data ?? [];
  const hoveredCategory = categories.find((category) => category.id === hoveredCategoryId) ?? null;

  useEffect(() => {
    if (categories.length > 0) {
      setHoveredCategoryId((currentId) => currentId ?? categories[0].id);
    }
  }, [categories]);

  return (
    <>
      <button className="category-menu-backdrop" aria-label="Đóng danh mục" onClick={onClose} />
      <aside className="hero-category-list category-floating-menu is-focused" aria-label="Danh mục sản phẩm">
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
              onClick={onClose}
            >
              <Icon size={17} />{category.name}<ArrowRight size={15} />
            </Link>
          );
        })}
        <Link className="all-categories-link" to="/products" onClick={onClose}>Xem toàn bộ <ArrowRight size={15} /></Link>
        {hoveredCategory && <CategoryMenuPreview category={hoveredCategory} onNavigate={onClose} />}
      </aside>
    </>
  );
}
