import { apiClient, unwrapResponse } from './client';
import type {
  AddCartItemPayload,
  AdminOrderListParams,
  ArticleDetail,
  ArticleListParams,
  ArticlePayload,
  ArticleSummary,
  AuthResponse,
  Banner,
  BannerPayload,
  BannerPosition,
  Brand,
  BrandPayload,
  Cart,
  Category,
  CategoryPayload,
  ContentStatus,
  CreateOrderPayload,
  LoginRequest,
  Order,
  OrderListParams,
  OrderStatus,
  OrderSummary,
  PageResponse,
  Product,
  ProductDetails,
  ProductFilters,
  ProductImage,
  ProductImagePayload,
  ProductPayload,
  ProductVariant,
  ProductVariantPayload,
  RegisterRequest,
  StaticPage,
  StaticPagePayload,
  UpdateCartItemPayload,
} from '../types/api';

function appendOptionalText(
  formData: FormData,
  field: string,
  value: string | number | null | undefined,
): void {
  if (value !== null && value !== undefined) {
    formData.append(field, String(value));
  }
}

function createBannerFormData(payload: BannerPayload): FormData {
  const formData = new FormData();
  formData.append('title', payload.title);
  appendOptionalText(formData, 'redirectUrl', payload.redirectUrl);
  formData.append('position', payload.position);
  formData.append('sortOrder', String(payload.sortOrder));

  if (payload.file) {
    formData.append('file', payload.file);
  }

  return formData;
}

function createArticleFormData(payload: ArticlePayload): FormData {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('slug', payload.slug);
  appendOptionalText(formData, 'excerpt', payload.excerpt);
  formData.append('content', payload.content);
  appendOptionalText(formData, 'metaTitle', payload.metaTitle);
  appendOptionalText(formData, 'metaDescription', payload.metaDescription);

  if (payload.coverImage) {
    formData.append('coverImage', payload.coverImage);
  }

  return formData;
}

export const authApi = {
  login: (payload: LoginRequest) =>
    unwrapResponse<AuthResponse>(apiClient.post('/auth/login', payload)),

  register: (payload: RegisterRequest) =>
    unwrapResponse<AuthResponse>(apiClient.post('/auth/register', payload)),

  refreshToken: (refreshToken: string) =>
    unwrapResponse<AuthResponse>(
      apiClient.post('/auth/refresh-token', {
        refreshToken,
      }),
    ),

  logout: (refreshToken: string) =>
    unwrapResponse<void>(
      apiClient.post('/auth/logout', {
        refreshToken,
      }),
    ),
};

export const catalogApi = {
  getCategories: () => unwrapResponse<Category[]>(apiClient.get('/categories')),

  getBrands: () => unwrapResponse<Brand[]>(apiClient.get('/brands')),

  getProducts: (filters: ProductFilters = {}) =>
    unwrapResponse<PageResponse<Product>>(
      apiClient.get('/products', {
        params: filters,
      }),
    ),

  getProductDetails: (productId: number) =>
    unwrapResponse<ProductDetails>(apiClient.get(`/products/${productId}`)),

  // Alias ngắn gọn cho component; cả hai tên cùng gọi endpoint /products/{id}.
  getProductById: (productId: number) =>
    unwrapResponse<ProductDetails>(apiClient.get(`/products/${productId}`)),
};

export const cartApi = {
  getCart: () => unwrapResponse<Cart>(apiClient.get('/cart')),

  addItem: (payload: AddCartItemPayload) =>
    unwrapResponse<Cart>(apiClient.post('/cart/items', payload)),

  updateItem: (cartItemId: number, payload: UpdateCartItemPayload) =>
    unwrapResponse<Cart>(apiClient.put(`/cart/items/${cartItemId}`, payload)),

  removeItem: (cartItemId: number) =>
    unwrapResponse<Cart>(apiClient.delete(`/cart/items/${cartItemId}`)),

  clear: () => unwrapResponse<Cart>(apiClient.delete('/cart')),
};

export const orderApi = {
  create: (payload: CreateOrderPayload) =>
    unwrapResponse<Order>(apiClient.post('/orders', payload)),

  getMyOrders: (params: OrderListParams = {}) =>
    unwrapResponse<PageResponse<OrderSummary>>(
      apiClient.get('/orders/my', {
        params,
      }),
    ),

  getDetails: (orderId: number) =>
    unwrapResponse<Order>(apiClient.get(`/orders/${orderId}`)),

  // Alias dễ đọc tại các trang chi tiết đơn hàng.
  getOrderById: (orderId: number) =>
    unwrapResponse<Order>(apiClient.get(`/orders/${orderId}`)),

  cancel: (orderId: number) =>
    unwrapResponse<Order>(apiClient.put(`/orders/${orderId}/cancel`)),
};

