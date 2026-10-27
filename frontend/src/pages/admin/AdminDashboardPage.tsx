import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Boxes,
  FileText,
  Image,
  Package,
  ShoppingBag,
  Tags,
} from 'lucide-react';
import { adminApi, cmsApi } from '../../api/services';
import type {
  Banner,
  Brand,
  Category,
  OrderSummary,
  PageResponse,
} from '../../types/api';

type ResponseEnvelope<T> = { data: T };

function unwrapResponse<T>(response: T | ResponseEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ResponseEnvelope<T>).data;
  }

  return response as T;
}

function formatCurrency(value: number | string | undefined) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value: string | undefined) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusTone(status: string) {
  const tones: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-200',
    SHIPPING: 'bg-violet-50 text-violet-700 ring-violet-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-200',
  };

  return tones[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
}

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

export function AdminDashboardPage() {
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => unwrapResponse<Category[]>(await adminApi.getCategories()),
  });
  const brandsQuery = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: async () => unwrapResponse<Brand[]>(await adminApi.getBrands()),
  });
  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', 'dashboard'],
    queryFn: async () =>
      unwrapResponse<PageResponse<OrderSummary>>(
        await adminApi.getOrders({ page: 0, size: 5 }),
      ),
  });
  const bannersQuery = useQuery({
    queryKey: ['admin', 'cms', 'banners'],
    queryFn: async () => unwrapResponse<Banner[]>(await cmsApi.getBanners()),
  });

  const orderPage = ordersQuery.data;
  const recentOrders = orderPage?.content ?? [];
  const isLoading =
    categoriesQuery.isLoading || brandsQuery.isLoading || ordersQuery.isLoading || bannersQuery.isLoading;

  const statistics = [
    {
      label: 'Danh mục đang có',
      value: categoriesQuery.data?.length ?? 0,
      icon: Tags,
      iconClass: 'bg-blue-50 text-blue-600',
      to: '/catalog',
    },
    {
      label: 'Thương hiệu',
      value: brandsQuery.data?.length ?? 0,
      icon: Boxes,
      iconClass: 'bg-violet-50 text-violet-600',
      to: '/catalog',
    },
    {
      label: 'Tổng đơn hàng',
      value: orderPage?.totalElements ?? 0,
      icon: ShoppingBag,
      iconClass: 'bg-amber-50 text-amber-600',
      to: '/orders',
    },
    {
      label: 'Banner CMS',
      value: bannersQuery.data?.length ?? 0,
      icon: Image,
      iconClass: 'bg-emerald-50 text-emerald-600',
      to: '/cms',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0b5cff]">Nova Gear Admin Portal</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Tổng quan cửa hàng</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Theo dõi nhanh catalog, nội dung và các đơn hàng mới nhất.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b5cff] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(11,92,255,0.22)] transition hover:bg-blue-700"
          to="/catalog"
        >
          <Package className="h-4 w-4" />
          Thêm sản phẩm
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => {
          const Icon = statistic.icon;
          return (
            <Link
              key={statistic.label}
              className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              to={statistic.to}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${statistic.iconClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-[#0b5cff]" />
              </div>
              <p className="mt-6 text-2xl font-bold tabular-nums text-slate-900">
                {isLoading ? '—' : statistic.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{statistic.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.9fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-900">Đơn hàng gần đây</h2>
              <p className="mt-1 text-sm text-slate-400">Cập nhật trực tiếp từ hệ thống đặt hàng</p>
            </div>
            <Link className="text-sm font-bold text-[#0b5cff] hover:text-blue-700" to="/orders">
              Xem tất cả
            </Link>
          </div>

          {ordersQuery.isError ? (
            <p className="p-6 text-sm text-rose-600">Không thể tải danh sách đơn hàng. Hãy thử tải lại trang.</p>
          ) : recentOrders.length === 0 && !ordersQuery.isLoading ? (
            <div className="p-10 text-center">
              <ShoppingBag className="mx-auto h-9 w-9 text-slate-200" />
              <p className="mt-3 text-sm font-semibold text-slate-600">Chưa có đơn hàng nào</p>
              <p className="mt-1 text-sm text-slate-400">Đơn hàng mới sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold sm:px-6">Mã đơn</th>
                    <th className="px-5 py-3.5 font-semibold">Khách hàng</th>
                    <th className="px-5 py-3.5 font-semibold">Tổng tiền</th>
                    <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3.5 font-semibold">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ordersQuery.isLoading
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <tr key={index}>
                          <td className="px-5 py-4 sm:px-6" colSpan={5}>
                            <div className="h-4 animate-pulse rounded bg-slate-100" />
                          </td>
                        </tr>
                      ))
                    : recentOrders.map((order) => (
                        <tr key={order.orderId} className="transition hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800 sm:px-6">
                            #{order.orderId}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">{order.recipientName}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusTone(order.status)}`}
                            >
                              {statusLabels[order.status] ?? order.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">
                            {formatDate(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.035)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0b5cff]">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">Thao tác nhanh</h2>
              <p className="mt-0.5 text-sm text-slate-400">Công việc thường dùng</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {[
              { label: 'Tạo danh mục hoặc thương hiệu', to: '/catalog' },
              { label: 'Cập nhật sản phẩm', to: '/catalog' },
              { label: 'Xử lý đơn hàng mới', to: '/orders' },
              { label: 'Soạn banner hoặc bài viết', to: '/cms' },
            ].map((item) => (
              <Link
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-100 hover:bg-blue-50 hover:text-[#0b5cff]"
                to={item.to}
              >
                {item.label}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default AdminDashboardPage;
