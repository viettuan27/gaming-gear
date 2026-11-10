import { useEffect, useState, type ComponentType, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '../../api/services';
import { promotionApi, type PromotionPayload } from '../../api/promotions';
import type { ArticleSummary } from '../../types/api';

const emptyForm = (): PromotionPayload => ({ title: '', slug: '', excerpt: '', content: '', metaTitle: '', metaDescription: '', coverImage: null, productIds: [], categoryIds: [] });
const field = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';
const button = 'rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50';
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

type PromotionAction = 'publish' | 'archive' | 'restore';
type ArticleTableProps = {
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
  onAction: (id: number, action: PromotionAction) => void;
  contentLabel?: string;
  columnLabel?: string;
};

export function AdminPromotions({ ArticleTable, createRequested, onCreateHandled }: {
  ArticleTable: ComponentType<ArticleTableProps>;
  createRequested: boolean;
  onCreateHandled: () => void;
}) {
  const client = useQueryClient();
  const [page, setPage] = useState(0);
  const [productPage, setProductPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [id, setId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromotionPayload | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!createRequested) return;
    setId(null);
    setForm(emptyForm());
    setError('');
    onCreateHandled();
  }, [createRequested, onCreateHandled]);
  const promotions = useQuery({ queryKey: ['admin', 'promotions', page], queryFn: () => promotionApi.adminList(page) });
  const categories = useQuery({ queryKey: ['categories'], queryFn: catalogApi.getCategories });
  const products = useQuery({ queryKey: ['promotion-picker', keyword, productPage], queryFn: () => catalogApi.getProducts({ keyword: keyword || undefined, page: productPage, size: 12 }) });
  const selectedProducts = useQuery({ queryKey: ['promotion-selected', form?.productIds], queryFn: () => Promise.all((form?.productIds ?? []).map(async (productId) => { try { const product = await catalogApi.getProductById(productId); return { id: productId, name: product.name }; } catch { return { id: productId, name: `Sản phẩm #${productId} (không còn hiển thị)` }; } })), enabled: !!form && form.productIds.length > 0 });
  const save = useMutation({ mutationFn: () => promotionApi.save(id, form!), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin', 'promotions'] }); setForm(null); setError(''); }, onError: (e) => setError(e instanceof Error ? e.message : 'Không thể lưu bài khuyến mãi.') });
  const action = useMutation({ mutationFn: ({ promotionId, type }: { promotionId: number; type: 'publish' | 'archive' | 'restore' }) => promotionApi.action(promotionId, type), onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'promotions'] }), onError: (e) => setError(e instanceof Error ? e.message : 'Không thể cập nhật trạng thái.') });
  async function edit(promotionId: number) {
    setLoadingId(promotionId);
    try { const data = await promotionApi.adminDetail(promotionId); setId(data.id); setForm({ ...data, excerpt: data.excerpt ?? '', coverImage: null, productIds: data.productIds, categoryIds: data.categoryIds }); setError(''); }
    catch { setError('Không thể tải bài khuyến mãi.'); }
    finally { setLoadingId(null); }
  }
  function submit(event: FormEvent) { event.preventDefault(); if (form) save.mutate(); }
  const totalPages = Math.max(promotions.data?.totalPages ?? 1, 1);
  return <>
    {error && <p role="alert" className="mx-5 mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
    <ArticleTable
      articles={promotions.data?.content ?? []}
      isLoading={promotions.isLoading}
      isError={promotions.isError}
      isUpdating={action.isPending}
      editingArticleId={loadingId}
      page={page}
      totalPages={totalPages}
      totalArticles={promotions.data?.totalElements ?? 0}
      onEdit={(item) => { void edit(item.id); }}
      onPreviousPage={() => setPage((current) => Math.max(current - 1, 0))}
      onNextPage={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
      onAction={(promotionId, type) => action.mutate({ promotionId, type })}
      contentLabel="bài khuyến mãi"
      columnLabel="Khuyến mãi"
    />
    {form && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4"><form onSubmit={submit} className="mx-auto max-w-3xl space-y-4 rounded-2xl bg-white p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">{id === null ? 'Thêm' : 'Sửa'} bài khuyến mãi</h2><button type="button" onClick={() => setForm(null)}>Đóng ✕</button></div>
      <label className="block">Tiêu đề<input required maxLength={150} className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label className="block">Đường dẫn (slug)<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" className={field} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="uu-dai-ban-phim" /><button type="button" className="mt-1 text-sm text-blue-600" onClick={() => setForm({ ...form, slug: slugify(form.title) })}>Tạo từ tiêu đề</button></label>
      <label className="block">Tóm tắt<textarea className={field} value={form.excerpt ?? ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></label>
      <label className="block">Nội dung<textarea required rows={6} className={field} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
      <label className="block">Tiêu đề SEO<input maxLength={160} className={field} value={form.metaTitle ?? ''} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} /></label>
      <label className="block">Mô tả SEO<textarea maxLength={300} className={field} value={form.metaDescription ?? ''} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} /></label>
      <label className="block">Ảnh đại diện<input className={field} type="file" accept="image/*" onChange={(e) => setForm({ ...form, coverImage: e.target.files?.[0] ?? null })} /></label>
      <div><h3 className="font-bold">Danh mục sản phẩm</h3><p className="text-sm text-slate-500">Sản phẩm mới trong danh mục sẽ tự xuất hiện trong bài.</p><div className="grid gap-2 sm:grid-cols-2">{categories.data?.map((category) => <label key={category.id}><input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => setForm({ ...form, categoryIds: form.categoryIds.includes(category.id) ? form.categoryIds.filter((value) => value !== category.id) : [...form.categoryIds, category.id] })} /> {category.name}</label>)}</div></div>
      <div><h3 className="font-bold">Sản phẩm chọn thêm</h3><input className={field} placeholder="Tìm sản phẩm" value={keyword} onChange={(e) => { setKeyword(e.target.value); setProductPage(0); }} /><div className="max-h-48 overflow-y-auto">{products.data?.content.map((product) => <label className="block py-1" key={product.id}><input type="checkbox" checked={form.productIds.includes(product.id)} onChange={() => setForm({ ...form, productIds: form.productIds.includes(product.id) ? form.productIds.filter((value) => value !== product.id) : [...form.productIds, product.id] })} /> {product.name}</label>)}</div><div className="flex gap-4 text-sm"><button type="button" disabled={!productPage} onClick={() => setProductPage(productPage - 1)}>← Trước</button><span>Trang {productPage + 1}</span><button type="button" disabled={productPage + 1 >= (products.data?.totalPages ?? 0)} onClick={() => setProductPage(productPage + 1)}>Sau →</button></div><p className="mt-2 text-sm">Đã chọn: {form.productIds.length} sản phẩm</p><div>{selectedProducts.data?.map((product) => <p key={product.id} className="flex items-center justify-between gap-2 text-sm">{product.name}<button type="button" className="text-rose-600" onClick={() => setForm({ ...form, productIds: form.productIds.filter((value) => value !== product.id) })}>Bỏ chọn</button></p>)}</div></div>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}<button className={button} type="submit" disabled={save.isPending}>Lưu bài khuyến mãi</button>
    </form></div>}
  </>;
}