export const adminApi = {
  getCategories: () => unwrapResponse<Category[]>(apiClient.get('/admin/categories')),

  createCategory: (payload: CategoryPayload) =>
    unwrapResponse<Category>(apiClient.post('/admin/categories', payload)),

  updateCategory: (categoryId: number, payload: CategoryPayload) =>
    unwrapResponse<Category>(apiClient.put(`/admin/categories/${categoryId}`, payload)),

  getBrands: () => unwrapResponse<Brand[]>(apiClient.get('/admin/brands')),

  createBrand: (payload: BrandPayload) =>
    unwrapResponse<Brand>(apiClient.post('/admin/brands', payload)),

  updateBrand: (brandId: number, payload: BrandPayload) =>
    unwrapResponse<Brand>(apiClient.put(`/admin/brands/${brandId}`, payload)),

  // Backend hiện dùng chung endpoint phân trang /products cho trang quản trị.
  // API này chỉ trả về sản phẩm đang active, đúng với contract hiện có của backend.
  getProducts: (filters: ProductFilters = {}) =>
    unwrapResponse<PageResponse<Product>>(
      apiClient.get('/products', {
        params: filters,
      }),
    ),

  createProduct: (payload: ProductPayload) =>
    unwrapResponse<Product>(apiClient.post('/admin/products', payload)),

  updateProduct: (productId: number, payload: ProductPayload) =>
    unwrapResponse<Product>(apiClient.put(`/admin/products/${productId}`, payload)),

  createVariant: (productId: number, payload: ProductVariantPayload) =>
    unwrapResponse<ProductVariant>(
      apiClient.post(`/admin/products/${productId}/variants`, payload),
    ),

  updateVariant: (variantId: number, payload: ProductVariantPayload) =>
    unwrapResponse<ProductVariant>(apiClient.put(`/admin/variants/${variantId}`, payload)),

  uploadProductImage: (productId: number, payload: ProductImagePayload) => {
    if (!payload.file) {
      return Promise.reject(new Error('Vui lòng chọn ảnh sản phẩm.'));
    }

    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('sortOrder', String(payload.sortOrder));

    return unwrapResponse<ProductImage>(
      apiClient.post(`/admin/products/${productId}/images`, formData),
    );
  },

  updateProductImage: (imageId: number, payload: ProductImagePayload) => {
    const formData = new FormData();
    formData.append('sortOrder', String(payload.sortOrder));

    if (payload.file) {
      formData.append('file', payload.file);
    }

    return unwrapResponse<ProductImage>(apiClient.put(`/admin/images/${imageId}`, formData));
  },

  deleteProductImage: (imageId: number) =>
    unwrapResponse<void>(apiClient.delete(`/admin/images/${imageId}`)),

  getOrders: (params: AdminOrderListParams = {}) =>
    unwrapResponse<PageResponse<OrderSummary>>(
      apiClient.get('/admin/orders', {
        params,
      }),
    ),

  updateOrderStatus: (orderId: number, status: OrderStatus) =>
    unwrapResponse<Order>(
      apiClient.put(`/admin/orders/${orderId}/status`, {
        status,
      }),
    ),
};

function contentStatusAction<T>(
  resource: 'banners' | 'pages' | 'articles',
  id: number,
  action: 'publish' | 'unpublish' | 'archive' | 'restore',
): Promise<T> {
  return unwrapResponse<T>(apiClient.patch(`/admin/cms/${resource}/${id}/${action}`));
}

