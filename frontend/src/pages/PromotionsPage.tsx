import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { promotionApi } from '../api/promotions';
import { Pagination } from '../components/common/Pagination';
import { EmptyState, InlineError, PageLoader } from '../components/common/States';

export function PromotionsPage() {
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: ['promotions', page], queryFn: () => promotionApi.list(page) });
  if (query.isLoading) return <PageLoader label="Đang tải khuyến mãi..." />;
  if (query.isError || !query.data) return <div className="container section-space"><InlineError /></div>;
  return <div className="container articles-page section-space"><div className="page-heading"><h1>Chương trình khuyến mãi</h1><p>Khám phá những ưu đãi tại Nova Gear.</p></div>{query.data.content.length ? <><div className="article-grid">{query.data.content.map((item) => <article className="article-card" key={item.id}><Link className="article-card-image" to={`/promotions/${item.slug}`}>{item.coverImageUrl && <img src={item.coverImageUrl} alt={item.title} />}</Link><div><Link to={`/promotions/${item.slug}`}><h2>{item.title}</h2></Link><p>{item.excerpt}</p><Link className="article-read-link" to={`/promotions/${item.slug}`}>Xem chi tiết →</Link></div></article>)}</div><Pagination page={query.data.page} totalPages={query.data.totalPages} onChange={setPage} /></> : <EmptyState title="Chưa có chương trình khuyến mãi" description="Các ưu đãi mới sẽ sớm được cập nhật." />}</div>;
}
