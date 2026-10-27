import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, MapPin, PackageCheck, Phone, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { cartApi, orderApi } from '../api/services';
import { PageLoader } from '../components/common/States';
import { formatCurrency } from '../lib/format';

export function CheckoutPage() {
  const navigate = useNavigate();
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: cartApi.getCart });
  const [form, setForm] = useState({ recipientName: '', recipientPhone: '', shippingAddress: '', note: '' });
  const orderMutation = useMutation({ mutationFn: () => orderApi.create(form), onSuccess: (order) => navigate(`/orders/${order.orderId}`) });
  const cart = cartQuery.data;

  if (cartQuery.isLoading) return <PageLoader label="Đang chuẩn bị đơn hàng..." />;
  if (!cart?.items.length) return <div className="container section-space"><div className="checkout-empty"><PackageCheck size={36} /><h1>Giỏ hàng chưa có sản phẩm</h1><Link className="button button-dark" to="/products">Quay lại mua sắm</Link></div></div>;

  return <div className="container checkout-page section-space"><div className="breadcrumb"><Link to="/cart"><ArrowLeft size={15} /> Giỏ hàng</Link><span>/</span><span>Thanh toán</span></div><div className="checkout-heading"><span className="eyebrow dark">CHECKOUT</span><h1>Thông tin nhận hàng</h1><p>Đơn hàng hiện hỗ trợ thanh toán khi nhận hàng (COD).</p></div><div className="checkout-layout"><form className="checkout-form" onSubmit={(event) => { event.preventDefault(); orderMutation.mutate(); }}><h2>Người nhận</h2><label>Họ và tên<div className="input-with-icon"><UserRound size={18} /><input required value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} placeholder="Nguyễn Văn A" /></div></label><label>Số điện thoại<div className="input-with-icon"><Phone size={18} /><input required value={form.recipientPhone} onChange={(event) => setForm({ ...form, recipientPhone: event.target.value })} placeholder="0901234567" /></div></label><label>Địa chỉ nhận hàng<div className="input-with-icon textarea-icon"><MapPin size={18} /><textarea required rows={3} value={form.shippingAddress} onChange={(event) => setForm({ ...form, shippingAddress: event.target.value })} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" /></div></label><label>Ghi chú <span className="optional">(không bắt buộc)</span><textarea rows={3} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Ví dụ: gọi trước khi giao hàng" /></label>{orderMutation.isError && <p className="form-error">{getApiErrorMessage(orderMutation.error)}</p>}<button className="button button-dark full-width" disabled={orderMutation.isPending}>{orderMutation.isPending ? 'Đang tạo đơn hàng...' : <><CheckCircle2 size={18} /> Xác nhận đặt hàng</>}</button></form><aside className="checkout-summary"><h2>Đơn hàng của bạn</h2>{cart.items.map((item) => <div className="checkout-line" key={item.cartItemId}><span>{item.productName} <small>× {item.quantity}</small></span><strong>{formatCurrency(item.subtotal)}</strong></div>)}<div className="cart-total"><span>Tổng thanh toán</span><strong>{formatCurrency(cart.totalPrice)}</strong></div><p><PackageCheck size={17} /> Hệ thống sẽ kiểm tra tồn kho và tạo đơn trong một giao dịch an toàn.</p></aside></div></div>;
}
