import { type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { adminApi } from '../../api/services';
import type { OrderSummary, PageResponse } from '../../types/api';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
type ResponseEnvelope<T> = { data: T };

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Không thể cập nhật trạng thái đơn hàng.';
}

function statusClass(status: OrderStatus) {
  const styles: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-200',
    SHIPPING: 'bg-violet-50 text-violet-700 ring-violet-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-200',
  };
  return styles[status];
}

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | OrderStatus>('ALL');
  const [page, setPage] = useState(0);

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', { status: selectedStatus, page }],
    queryFn: async () =>
      unwrapResponse<PageResponse<OrderSummary>>(
        await adminApi.getOrders({
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
          page,
          size: 12,
          sortDirection: 'desc',
        }),
      ),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) =>
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });

  const orderPage = ordersQuery.data;
  const orders = orderPage?.content ?? [];
  const totalPages = Math.max(orderPage?.totalPages ?? 1, 1);
  const pendingOnPage = orders.filter((order) => order.status === 'PENDING').length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0b5cff]">Vận hành</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Đơn hàng</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Cập nhật trạng thái theo đúng luồng: xác nhận, giao hàng, hoàn tất hoặc hủy đơn.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b5cff]"
          type="button"
          onClick={() => ordersQuery.refetch()}
        >
          <RefreshCw className={`h-4 w-4 ${ordersQuery.isFetching ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Tổng đơn theo bộ lọc" value={orderPage?.totalElements ?? 0} icon={<ShoppingBag className="h-5 w-5" />} />
        <SummaryCard label="Đơn chờ trên trang này" value={pendingOnPage} icon={<CircleAlert className="h-5 w-5" />} tone="amber" />
        <SummaryCard label="Đang hiển thị" value={orders.length} icon={<PackageCheck className="h-5 w-5" />} tone="emerald" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Danh sách đơn hàng</h2>
            <p className="mt-1 text-sm text-slate-400">Chỉ các bước trạng thái hợp lệ mới hiển thị để thao tác.</p>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <span>Trạng thái</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              value={selectedStatus}
              onChange={(event) => {
                setSelectedStatus(event.target.value as 'ALL' | OrderStatus);
                setPage(0);
              }}
            >
              <option value="ALL">Tất cả</option>
              {(Object.keys(statusLabels) as OrderStatus[]).map((status) => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
          </label>
        </div>

        {ordersQuery.isError ? (
          <div className="p-10 text-center">
            <CircleAlert className="mx-auto h-9 w-9 text-rose-400" />
            <p className="mt-3 text-sm font-semibold text-rose-600">Không thể tải đơn hàng.</p>
            <p className="mt-1 text-sm text-slate-400">Hãy kiểm tra quyền quản trị và kết nối backend.</p>
          </div>
        ) : !ordersQuery.isLoading && orders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-200" />
            <p className="mt-4 text-sm font-semibold text-slate-600">Chưa có đơn hàng phù hợp</p>
            <p className="mt-1 text-sm text-slate-400">Hãy đổi bộ lọc hoặc chờ khách hàng tạo đơn mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Mã đơn</th>
                  <th className="px-5 py-3.5 font-semibold">Khách nhận</th>
                  <th className="px-5 py-3.5 font-semibold">Thanh toán</th>
                  <th className="px-5 py-3.5 font-semibold">Tổng tiền</th>
                  <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3.5 font-semibold">Tạo lúc</th>
                  <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordersQuery.isLoading
                  ? <LoadingRows />
                  : orders.map((order) => {
                      const status = order.status as OrderStatus;
                      const actions = nextStatuses[status] ?? [];
                      const isSaving = updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.orderId;

                      return (
                        <tr key={order.orderId} className="align-top transition hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800 sm:px-6">#{order.orderId}</td>
                          <td className="px-5 py-4">
                            <p className="whitespace-nowrap font-semibold text-slate-700">{order.recipientName}</p>
                            <p className="mt-1 whitespace-nowrap text-xs text-slate-400">{order.recipientPhone}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">{order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod}</td>
                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">{formatCurrency(order.totalAmount)}</td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusClass(status)}`}>
                              {statusLabels[status] ?? status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">{formatDate(order.createdAt)}</td>
                          <td className="px-5 py-4 text-right sm:px-6">
                            {actions.length === 0 ? (
                              <span className="text-xs font-semibold text-slate-400">Đã hoàn tất</span>
                            ) : (
                              <div className="flex min-w-44 flex-col items-end gap-2">
                                {actions.map((nextStatus) => (
                                  <button
                                    key={nextStatus}
                                    className={[
                                      'inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
                                      nextStatus === 'CANCELLED'
                                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                        : 'bg-blue-50 text-[#0b5cff] hover:bg-blue-100',
                                    ].join(' ')}
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => updateStatusMutation.mutate({ orderId: order.orderId, status: nextStatus })}
                                  >
                                    {isSaving && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                                    {nextStatus === 'CANCELLED' ? 'Hủy đơn' : `Chuyển: ${statusLabels[nextStatus]}`}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}

        {updateStatusMutation.error && (
          <p className="mx-5 mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 sm:mx-6">
            {getErrorMessage(updateStatusMutation.error)}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-slate-400">Trang {page + 1} trên {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              aria-label="Trang trước"
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b5cff] disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Trang sau"
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b5cff] disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: 'blue' | 'amber' | 'emerald';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.035)]">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <p className="mt-5 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-4 sm:px-6" colSpan={7}>
            <div className="h-5 animate-pulse rounded bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default AdminOrdersPage;
