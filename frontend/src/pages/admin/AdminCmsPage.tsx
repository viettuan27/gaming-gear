import { type FormEvent, type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileText,
  ImagePlus,
  LoaderCircle,
  Megaphone,
  Plus,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import { cmsApi } from '../../api/services';
import type {
  ArticleDetail,
  ArticlePayload,
  ArticleSummary,
  Banner,
  BannerPayload,
  BannerPosition,
  ContentStatus,
  PageResponse,
  StaticPage,
  StaticPagePayload,
} from '../../types/api';

type CmsTab = 'banners' | 'pages' | 'articles';
type ResponseEnvelope<T> = { data: T };
type ContentResource = 'banner' | 'page' | 'article';
type ContentAction = 'publish' | 'archive' | 'restore';

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50';

const statusLabels: Record<ContentStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Đã lưu trữ',
};

function unwrapResponse<T>(response: T | ResponseEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ResponseEnvelope<T>).data;
  }

  return response as T;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Không thể lưu nội dung. Hãy thử lại.';
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function CmsModal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-4 py-6 sm:grid sm:place-items-center">
      <section
        aria-modal="true"
        aria-labelledby="cms-modal-title"
        className="mx-auto w-full max-w-3xl rounded-2xl bg-white shadow-[0_25px_80px_rgba(15,23,42,0.25)]"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 id="cms-modal-title" className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <button
            aria-label="Đóng biểu mẫu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            type="button"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const tones: Record<ContentStatus, string> = {
    DRAFT: 'bg-amber-50 text-amber-700 ring-amber-200',
    PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    ARCHIVED: 'bg-slate-100 text-slate-600 ring-slate-200',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tones[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function EmptyContent({ label }: { label: string }) {
  return (
    <div className="grid min-h-60 place-items-center p-8 text-center">
      <div>
        <FileText className="mx-auto h-10 w-10 text-slate-200" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Chưa có {label}</p>
        <p className="mt-1 text-sm text-slate-400">Bạn có thể bắt đầu bằng nút thêm mới ở phía trên.</p>
      </div>
    </div>
  );
}

export function AdminCmsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<CmsTab>('banners');
  const [articlePage, setArticlePage] = useState(0);
  const [bannerForm, setBannerForm] = useState<BannerPayload | null>(null);
  const [bannerEditingId, setBannerEditingId] = useState<number | null>(null);
  const [pageForm, setPageForm] = useState<StaticPagePayload | null>(null);
  const [pageEditingId, setPageEditingId] = useState<number | null>(null);
  const [articleForm, setArticleForm] = useState<ArticlePayload | null>(null);
  const [articleEditingId, setArticleEditingId] = useState<number | null>(null);
  const [articleLoadingId, setArticleLoadingId] = useState<number | null>(null);
  const [loadArticleError, setLoadArticleError] = useState<string | null>(null);

  const bannersQuery = useQuery({
    queryKey: ['admin', 'cms', 'banners'],
    queryFn: async () => unwrapResponse<Banner[]>(await cmsApi.getBanners()),
  });
  const pagesQuery = useQuery({
    queryKey: ['admin', 'cms', 'pages'],
    queryFn: async () => unwrapResponse<StaticPage[]>(await cmsApi.getPages()),
  });
  const articlesQuery = useQuery({
    queryKey: ['admin', 'cms', 'articles', articlePage],
    queryFn: async () =>
      unwrapResponse<PageResponse<ArticleSummary>>(
        await cmsApi.getArticles({ page: articlePage, size: 10, sortDirection: 'desc' }),
      ),
  });

  const saveBannerMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: BannerPayload }) =>
      id ? cmsApi.updateBanner(id, payload) : cmsApi.createBanner(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'banners'] });
      setBannerForm(null);
      setBannerEditingId(null);
    },
  });
  const savePageMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: StaticPagePayload }) =>
      id ? cmsApi.updatePage(id, payload) : cmsApi.createPage(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] });
      setPageForm(null);
      setPageEditingId(null);
    },
  });
  const saveArticleMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: ArticlePayload }) =>
      id ? cmsApi.updateArticle(id, payload) : cmsApi.createArticle(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'articles'] });
      setArticleForm(null);
      setArticleEditingId(null);
    },
  });
  const contentActionMutation = useMutation({
    mutationFn: async ({ resource, id, action }: { resource: ContentResource; id: number; action: ContentAction }): Promise<void> => {
      if (resource === 'banner') {
        if (action === 'publish') await cmsApi.publishBanner(id);
        else if (action === 'archive') await cmsApi.archiveBanner(id);
        else await cmsApi.restoreBanner(id);
        return;
      }
      if (resource === 'page') {
        if (action === 'publish') await cmsApi.publishPage(id);
        else if (action === 'archive') await cmsApi.archivePage(id);
        else await cmsApi.restorePage(id);
        return;
      }
      if (action === 'publish') await cmsApi.publishArticle(id);
      else if (action === 'archive') await cmsApi.archiveArticle(id);
      else await cmsApi.restoreArticle(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cms'] });
    },
  });

  const articles = articlesQuery.data?.content ?? [];
  const totalArticlePages = Math.max(articlesQuery.data?.totalPages ?? 1, 1);

  const openCreate = () => {
    if (tab === 'banners') {
      setBannerEditingId(null);
      setBannerForm({ title: '', redirectUrl: '', position: 'HOME_HERO', sortOrder: 0, file: null });
      return;
    }
    if (tab === 'pages') {
      setPageEditingId(null);
      setPageForm({ title: '', slug: '', content: '', metaTitle: '', metaDescription: '' });
      return;
    }

    setArticleEditingId(null);
    setArticleForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      coverImage: null,
    });
  };

  const openArticleForEdit = async (article: ArticleSummary) => {
    setLoadArticleError(null);
    setArticleLoadingId(article.id);

    try {
      const detail = unwrapResponse<ArticleDetail>(await cmsApi.getArticle(article.id));
      setArticleEditingId(detail.id);
      setArticleForm({
        title: detail.title,
        slug: detail.slug,
        excerpt: detail.excerpt ?? '',
        content: detail.content,
        metaTitle: detail.metaTitle ?? '',
        metaDescription: detail.metaDescription ?? '',
        coverImage: null,
      });
    } catch (error) {
      setLoadArticleError(getErrorMessage(error));
    } finally {
      setArticleLoadingId(null);
    }
  };

  const tabItems: Array<{ id: CmsTab; label: string; icon: typeof Megaphone }> = [
    { id: 'banners', label: 'Banner', icon: Megaphone },
    { id: 'pages', label: 'Trang tĩnh', icon: FileText },
    { id: 'articles', label: 'Bài viết', icon: ImagePlus },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0b5cff]">Content Management</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Nội dung CMS</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Soạn nội dung ở trạng thái bản nháp, sau đó xuất bản khi đã sẵn sàng hiển thị ra cửa hàng.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b5cff] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(11,92,255,0.22)] transition hover:bg-blue-700"
          type="button"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          {tab === 'banners' ? 'Thêm banner' : tab === 'pages' ? 'Thêm trang' : 'Thêm bài viết'}
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.035)]">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex w-full overflow-x-auto rounded-xl bg-slate-50 p-1 sm:w-fit">
            {tabItems.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  className={[
                    'inline-flex min-w-max items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-bold transition sm:px-4',
                    isActive ? 'bg-white text-[#0b5cff] shadow-sm' : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                  type="button"
                  onClick={() => setTab(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {loadArticleError && (
          <p className="mx-5 mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 sm:mx-6">
            {loadArticleError}
          </p>
        )}

        {tab === 'banners' && (
          <BannerTable
            banners={bannersQuery.data ?? []}
            isLoading={bannersQuery.isLoading}
            isError={bannersQuery.isError}
            isUpdating={contentActionMutation.isPending}
            onEdit={(banner) => {
              setBannerEditingId(banner.id);
              setBannerForm({
                title: banner.title,
                redirectUrl: banner.redirectUrl ?? '',
                position: banner.position,
                sortOrder: banner.sortOrder,
                file: null,
              });
            }}
            onAction={(id, action) => contentActionMutation.mutate({ resource: 'banner', id, action })}
          />
        )}
        {tab === 'pages' && (
          <PageTable
            pages={pagesQuery.data ?? []}
            isLoading={pagesQuery.isLoading}
            isError={pagesQuery.isError}
            isUpdating={contentActionMutation.isPending}
            onEdit={(page) => {
              setPageEditingId(page.id);
              setPageForm({
                title: page.title,
                slug: page.slug,
                content: page.content,
                metaTitle: page.metaTitle ?? '',
                metaDescription: page.metaDescription ?? '',
              });
            }}
            onAction={(id, action) => contentActionMutation.mutate({ resource: 'page', id, action })}
          />
        )}
        {tab === 'articles' && (
          <ArticleTable
            articles={articles}
            isLoading={articlesQuery.isLoading}
            isError={articlesQuery.isError}
            isUpdating={contentActionMutation.isPending}
            editingArticleId={articleLoadingId}
            page={articlePage}
            totalPages={totalArticlePages}
            totalArticles={articlesQuery.data?.totalElements ?? 0}
            onEdit={openArticleForEdit}
            onPreviousPage={() => setArticlePage((current) => Math.max(current - 1, 0))}
            onNextPage={() => setArticlePage((current) => Math.min(current + 1, totalArticlePages - 1))}
            onAction={(id, action) => contentActionMutation.mutate({ resource: 'article', id, action })}
          />
        )}
      </section>

      {contentActionMutation.error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(contentActionMutation.error)}
        </p>
      )}

      {bannerForm && (
        <CmsModal
          title={bannerEditingId ? 'Cập nhật banner' : 'Thêm banner'}
          description="Banner mới luôn được lưu dưới dạng bản nháp. Hãy xuất bản sau khi kiểm tra ảnh và đường dẫn."
          onClose={() => setBannerForm(null)}
        >
          <form
            className="space-y-5 p-5 sm:p-6"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              saveBannerMutation.mutate({ id: bannerEditingId, payload: bannerForm });
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tiêu đề banner</span>
              <input
                required
                maxLength={150}
                className={inputClassName}
                placeholder="Ví dụ: Ưu đãi gaming cuối tuần"
                value={bannerForm.title}
                onChange={(event) => setBannerForm({ ...bannerForm, title: event.target.value })}
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Vị trí hiển thị</span>
                <select
                  className={inputClassName}
                  value={bannerForm.position}
                  onChange={(event) => setBannerForm({ ...bannerForm, position: event.target.value as BannerPosition })}
                >
                  <option value="HOME_HERO">Hero trang chủ</option>
                  <option value="HOME_PROMOTION">Khuyến mãi trang chủ</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Thứ tự hiển thị</span>
                <input
                  required
                  min={0}
                  type="number"
                  className={inputClassName}
                  value={bannerForm.sortOrder}
                  onChange={(event) => setBannerForm({ ...bannerForm, sortOrder: Number(event.target.value) })}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Đường dẫn điều hướng</span>
              <input
                maxLength={500}
                className={inputClassName}
                placeholder="Ví dụ: /products?categoryId=1"
                value={bannerForm.redirectUrl ?? ''}
                onChange={(event) => setBannerForm({ ...bannerForm, redirectUrl: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Ảnh banner {bannerEditingId ? '(tùy chọn khi cập nhật)' : ''}
              </span>
              <input
                required={!bannerEditingId}
                accept="image/jpeg,image/png,image/webp"
                className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#0b5cff]"
                type="file"
                onChange={(event) => setBannerForm({ ...bannerForm, file: event.target.files?.[0] ?? null })}
              />
              <p className="mt-2 text-xs text-slate-400">Chỉ hỗ trợ JPEG, PNG hoặc WebP; backend giới hạn dung lượng 5 MB.</p>
            </label>
            <MutationError error={saveBannerMutation.error} />
            <FormActions
              isPending={saveBannerMutation.isPending}
              label={bannerEditingId ? 'Lưu thay đổi' : 'Tạo banner'}
              onCancel={() => setBannerForm(null)}
            />
          </form>
        </CmsModal>
      )}

      {pageForm && (
        <CmsModal
          title={pageEditingId ? 'Cập nhật trang tĩnh' : 'Thêm trang tĩnh'}
          description="Slug được dùng trong đường dẫn public, ví dụ /pages/chinh-sach-bao-hanh."
          onClose={() => setPageForm(null)}
        >
          <form
            className="space-y-5 p-5 sm:p-6"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              savePageMutation.mutate({ id: pageEditingId, payload: pageForm });
            }}
          >
            <div className="grid gap-5 sm:grid-cols-[1.2fr_0.8fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Tiêu đề</span>
                <input
                  required
                  maxLength={150}
                  className={inputClassName}
                  placeholder="Ví dụ: Chính sách bảo hành"
                  value={pageForm.title}
                  onChange={(event) => setPageForm({ ...pageForm, title: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  Slug
                  <button
                    className="text-xs text-[#0b5cff] hover:underline"
                    type="button"
                    onClick={() => setPageForm({ ...pageForm, slug: slugify(pageForm.title) })}
                  >
                    Tạo từ tiêu đề
                  </button>
                </span>
                <input
                  required
                  maxLength={200}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  className={inputClassName}
                  placeholder="chinh-sach-bao-hanh"
                  value={pageForm.slug}
                  onChange={(event) => setPageForm({ ...pageForm, slug: slugify(event.target.value) })}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Nội dung</span>
              <textarea
                required
                rows={10}
                maxLength={50000}
                className={inputClassName}
                placeholder="Nhập nội dung trang. Bạn có thể dùng văn bản hoặc HTML đơn giản."
                value={pageForm.content}
                onChange={(event) => setPageForm({ ...pageForm, content: event.target.value })}
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">SEO title</span>
                <input
                  maxLength={150}
                  className={inputClassName}
                  value={pageForm.metaTitle ?? ''}
                  onChange={(event) => setPageForm({ ...pageForm, metaTitle: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">SEO description</span>
                <input
                  maxLength={300}
                  className={inputClassName}
                  value={pageForm.metaDescription ?? ''}
                  onChange={(event) => setPageForm({ ...pageForm, metaDescription: event.target.value })}
                />
              </label>
            </div>
            <MutationError error={savePageMutation.error} />
            <FormActions
              isPending={savePageMutation.isPending}
              label={pageEditingId ? 'Lưu thay đổi' : 'Tạo trang'}
              onCancel={() => setPageForm(null)}
            />
          </form>
        </CmsModal>
      )}

      {articleForm && (
        <CmsModal
          title={articleEditingId ? 'Cập nhật bài viết' : 'Thêm bài viết'}
          description="Bài viết được tạo ở trạng thái bản nháp; ảnh bìa là bắt buộc khi tạo mới."
          onClose={() => setArticleForm(null)}
        >
          <form
            className="space-y-5 p-5 sm:p-6"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              saveArticleMutation.mutate({ id: articleEditingId, payload: articleForm });
            }}
          >
            <div className="grid gap-5 sm:grid-cols-[1.2fr_0.8fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Tiêu đề</span>
                <input
                  required
                  maxLength={150}
                  className={inputClassName}
                  placeholder="Ví dụ: Cách chọn chuột gaming phù hợp"
                  value={articleForm.title}
                  onChange={(event) => setArticleForm({ ...articleForm, title: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  Slug
                  <button
                    className="text-xs text-[#0b5cff] hover:underline"
                    type="button"
                    onClick={() => setArticleForm({ ...articleForm, slug: slugify(articleForm.title) })}
                  >
                    Tạo từ tiêu đề
                  </button>
                </span>
                <input
                  required
                  maxLength={200}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  className={inputClassName}
                  placeholder="cach-chon-chuot-gaming"
                  value={articleForm.slug}
                  onChange={(event) => setArticleForm({ ...articleForm, slug: slugify(event.target.value) })}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tóm tắt</span>
              <textarea
                rows={3}
                maxLength={500}
                className={inputClassName}
                placeholder="Đoạn giới thiệu ngắn cho danh sách bài viết."
                value={articleForm.excerpt ?? ''}
                onChange={(event) => setArticleForm({ ...articleForm, excerpt: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Nội dung</span>
              <textarea
                required
                rows={10}
                maxLength={50000}
                className={inputClassName}
                placeholder="Nhập nội dung bài viết. Bạn có thể dùng văn bản hoặc HTML đơn giản."
                value={articleForm.content}
                onChange={(event) => setArticleForm({ ...articleForm, content: event.target.value })}
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">SEO title</span>
                <input
                  maxLength={160}
                  className={inputClassName}
                  value={articleForm.metaTitle ?? ''}
                  onChange={(event) => setArticleForm({ ...articleForm, metaTitle: event.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">SEO description</span>
                <input
                  maxLength={300}
                  className={inputClassName}
                  value={articleForm.metaDescription ?? ''}
                  onChange={(event) => setArticleForm({ ...articleForm, metaDescription: event.target.value })}
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Ảnh bìa {articleEditingId ? '(tùy chọn khi cập nhật)' : ''}
              </span>
              <input
                required={!articleEditingId}
                accept="image/jpeg,image/png,image/webp"
                className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#0b5cff]"
                type="file"
                onChange={(event) => setArticleForm({ ...articleForm, coverImage: event.target.files?.[0] ?? null })}
              />
              <p className="mt-2 text-xs text-slate-400">Chỉ hỗ trợ JPEG, PNG hoặc WebP; backend giới hạn dung lượng 5 MB.</p>
            </label>
            <MutationError error={saveArticleMutation.error} />
            <FormActions
              isPending={saveArticleMutation.isPending}
              label={articleEditingId ? 'Lưu thay đổi' : 'Tạo bài viết'}
              onCancel={() => setArticleForm(null)}
            />
          </form>
        </CmsModal>
      )}
    </section>
  );
}

function BannerTable({
  banners,
  isLoading,
  isError,
  isUpdating,
  onEdit,
  onAction,
}: {
  banners: Banner[];
  isLoading: boolean;
  isError: boolean;
  isUpdating: boolean;
  onEdit: (banner: Banner) => void;
  onAction: (id: number, action: ContentAction) => void;
}) {
  if (isError) return <ContentError />;
  if (!isLoading && banners.length === 0) return <EmptyContent label="banner nào" />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-3.5 font-semibold sm:px-6">Ảnh</th>
            <th className="px-5 py-3.5 font-semibold">Tiêu đề</th>
            <th className="px-5 py-3.5 font-semibold">Vị trí</th>
            <th className="px-5 py-3.5 font-semibold">Thứ tự</th>
            <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
            <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? <LoadingRows columns={6} /> : banners.map((banner) => (
            <tr key={banner.id} className="transition hover:bg-slate-50/70">
              <td className="px-5 py-3.5 sm:px-6">
                <img className="h-12 w-20 rounded-lg border border-slate-100 object-cover" src={banner.imageUrl} alt="" />
              </td>
              <td className="px-5 py-3.5">
                <p className="max-w-xs font-bold text-slate-800">{banner.title}</p>
                <p className="mt-1 max-w-xs truncate text-xs text-slate-400">{banner.redirectUrl || 'Không có đường dẫn'}</p>
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                {banner.position === 'HOME_HERO' ? 'Hero trang chủ' : 'Khuyến mãi'}
              </td>
              <td className="px-5 py-3.5 text-center font-semibold text-slate-600">{banner.sortOrder}</td>
              <td className="px-5 py-3.5"><ContentStatusBadge status={banner.status} /></td>
              <td className="px-5 py-3.5 text-right sm:px-6">
                <ContentActions status={banner.status} isUpdating={isUpdating} onEdit={() => onEdit(banner)} onAction={(action) => onAction(banner.id, action)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageTable({
  pages,
  isLoading,
  isError,
  isUpdating,
  onEdit,
  onAction,
}: {
  pages: StaticPage[];
  isLoading: boolean;
  isError: boolean;
  isUpdating: boolean;
  onEdit: (page: StaticPage) => void;
  onAction: (id: number, action: ContentAction) => void;
}) {
  if (isError) return <ContentError />;
  if (!isLoading && pages.length === 0) return <EmptyContent label="trang tĩnh nào" />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-3.5 font-semibold sm:px-6">ID</th>
            <th className="px-5 py-3.5 font-semibold">Tiêu đề</th>
            <th className="px-5 py-3.5 font-semibold">Slug</th>
            <th className="px-5 py-3.5 font-semibold">Cập nhật</th>
            <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
            <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? <LoadingRows columns={6} /> : pages.map((page) => (
            <tr key={page.id} className="transition hover:bg-slate-50/70">
              <td className="px-5 py-4 font-semibold text-slate-500 sm:px-6">#{page.id}</td>
              <td className="px-5 py-4 font-bold text-slate-800">{page.title}</td>
              <td className="px-5 py-4 font-mono text-xs text-slate-500">/{page.slug}</td>
              <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">{formatDate(page.updatedAt)}</td>
              <td className="px-5 py-4"><ContentStatusBadge status={page.status} /></td>
              <td className="px-5 py-4 text-right sm:px-6">
                <ContentActions status={page.status} isUpdating={isUpdating} onEdit={() => onEdit(page)} onAction={(action) => onAction(page.id, action)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArticleTable({
  articles,
  isLoading,
  isError,
  isUpdating,
  editingArticleId,
  page,
  totalPages,
  totalArticles,
  onEdit,
  onPreviousPage,
  onNextPage,
  onAction,
}: {
  articles: ArticleSummary[];
  isLoading: boolean;
  isError: boolean;
  isUpdating: boolean;
  editingArticleId: number | null;
  page: number;
  totalPages: number;
  totalArticles: number;
  onEdit: (article: ArticleSummary) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onAction: (id: number, action: ContentAction) => void;
}) {
  if (isError) return <ContentError />;
  if (!isLoading && articles.length === 0) return <EmptyContent label="bài viết nào" />;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3.5 font-semibold sm:px-6">Ảnh bìa</th>
              <th className="px-5 py-3.5 font-semibold">Bài viết</th>
              <th className="px-5 py-3.5 font-semibold">Slug</th>
              <th className="px-5 py-3.5 font-semibold">Ngày đăng</th>
              <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
              <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? <LoadingRows columns={6} /> : articles.map((article) => (
              <tr key={article.id} className="transition hover:bg-slate-50/70">
                <td className="px-5 py-3.5 sm:px-6">
                  {article.coverImageUrl ? (
                    <img className="h-12 w-16 rounded-lg border border-slate-100 object-cover" src={article.coverImageUrl} alt="" />
                  ) : (
                    <span className="grid h-12 w-16 place-items-center rounded-lg bg-slate-100 text-slate-400"><ImagePlus className="h-4 w-4" /></span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <p className="max-w-xs font-bold text-slate-800">{article.title}</p>
                  <p className="mt-1 max-w-xs truncate text-xs text-slate-400">{article.excerpt || 'Chưa có tóm tắt'}</p>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{article.slug}</td>
                <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-400">{formatDate(article.publishedAt)}</td>
                <td className="px-5 py-3.5"><ContentStatusBadge status={article.status} /></td>
                <td className="px-5 py-3.5 text-right sm:px-6">
                  <ContentActions
                    status={article.status}
                    isUpdating={isUpdating || editingArticleId === article.id}
                    onEdit={() => onEdit(article)}
                    onAction={(action) => onAction(article.id, action)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-slate-400">Tổng cộng {totalArticles} bài viết</p>
        <div className="flex items-center gap-2">
          <button
            aria-label="Trang trước"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b5cff] disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={page === 0}
            onClick={onPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-20 text-center text-sm font-semibold text-slate-600">{page + 1} / {totalPages}</span>
          <button
            aria-label="Trang sau"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b5cff] disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={page >= totalPages - 1}
            onClick={onNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function ContentActions({
  status,
  isUpdating,
  onEdit,
  onAction,
}: {
  status: ContentStatus;
  isUpdating: boolean;
  onEdit: () => void;
  onAction: (action: ContentAction) => void;
}) {
  return (
    <div className="flex min-w-40 flex-col items-end gap-2">
      <button
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-[#0b5cff] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={isUpdating}
        onClick={onEdit}
      >
        {isUpdating && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
        <Edit3 className="h-3.5 w-3.5" />
        Sửa
      </button>
      {status === 'DRAFT' && (
        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={isUpdating}
          onClick={() => onAction('publish')}
        >
          <Send className="h-3.5 w-3.5" />
          Xuất bản
        </button>
      )}
      {status !== 'ARCHIVED' && (
        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={isUpdating}
          onClick={() => onAction('archive')}
        >
          <Archive className="h-3.5 w-3.5" />
          Lưu trữ
        </button>
      )}
      {status === 'ARCHIVED' && (
        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={isUpdating}
          onClick={() => onAction('restore')}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Khôi phục
        </button>
      )}
    </div>
  );
}

function FormActions({ isPending, label, onCancel }: { isPending: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
      <button
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        type="button"
        onClick={onCancel}
      >
        Hủy
      </button>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b5cff] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        type="submit"
        disabled={isPending}
      >
        {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {label}
      </button>
    </div>
  );
}

function MutationError({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">{getErrorMessage(error)}</p>;
}

function LoadingRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-4 sm:px-6" colSpan={columns}>
            <div className="h-5 animate-pulse rounded bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}

function ContentError() {
  return (
    <div className="p-10 text-center">
      <p className="text-sm font-semibold text-rose-600">Không thể tải nội dung CMS.</p>
      <p className="mt-1 text-sm text-slate-400">Hãy kiểm tra quyền quản trị hoặc thử tải lại trang.</p>
    </div>
  );
}

export default AdminCmsPage;
