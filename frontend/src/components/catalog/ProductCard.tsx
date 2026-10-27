import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, ShoppingCart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Product } from '../../types/api';
import { cartApi, catalogApi } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { formatCurrency } from '../../lib/format';
import { ProductVisual } from './ProductVisual';

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const detailQuery = useQuery({
    queryKey: ['product', product.id],
    queryFn: () => catalogApi.getProductById(product.id),
    staleTime: 5 * 60_000,
  });
  const detail = detailQuery.data;
  const firstImage = detail?.images?.[0]?.imageUrl;
  const firstVariant = detail?.variants?.find((variant) => variant.active && variant.stockQuantity > 0)
    ?? detail?.variants?.find((variant) => variant.active);
  const productIsAvailable = Boolean(firstVariant && firstVariant.stockQuantity > 0);

  const addToCart = useMutation({
    mutationFn: (variantId: number) => cartApi.addItem({ variantId, quantity: 1 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  function handleAddToCart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!firstVariant) {
      navigate(`/products/${product.id}`);
      return;
    }

    addToCart.mutate(firstVariant.id);
  }

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-media">
        <ProductVisual name={product.name} imageUrl={firstImage} />
        {productIsAvailable && <span className="product-status-chip"><Check size={13} /> Sẵn sàng</span>}
      </Link>
      <div className="product-card-body">
        <p className="product-card-brand">{product.brandName}</p>
        <Link to={`/products/${product.id}`} className="product-card-name">{product.name}</Link>
        <p className="product-card-description">{product.description || 'Thiết bị gaming chính hãng, phù hợp cho góc máy của bạn.'}</p>
        <div className="product-card-price">
          {detailQuery.isLoading ? (
            <span className="price-placeholder">Đang cập nhật giá...</span>
          ) : firstVariant ? (
            <><span className="price-label">Từ</span> {formatCurrency(firstVariant.price)}</>
          ) : (
            <span className="price-placeholder">Xem chi tiết</span>
          )}
        </div>
        <div className="product-card-actions">
          <Link to={`/products/${product.id}`} className="card-detail-button"><Eye size={16} /> Chi tiết</Link>
          <button
            className="card-cart-button"
            onClick={handleAddToCart}
            disabled={addToCart.isPending || !productIsAvailable}
            title={!productIsAvailable ? 'Sản phẩm đang hết hàng' : 'Thêm vào giỏ hàng'}
          >
            <ShoppingCart size={17} />
            <span>{addToCart.isPending ? 'Đang thêm' : 'Thêm'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