export const cmsApi = {
  getPublishedBanners: (position: BannerPosition) =>
    unwrapResponse<Banner[]>(
      apiClient.get('/banners', {
        params: {
          position,
        },
      }),
    ),

  getPublicBanners: (position: BannerPosition = 'HOME_HERO') =>
    unwrapResponse<Banner[]>(
      apiClient.get('/banners', {
        params: {
          position,
        },
      }),
    ),

  getPublishedPages: () =>
    unwrapResponse<StaticPage[]>(apiClient.get('/pages')),

  getPublishedPage: (slug: string) =>
    unwrapResponse<StaticPage>(apiClient.get(`/pages/${slug}`)),

  getPublicPage: (slug: string) =>
    unwrapResponse<StaticPage>(apiClient.get(`/pages/${slug}`)),

  getPublishedArticles: (params: Omit<ArticleListParams, 'status'> = {}) =>
    unwrapResponse<PageResponse<ArticleSummary>>(
      apiClient.get('/articles', {
        params,
      }),
    ),

  getPublicArticles: (params: Omit<ArticleListParams, 'status'> = {}) =>
    unwrapResponse<PageResponse<ArticleSummary>>(
      apiClient.get('/articles', {
        params,
      }),
    ),

  getPublishedArticle: (slug: string) =>
    unwrapResponse<ArticleDetail>(apiClient.get(`/articles/${slug}`)),

  getPublicArticle: (slug: string) =>
    unwrapResponse<ArticleDetail>(apiClient.get(`/articles/${slug}`)),

  getBanners: () => unwrapResponse<Banner[]>(apiClient.get('/admin/cms/banners')),

  getBanner: (bannerId: number) =>
    unwrapResponse<Banner>(apiClient.get(`/admin/cms/banners/${bannerId}`)),

  createBanner: (payload: BannerPayload) => {
    if (!payload.file) {
      return Promise.reject(new Error('Vui lòng chọn ảnh banner.'));
    }

    return unwrapResponse<Banner>(
      apiClient.post('/admin/cms/banners', createBannerFormData(payload)),
    );
  },

  updateBanner: (bannerId: number, payload: BannerPayload) =>
    unwrapResponse<Banner>(
      apiClient.put(`/admin/cms/banners/${bannerId}`, createBannerFormData(payload)),
    ),

  publishBanner: (bannerId: number) =>
    contentStatusAction<Banner>('banners', bannerId, 'publish'),

  unpublishBanner: (bannerId: number) =>
    contentStatusAction<Banner>('banners', bannerId, 'unpublish'),

  archiveBanner: (bannerId: number) =>
    contentStatusAction<Banner>('banners', bannerId, 'archive'),

  restoreBanner: (bannerId: number) =>
    contentStatusAction<Banner>('banners', bannerId, 'restore'),

  deleteBanner: (bannerId: number) =>
    unwrapResponse<void>(apiClient.delete(`/admin/cms/banners/${bannerId}`)),

  getPages: () => unwrapResponse<StaticPage[]>(apiClient.get('/admin/cms/pages')),

  getPage: (pageId: number) =>
    unwrapResponse<StaticPage>(apiClient.get(`/admin/cms/pages/${pageId}`)),

  createPage: (payload: StaticPagePayload) =>
    unwrapResponse<StaticPage>(apiClient.post('/admin/cms/pages', payload)),

  updatePage: (pageId: number, payload: StaticPagePayload) =>
    unwrapResponse<StaticPage>(apiClient.put(`/admin/cms/pages/${pageId}`, payload)),

  publishPage: (pageId: number) => contentStatusAction<StaticPage>('pages', pageId, 'publish'),

  unpublishPage: (pageId: number) =>
    contentStatusAction<StaticPage>('pages', pageId, 'unpublish'),

  archivePage: (pageId: number) => contentStatusAction<StaticPage>('pages', pageId, 'archive'),

  restorePage: (pageId: number) => contentStatusAction<StaticPage>('pages', pageId, 'restore'),

  deletePage: (pageId: number) =>
    unwrapResponse<void>(apiClient.delete(`/admin/cms/pages/${pageId}`)),

  getArticles: (params: ArticleListParams = {}) =>
    unwrapResponse<PageResponse<ArticleSummary>>(
      apiClient.get('/admin/cms/articles', {
        params,
      }),
    ),

  getArticle: (articleId: number) =>
    unwrapResponse<ArticleDetail>(apiClient.get(`/admin/cms/articles/${articleId}`)),

  createArticle: (payload: ArticlePayload) =>
    unwrapResponse<ArticleDetail>(
      apiClient.post('/admin/cms/articles', createArticleFormData(payload)),
    ),

  updateArticle: (articleId: number, payload: ArticlePayload) =>
    unwrapResponse<ArticleDetail>(
      apiClient.put(`/admin/cms/articles/${articleId}`, createArticleFormData(payload)),
    ),

  publishArticle: (articleId: number) =>
    contentStatusAction<ArticleDetail>('articles', articleId, 'publish'),

  unpublishArticle: (articleId: number) =>
    contentStatusAction<ArticleDetail>('articles', articleId, 'unpublish'),

  archiveArticle: (articleId: number) =>
    contentStatusAction<ArticleDetail>('articles', articleId, 'archive'),

  restoreArticle: (articleId: number) =>
    contentStatusAction<ArticleDetail>('articles', articleId, 'restore'),

  deleteArticle: (articleId: number) =>
    unwrapResponse<void>(apiClient.delete(`/admin/cms/articles/${articleId}`)),
};

export function isPublished(status: ContentStatus): boolean {
  return status === 'PUBLISHED';
}
