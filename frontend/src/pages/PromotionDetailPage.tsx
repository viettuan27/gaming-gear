import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { promotionApi } from '../api/promotions';
import { ProductCard } from '../components/catalog/ProductCard';
import { Pagination } from '../components/common/Pagination';
import { InlineError, PageLoader } from '../components/common/States';

export function PromotionDetailPage() {
  const slug = useParams().slug ?? '';
  const [page, setPage] = useState(0);
  const article = useQuery({ queryKey: ['promotion', slug], queryFn: () => promotionApi.detail(slug), enabled: !!slug });
  const products = useQuery({ queryKey: ['promotion-products', slug, page], queryFn: () => promotionApi.products(slug, page), enabled: !!slug });
  if (article.isLoading || products.isLoading) return <PageLoader label="Đang tải khuyến mãi..." />;
  if (article.isError || products.isError || !article.data || !products.data) return <div className="container section-space"><InlineError /></div>;
  return <div className="container section-space"><article className="article-detail"><Link className="back-to-catalog" to="/promotions">← Quay lại khuyến mãi</Link><header><h1>{article.data.title}</h1>{article.data.excerpt && <p className="article-lead">{article.data.excerpt}</p>}</header>{article.data.coverImageUrl && <img className="article-cover" src={article.data.coverImageUrl} alt={article.data.title} />}<div className="article-content">{article.data.content}</div></article><section className="section-space"><h2>Sản phẩm trong chương trình</h2>{products.data.content.length ? <><div className="product-grid">{products.data.content.map((product) => <ProductCard key={product.id} product={product} />)}</div><Pagination page={products.data.page} totalPages={products.data.totalPages} onChange={setPage} /></> : <p>Chưa có sản phẩm phù hợp.</p>}</section></div>;
}
