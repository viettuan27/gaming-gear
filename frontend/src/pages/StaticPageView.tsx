import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cmsApi } from '../api/services';
import { InlineError, PageLoader } from '../components/common/States';

export function StaticPageView() {
  const slug = useParams().slug ?? '';
  const pageQuery = useQuery({ queryKey: ['page', slug], queryFn: () => cmsApi.getPublicPage(slug), enabled: Boolean(slug) });
  if (pageQuery.isLoading) return <PageLoader label="Đang tải nội dung..." />;
  if (pageQuery.isError || !pageQuery.data) return <div className="container section-space"><InlineError message="Trang nội dung chưa được xuất bản hoặc không tồn tại." /></div>;
  const page = pageQuery.data;
  return <article className="container static-page section-space"><Link className="back-to-catalog" to="/"><ArrowLeft size={17} /> Trang chủ</Link><header><FileText size={28} /><span className="eyebrow dark">THÔNG TIN</span><h1>{page.title}</h1></header><div className="static-content">{page.content}</div></article>;
}
