import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { getApiErrorMessage } from '../api/client';
import { useAdminAuth } from './auth/AdminAuthContext';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, login } = useAdminAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const loginMutation = useMutation({
    mutationFn: () => login(form),
    onSuccess: () => navigate('/', { replace: true }),
  });

  if (isAdmin) {
    return <Navigate to="/" replace />;
  }

  const sessionMessage = (location.state as { message?: string } | null)?.message;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate();
  }

  return (
    <main className="grid min-h-screen bg-slate-950 p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="inline-flex items-center gap-3 text-sm font-black tracking-[0.16em]">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-blue-600">N</span>
          NOVA GEAR
        </div>
        <div className="max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold">
            <ShieldCheck className="h-4 w-4" /> ADMIN PORTAL
          </span>
          <h1 className="mt-6 text-5xl font-black leading-tight">Vận hành cửa hàng, an toàn và tập trung.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-blue-100">
            Quản lý catalog, đơn hàng và nội dung CMS từ một khu vực chỉ dành cho quản trị viên.
          </p>
        </div>
        <p className="text-sm text-blue-100">Không sử dụng URL hay redirect để truyền token giữa hai ứng dụng.</p>
      </section>

      <section className="flex items-center justify-center bg-white p-6 sm:p-10 lg:rounded-r-3xl">
        <div className="w-full max-w-md">
          <div className="mb-9">
            <div className="mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <KeyRound className="h-6 w-6" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Nova Gear Admin</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Đăng nhập quản trị</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Chỉ tài khoản có vai trò ADMIN mới có thể truy cập trang quản trị.</p>
          </div>

          <form className="space-y-5" onSubmit={submit}>
            <label className="block text-sm font-bold text-slate-700">
              Email
              <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent outline-none"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  required
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </span>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Mật khẩu
              <span className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                <LockKeyhole className="h-4 w-4 text-slate-400" />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent outline-none"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  required
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
              </span>
            </label>

            {loginMutation.isError && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {getApiErrorMessage(loginMutation.error)}
              </p>
            )}

            {!loginMutation.isError && sessionMessage && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {sessionMessage}
              </p>
            )}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Đang xác thực...' : 'Vào Admin Portal'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
