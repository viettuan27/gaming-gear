import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { cartApi, catalogApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { ProductVisual } from '../components/catalog/ProductVisual';
import { InlineError, PageLoader } from '../components/common/States';
import { formatCurrency } from '../lib/format';

export function ProductDetailPage() {
  const { productId } = useParams();
  const id = Number(productId);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const detailQuery = useQuery({ queryKey: ['product', id], queryFn: () => catalogApi.getProductById(id), enabled: Number.isFinite(id) });
  const product = detailQuery.data;
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const firstAvailable = product?.variants.find((variant) => variant.active && variant.stockQuantity > 0) ?? product?.variants.find((variant) => variant.active);
    setSelectedVariantId(firstAvailable?.id ?? null);
  }, [product?.id]);

  const selectedVariant = useMemo(() => product?.variants.find((variant) => variant.id === selectedVariantId), [product?.variants, selectedVariantId]);
  const selectedImage = product?.images[selectedImageIndex]?.imageUrl;
  const maxQuantity = Math.max(selectedVariant?.stockQuantity ?? 1, 1);
  const addToCart = useMutation({
    mutationFn: () => cartApi.addItem({ variantId: selectedVariantId!, quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  if (detailQuery.isLoading) return <PageLoader label="Đang tải chi tiết sản phẩm..." />;
  if (detailQuery.isError || !product) return <div className="container section-space"><InlineError message="Không thể tải chi tiết sản phẩm này." /></div>;

  function addProductToCart() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!selectedVariant || selectedVariant.stockQuantity <= 0) return;
    addToCart.mutate();
  }

  return (
    <div className="product-detail-page">
      <div className="container breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><Link to={`/products?categoryId=${product.categoryId}`}>{product.categoryName}</Link><span>/</span><span>{product.name}</span></div>
      <section className="container product-detail-layout">
        <div className="product-gallery">
          <div className="product-main-image"><ProductVisual name={product.name} imageUrl={selectedImage} /></div>
          {product.images.length > 1 && <div className="product-thumbnails">{product.images.map((image, index) => <button key={image.id} className={index === selectedImageIndex ? 'active' : ''} onClick={() => setSelectedImageIndex(index)}><ProductVisual name={`${product.name} ${index + 1}`} imageUrl={image.imageUrl} /></button>)}</div>}
        </div>
        <div className="product-info">
          <p className="product-brand-line">{product.brandName}</p>
          <h1>{product.name}</h1>
          <div className="product-meta-line"><span>Danh mục: <Link to={`/products?categoryId=${product.categoryId}`}>{product.categoryName}</Link></span><span className={selectedVariant?.stockQuantity ? 'in-stock' : 'out-stock'}>{selectedVariant?.stockQuantity ? <><Check size={16} /> Còn hàng</> : 'Tạm hết hàng'}</span></div>
          <div className="detail-price">{selectedVariant ? formatCurrency(selectedVariant.price) : 'Liên hệ'}</div>
          <p className="detail-description">{product.description || 'Thông tin mô tả cho sản phẩm sẽ được cập nhật bởi đội ngũ quản trị.'}</p>
          <div className="variant-selector"><span>Phiên bản</span><div>{product.variants.filter((variant) => variant.active).map((variant) => <button key={variant.id} className={selectedVariantId === variant.id ? 'active' : ''} onClick={() => { setSelectedVariantId(variant.id); setQuantity(1); }}>{variant.name || variant.sku}</button>)}</div></div>
          {selectedVariant && <p className="sku-note">SKU: {selectedVariant.sku} · {selectedVariant.stockQuantity > 0 ? `Còn ${selectedVariant.stockQuantity} sản phẩm` : 'Sản phẩm đang hết hàng'}</p>}
          <div className="buy-row">
            <div className="quantity-stepper"><button onClick={() => setQuantity((current) => Math.max(current - 1, 1))} aria-label="Giảm số lượng"><Minus size={17} /></button><span>{quantity}</span><button onClick={() => setQuantity((current) => Math.min(current + 1, maxQuantity))} disabled={!selectedVariant?.stockQuantity} aria-label="Tăng số lượng"><Plus size={17} /></button></div>
            <button className="button button-dark add-cart-detail" onClick={addProductToCart} disabled={!selectedVariant || selectedVariant.stockQuantity <= 0 || addToCart.isPending}><ShoppingCart size={19} />{addToCart.isPending ? 'Đang thêm vào giỏ' : 'Thêm vào giỏ'}</button>
          </div>
          <div className="product-assurances"><span><Truck size={19} /> Giao hàng theo chính sách cửa hàng</span><span><ShieldCheck size={19} /> Đặt hàng qua API bảo vệ tồn kho</span></div>
        </div>
      </section>
      <section className="container product-description-section"><h2>Thông tin sản phẩm</h2><p>{product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}</p></section>
      <div className="container"><Link className="back-to-catalog" to="/products"><ChevronLeft size={18} /> Quay lại danh sách sản phẩm</Link></div>
    </div>
  );
}
