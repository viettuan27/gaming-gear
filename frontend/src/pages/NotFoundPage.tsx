import { ArrowLeft, Satellite } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="not-found-page"><Satellite size={54} /><p className="eyebrow dark">404</p><h1>Không tìm thấy trang này</h1><p>Đường dẫn có thể không còn tồn tại hoặc đã thay đổi.</p><Link className="button button-dark" to="/"><ArrowLeft size={18} /> Về trang chủ</Link></main>;
}
