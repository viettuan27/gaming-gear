import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, MapPin, PackageCheck, Phone, ReceiptText } from 'lucide-react';
import { getApiErrorMessage } from '../api/client';
import { orderApi } from '../api/services';
import { InlineError, PageLoader } from '../components/common/States';
import { formatCurrency, formatDateTime, getOrderStatusLabel } from '../lib/format';

export function OrderDetailPage() {
  const id = Number(useParams().orderId);
  const queryClient = useQueryClient();
  const orderQuery = useQuery({ queryKey: ['order', id], queryFn: () => orderApi.getOrderById(id), enabled: Number.isFinite(id) });
  const cancelMutation = useMutation({ mutationFn: () => orderApi.cancel(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['order', id] }); queryClient.invalidateQueries({ queryKey: ['my-orders'] }); } });
  const order = orderQuery.data;
  if (orderQuery.isLoading) return <PageLoader label="Đang tải đơn hàng..." />;
  if (orderQuery.isError || !order) return <div className="container section-space"><InlineError message="Không thể tải đơn hàng này." /></div>;
  return <div className="container order-detail-page section-space"><div className="breadcrumb"><Link to="/orders"><ArrowLeft size={15} /> Đơn hàng của tôi</Link><span>/</span><span>#{order.orderId}</span></div><div className="order-detail-head"><div><span className="eyebrow dark">ORDER #{order.orderId}</span><h1>{getOrderStatusLabel(order.status)}</h1><p>Đặt lúc {formatDateTime(order.createdAt)}</p></div><span className={`status-badge large status-${order.status.toLowerCase()}`}>{getOrderStatusLabel(order.status)}</span></div><div className="order-detail-layout"><section className="order-detail-card"><h2><ReceiptText size={20} /> Sản phẩm đặt mua</h2>{order.items.map((item) => <div className="order-detail-line" key={item.productVariantId}><div className="line-icon"><PackageCheck size={19} /></div><div><strong>{item.productName}</strong><p>{item.variantName || item.sku} · {formatCurrency(item.unitPrice)} × {item.quantity}</p></div><strong>{formatCurrency(item.lineTotal)}</strong></div>)}<div className="order-total-line"><span>Tổng thanh toán</span><strong>{formatCurrency(order.totalAmount)}</strong></div></section><aside className="order-side"><section className="order-detail-card"><h2><MapPin size={20} /> Thông tin nhận hàng</h2><p><strong>{order.recipientName}</strong></p><p><Phone size={15} /> {order.recipientPhone}</p><p>{order.shippingAddress}</p>{order.note && <p className="order-note">Ghi chú: {order.note}</p>}</section><section className="order-detail-card"><h2>Thanh toán</h2><p><CheckCircle2 size={16} /> Thanh toán khi nhận hàng (COD)</p></section>{order.status === 'PENDING' && <section className="order-cancel-panel"><AlertTriangle size={20} /><div><strong>Cần hủy đơn?</strong><p>Bạn có thể hủy khi đơn còn chờ xác nhận.</p></div><button className="button button-danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>{cancelMutation.isPending ? 'Đang hủy...' : 'Hủy đơn'}</button>{cancelMutation.isError && <p className="form-error">{getApiErrorMessage(cancelMutation.error)}</p>}</section>}</aside></div></div>;
}
