import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cmsApi } from '../api/services';
import { InlineError, PageLoader } from '../components/common/States';
import { formatDate } from '../lib/format';

export function ArticleDetailPage() {
  const slug = useParams().slug ?? '';
  const articleQuery = useQuery({ queryKey: ['article', slug], queryFn: () => cmsApi.getPublicArticle(slug), enabled: Boolean(slug) });
  if (articleQuery.isLoading) return <PageLoader label="Đang tải bài viết..." />;
  if (articleQuery.isError || !articleQuery.data) return <div className="container section-space"><InlineError message="Không thể tải bài viết này." /></div>;
  const article = articleQuery.data;
  return <article className="container article-detail section-space"><Link className="back-to-catalog" to="/articles"><ArrowLeft size={17} /> Quay lại góc công nghệ</Link><header><span className="eyebrow dark">NOVA NOTES</span><h1>{article.title}</h1><p className="article-date"><CalendarDays size={15} /> {formatDate(article.publishedAt)}</p>{article.excerpt && <p className="article-lead">{article.excerpt}</p>}</header>{article.coverImageUrl && <img className="article-cover" src={article.coverImageUrl} alt={article.title} />}<div className="article-content">{article.content}</div></article>;
}
