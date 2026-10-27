import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cmsApi } from '../api/services';
import { Pagination } from '../components/common/Pagination';
import { EmptyState, InlineError, PageLoader } from '../components/common/States';
import { formatDate } from '../lib/format';

export function ArticlesPage() {
  const [page, setPage] = useState(0);
  const articlesQuery = useQuery({ queryKey: ['articles', page], queryFn: () => cmsApi.getPublicArticles({ page, size: 9, sortDirection: 'desc' }) });
  if (articlesQuery.isLoading) return <PageLoader label="Đang tải bài viết..." />;
  if (articlesQuery.isError) return <div className="container section-space"><InlineError /></div>;
  const result = articlesQuery.data;
  return <div className="container articles-page section-space"><div className="page-heading article-heading"><div><span className="eyebrow dark">NOVA NOTES</span><h1>Góc công nghệ</h1><p>Tin tức và nội dung được xuất bản từ CMS của dự án.</p></div><BookOpen size={44} /></div>{result?.content.length ? <><div className="article-grid">{result.content.map((article, index) => <article className={`article-card article-tone-${index % 4}`} key={article.id}><Link className="article-card-image" to={`/articles/${article.slug}`}>{article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.title} /> : <BookOpen size={42} />}</Link><div><p className="article-date"><CalendarDays size={14} /> {formatDate(article.publishedAt)}</p><Link to={`/articles/${article.slug}`}><h2>{article.title}</h2></Link><p>{article.excerpt || 'Đọc thêm nội dung từ Nova Gear.'}</p><Link className="article-read-link" to={`/articles/${article.slug}`}>Đọc bài viết <ArrowRight size={16} /></Link></div></article>)}</div><Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} /></> : <EmptyState title="Chưa có bài viết được xuất bản" description="Nội dung từ CMS sẽ xuất hiện ở đây sau khi quản trị viên xuất bản." />}</div>;
}
