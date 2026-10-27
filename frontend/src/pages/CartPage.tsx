import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/services';
import { EmptyState, InlineError, PageLoader } from '../components/common/States';
import { formatCurrency } from '../lib/format';

export function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: cartApi.getCart });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['cart'] });
  const updateMutation = useMutation({ mutationFn: ({ id, quantity }: { id: number; quantity: number }) => cartApi.updateItem(id, { quantity }), onSuccess: refresh });
  const removeMutation = useMutation({ mutationFn: cartApi.removeItem, onSuccess: refresh });
  const clearMutation = useMutation({ mutationFn: cartApi.clear, onSuccess: refresh });
  const cart = cartQuery.data;

  if (cartQuery.isLoading) return <PageLoader label="Đang tải giỏ hàng..." />;
  if (cartQuery.isError) return <div className="container section-space"><InlineError /></div>;
  if (!cart?.items.length) return <div className="container section-space cart-empty-wrap"><EmptyState title="Giỏ hàng đang trống" description="Hãy chọn một vài thiết bị để bắt đầu setup của bạn." /><Link className="button button-dark" to="/products">Khám phá sản phẩm <ArrowRight size={18} /></Link></div>;

  return (
    <div className="container cart-page section-space">
      <div className="breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><span>Giỏ hàng</span></div>
      <div className="cart-page-heading"><div><span className="eyebrow dark">YOUR SETUP</span><h1>Giỏ hàng</h1><p>{cart.totalQuantity} sản phẩm đang chờ bạn.</p></div><button className="text-button danger" disabled={clearMutation.isPending} onClick={() => clearMutation.mutate()}><Trash2 size={17} /> Xoá toàn bộ</button></div>
      <div className="cart-layout"><section className="cart-items">{cart.items.map((item) => <article className="cart-item" key={item.cartItemId}><div className="cart-item-visual"><ShoppingBag size={26} /></div><div className="cart-item-main"><Link to={`/products/${item.productId}`}>{item.productName}</Link><p>{item.variantName || item.sku}</p><span>{formatCurrency(item.price)}</span></div><div className="quantity-stepper"><button disabled={updateMutation.isPending || item.quantity <= 1} onClick={() => updateMutation.mutate({ id: item.cartItemId, quantity: item.quantity - 1 })}><Minus size={16} /></button><span>{item.quantity}</span><button disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: item.cartItemId, quantity: item.quantity + 1 })}><Plus size={16} /></button></div><strong className="cart-item-subtotal">{formatCurrency(item.subtotal)}</strong><button className="cart-remove" aria-label={`Xóa ${item.productName}`} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(item.cartItemId)}><Trash2 size={18} /></button></article>)}</section><aside className="cart-summary"><h2>Tóm tắt đơn hàng</h2><div><span>Tạm tính</span><strong>{formatCurrency(cart.totalPrice)}</strong></div><div><span>Vận chuyển</span><span>Liên hệ khi xác nhận</span></div><div className="cart-total"><span>Tổng cộng</span><strong>{formatCurrency(cart.totalPrice)}</strong></div><button className="button button-dark full-width" onClick={() => navigate('/checkout')}>Tiếp tục thanh toán <ArrowRight size={18} /></button><p><ShieldCheck size={16} /> Tồn kho sẽ được kiểm tra lại khi tạo đơn.</p></aside></div>
    </div>
  );
}
