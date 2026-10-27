/**
 * Các kiểu dữ liệu trong file này phản ánh response/request từ Spring Boot API.
 * Giữ chúng tập trung ở một chỗ giúp component chỉ cần quan tâm đến giao diện.
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export type SortDirection = 'asc' | 'desc';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'COD';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type BannerPosition = 'HOME_HERO' | 'HOME_PROMOTION';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: number;
}

export interface AuthUser {
  email: string;
  roles: string[];
  isAdmin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
  phone: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

export interface CategoryPayload {
  name: string;
  description?: string | null;
  active: boolean;
}

export interface Brand {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  active: boolean;
}

export interface BrandPayload {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  active: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface ProductPayload {
  categoryId: number;
  brandId: number;
  name: string;
  description?: string | null;
  active: boolean;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  active: boolean;
}

export interface ProductVariantPayload {
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  active: boolean;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  sortOrder: number;
}

export interface ProductDetails {
  id: number;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  name: string;
  description: string | null;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface ProductFilters {
  categoryId?: number;
  brandId?: number;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface CartItem {
  cartItemId: number;
  productId: number;
  productName: string;
  variantId: number;
  variantName: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}

export interface AddCartItemPayload {
  variantId: number;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface OrderItem {
  productVariantId: number;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  orderId: number;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  note: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderSummary {
  orderId: number;
  recipientName: string;
  recipientPhone: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  createdAt: string;
}

export interface CreateOrderPayload {
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  note?: string | null;
}

export interface OrderListParams {
  page?: number;
  size?: number;
  sortDirection?: SortDirection;
}

export interface AdminOrderListParams extends OrderListParams {
  status?: OrderStatus;
}

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  redirectUrl: string | null;
  position: BannerPosition;
  sortOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BannerPayload {
  title: string;
  redirectUrl?: string | null;
  position: BannerPosition;
  sortOrder: number;
  file?: File | null;
}

export interface StaticPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StaticPagePayload {
  title: string;
  slug: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  status: ContentStatus;
  publishedAt: string | null;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlePayload {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  coverImage?: File | null;
}

export interface ArticleListParams {
  status?: ContentStatus;
  page?: number;
  size?: number;
  sortDirection?: SortDirection;
}

export interface ProductImagePayload {
  sortOrder: number;
  file?: File | null;
}
