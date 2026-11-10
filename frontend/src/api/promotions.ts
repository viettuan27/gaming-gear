import { apiClient, unwrapResponse } from './client';
import type { ArticleDetail, ArticlePayload, ArticleSummary, PageResponse, Product } from '../types/api';

export interface PromotionDetail extends ArticleDetail { productIds: number[]; categoryIds: number[] }
export interface PromotionPayload extends ArticlePayload { productIds: number[]; categoryIds: number[] }

function toForm(payload: PromotionPayload) {
  const form = new FormData();
  form.append('title', payload.title);
  form.append('slug', payload.slug);
  form.append('content', payload.content);
  form.append('excerpt', payload.excerpt ?? '');
  form.append('metaTitle', payload.metaTitle ?? '');
  form.append('metaDescription', payload.metaDescription ?? '');
  payload.productIds.forEach((id, index) => form.append(`productIds[${index}]`, String(id)));
  payload.categoryIds.forEach((id, index) => form.append(`categoryIds[${index}]`, String(id)));
  if (payload.coverImage) form.append('coverImage', payload.coverImage);
  return form;
}

export const promotionApi = {
  list: (page = 0) => unwrapResponse<PageResponse<ArticleSummary>>(apiClient.get('/promotions', { params: { page, size: 9 } })),
  detail: (slug: string) => unwrapResponse<PromotionDetail>(apiClient.get(`/promotions/${slug}`)),
  products: (slug: string, page = 0) => unwrapResponse<PageResponse<Product>>(apiClient.get(`/promotions/${slug}/products`, { params: { page, size: 12 } })),
  adminList: (page = 0) => unwrapResponse<PageResponse<ArticleSummary>>(apiClient.get('/admin/cms/promotions', { params: { page, size: 10 } })),
  adminDetail: (id: number) => unwrapResponse<PromotionDetail>(apiClient.get(`/admin/cms/promotions/${id}`)),
  save: (id: number | null, payload: PromotionPayload) => unwrapResponse<PromotionDetail>(id === null ? apiClient.post('/admin/cms/promotions', toForm(payload)) : apiClient.put(`/admin/cms/promotions/${id}`, toForm(payload))),
  action: (id: number, action: 'publish' | 'archive' | 'restore') => unwrapResponse<PromotionDetail>(apiClient.patch(`/admin/cms/promotions/${id}/${action}`)),
};
