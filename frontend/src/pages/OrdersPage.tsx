import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ClipboardList, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/services';
import { Pagination } from '../components/common/Pagination';
import { EmptyState, InlineError, PageLoader } from '../components/common/States';
import { formatCurrency, formatDateTime, getOrderStatusLabel } from '../lib/format';

export function OrdersPage() {
  const [page, setPage] = useState(0);
  const ordersQuery = useQuery({ queryKey: ['my-orders', page], queryFn: () => orderApi.getMyOrders({ page, size: 10, sortDirection: 'desc' }) });

  if (ordersQuery.isLoading) return <PageLoader label="Đang tải đơn hàng..." />;
  if (ordersQuery.isError) return <div className="container section-space"><InlineError /></div>;
  const orders = ordersQuery.data;
  return <div className="container orders-page section-space"><div className="breadcrumb"><Link to="/">Trang chủ</Link><span>/</span><span>Đơn hàng</span></div><div className="page-heading"><div><span className="eyebrow dark">YOUR ORDERS</span><h1>Đơn hàng của tôi</h1><p>Theo dõi trạng thái từng đơn đặt hàng của bạn.</p></div><Link className="button button-outline" to="/products"><PackageOpen size={18} /> Mua sắm tiếp</Link></div>{orders?.content.length ? <><div className="order-list">{orders.content.map((order) => <article className="order-row" key={order.orderId}><div className="order-icon"><ClipboardList size={22} /></div><div className="order-row-main"><strong>Đơn hàng #{order.orderId}</strong><span>{formatDateTime(order.createdAt)} · {order.recipientName}</span></div><span className={`status-badge status-${order.status.toLowerCase()}`}>{getOrderStatusLabel(order.status)}</span><strong className="order-price">{formatCurrency(order.totalAmount)}</strong><Link className="row-link" to={`/orders/${order.orderId}`}>Xem <ArrowRight size={16} /></Link></article>)}</div><Pagination page={orders.page} totalPages={orders.totalPages} onChange={setPage} /></> : <div className="orders-empty"><EmptyState title="Bạn chưa có đơn hàng nào" description="Khi hoàn tất thanh toán, đơn hàng sẽ xuất hiện ở đây." /><Link className="button button-dark" to="/products">Khám phá sản phẩm</Link></div>}</div>;
}
