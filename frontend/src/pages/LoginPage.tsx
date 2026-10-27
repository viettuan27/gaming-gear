import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const loginMutation = useMutation({
    mutationFn: () => login(form),
    onSuccess: () => {
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || '/', { replace: true });
    },
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate();
  }

  return (
    <div className="auth-page">
      <section className="auth-showcase"><div><Link className="brand-mark" to="/"><span className="brand-symbol"><Zap size={20} fill="currentColor" /></span>NOVA<span>GEAR</span></Link><span className="eyebrow">Welcome back</span><h1>Trở lại góc máy<br />của bạn.</h1><p>Đăng nhập để quản lý giỏ hàng, theo dõi đơn và tiếp tục khám phá những thiết bị phù hợp.</p></div><div className="auth-showcase-grid" /></section>
      <section className="auth-form-section"><div className="auth-form-wrap"><p className="eyebrow dark">TÀI KHOẢN</p><h2>Đăng nhập</h2><p className="auth-subtitle">Chào mừng bạn quay lại Nova Gear.</p><form onSubmit={submit} className="auth-form"><label>Email<div className="input-with-icon"><Mail size={18} /><input type="email" autoComplete="email" placeholder="email@example.com" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div></label><label>Mật khẩu<div className="input-with-icon"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Nhập mật khẩu" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Hiện hoặc ẩn mật khẩu">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{loginMutation.isError && <p className="form-error">{getApiErrorMessage(loginMutation.error)}</p>}<button className="button button-dark full-width" disabled={loginMutation.isPending}>{loginMutation.isPending ? 'Đang đăng nhập...' : <>Đăng nhập <ArrowRight size={18} /></>}</button></form><p className="auth-switch">Chưa có tài khoản? <Link to="/register">Tạo tài khoản mới</Link></p></div></section>
    </div>
  );
}
