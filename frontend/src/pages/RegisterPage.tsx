import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, LockKeyhole, Mail, Phone, UserRound, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const registerMutation = useMutation({ mutationFn: () => register(form), onSuccess: () => navigate('/') });

  return (
    <div className="auth-page">
      <section className="auth-showcase"><div><Link className="brand-mark" to="/"><span className="brand-symbol"><Zap size={20} fill="currentColor" /></span>NOVA<span>GEAR</span></Link><span className="eyebrow">JOIN THE SETUP</span><h1>Tạo tài khoản.<br /><em>Mở nhiều lựa chọn.</em></h1><p>Một tài khoản để giữ giỏ hàng, đặt hàng và theo dõi lịch sử mua sắm.</p></div><div className="auth-showcase-grid" /></section>
      <section className="auth-form-section"><div className="auth-form-wrap"><p className="eyebrow dark">TÀI KHOẢN MỚI</p><h2>Đăng ký</h2><p className="auth-subtitle">Điền thông tin thật để nhận hỗ trợ khi cần.</p><form onSubmit={(event) => { event.preventDefault(); registerMutation.mutate(); }} className="auth-form"><label>Họ và tên<div className="input-with-icon"><UserRound size={18} /><input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Nguyễn Văn A" /></div></label><label>Email<div className="input-with-icon"><Mail size={18} /><input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="email@example.com" /></div></label><label>Số điện thoại<div className="input-with-icon"><Phone size={18} /><input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="0901234567" /></div></label><label>Mật khẩu<div className="input-with-icon"><LockKeyhole size={18} /><input type="password" autoComplete="new-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Tối thiểu theo quy định backend" /></div></label>{registerMutation.isError && <p className="form-error">{getApiErrorMessage(registerMutation.error)}</p>}<button className="button button-dark full-width" disabled={registerMutation.isPending}>{registerMutation.isPending ? 'Đang tạo tài khoản...' : <>Tạo tài khoản <ArrowRight size={18} /></>}</button></form><p className="auth-switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></div></section>
    </div>
  );
}
