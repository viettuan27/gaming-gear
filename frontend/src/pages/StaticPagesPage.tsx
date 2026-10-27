import { useQuery } from '@tanstack/react-query';
import { FileText, MoveRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cmsApi } from '../api/services';
import { EmptyState, InlineError, PageLoader } from '../components/common/States';

export function StaticPagesPage() {
  const pagesQuery = useQuery({
    queryKey: ['published-pages'],
    queryFn: cmsApi.getPublishedPages,
  });

  if (pagesQuery.isLoading) return <PageLoader label="Đang tải nội dung hỗ trợ..." />;

  if (pagesQuery.isError) {
    return <div className="container section-space"><InlineError message="Không thể tải các trang nội dung." /></div>;
  }

  const pages = pagesQuery.data ?? [];

  return (
    <section className="container section-space static-page-directory">
      <span className="eyebrow dark">NOVA GEAR SUPPORT</span>
      <h1>Thông tin & chính sách</h1>
      <p>Những nội dung được quản trị viên xuất bản cho khách hàng.</p>

      {pages.length === 0 ? (
        <EmptyState title="Chưa có trang nội dung" description="Các chính sách và hướng dẫn sẽ sớm được cập nhật tại đây." />
      ) : (
        <div className="static-page-grid">
          {pages.map((page) => (
            <Link className="static-page-card" key={page.id} to={`/pages/${page.slug}`}>
              <FileText size={22} />
              <span>
                <strong>{page.title}</strong>
                <small>Cập nhật nội dung và chính sách mới nhất</small>
              </span>
              <MoveRight size={20} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
