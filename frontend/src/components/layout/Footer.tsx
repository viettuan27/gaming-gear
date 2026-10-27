import { Link } from 'react-router-dom';
import { Headphones, Mail, MapPin, Phone, ShieldCheck, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '../../api/services';

export function Footer() {
  const { data: pages = [] } = useQuery({
    queryKey: ['published-pages'],
    queryFn: cmsApi.getPublishedPages,
  });

  return (
    <footer className="site-footer">
      <div className="container footer-service-row">
        <div><Truck size={22} /><span><strong>Giao hàng linh hoạt</strong>Phục vụ đơn hàng toàn quốc</span></div>
        <div><ShieldCheck size={22} /><span><strong>Sản phẩm đáng tin cậy</strong>Thông tin rõ ràng, hỗ trợ minh bạch</span></div>
        <div><Headphones size={22} /><span><strong>Hỗ trợ khi cần</strong>Chăm sóc khách hàng qua mọi chặng</span></div>
      </div>
      <div className="footer-main">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link className="brand-mark" to="/"><span className="brand-symbol"><span>⚡</span></span>NOVA<span>GEAR</span></Link>
            <p>Không gian để bạn tìm bộ gear phù hợp với cách mình chơi, làm việc và sáng tạo.</p>
          </div>
          <div>
            <h3>Khám phá</h3>
            <Link to="/products">Tất cả sản phẩm</Link>
            <Link to="/articles">Góc công nghệ</Link>
            <Link to="/cart">Giỏ hàng</Link>
          </div>
          <div>
            <h3>Chính sách</h3>
            {pages.length > 0 ? pages.map((page) => (
              <Link key={page.id} to={`/pages/${page.slug}`}>{page.title}</Link>
            )) : <span>Đang cập nhật nội dung</span>}
          </div>
          <div>
            <h3>Liên hệ</h3>
            <p><Phone size={15} /> 1900 0000</p>
            <p><Mail size={15} /> hello@novagear.local</p>
            <p><MapPin size={15} /> Hồ Chí Minh, Việt Nam</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom"><div className="container">© 2026 Nova Gear. Demo frontend kết nối Gaming Gear API.</div></div>
    </footer>
  );
}
