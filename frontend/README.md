# Nova Gear Frontend

Frontend được tổ chức thành hai React/Vite application build độc lập: Storefront cho khách hàng và Admin Portal cho quản trị viên. Cả hai dùng chung source API client, types, format và cơ chế refresh token; không copy-paste service hoặc tạo auth backend riêng.

## Chức năng

- Trang chủ, banner CMS, danh mục, thương hiệu và danh sách sản phẩm có lọc, tìm kiếm, phân trang, sắp xếp.
- Chi tiết sản phẩm, chọn biến thể, thêm/cập nhật/xóa giỏ hàng.
- Đăng ký, đăng nhập JWT, tự làm mới access token và bảo vệ các trang cần đăng nhập.
- Checkout COD, lịch sử đơn hàng, chi tiết đơn và hủy đơn khi còn hợp lệ.
- Bài viết và trang tĩnh từ CMS.
- Storefront: trang chủ, catalog, sản phẩm, giỏ hàng, checkout, đơn hàng, bài viết và trang tĩnh.
- Admin Portal: dashboard, catalog/product/variant/image, đơn hàng và CMS gồm banner/trang tĩnh/bài viết.

## Công nghệ

- React 19 + TypeScript
- Vite 6
- React Router
- Axios
- TanStack Query
- Tailwind CSS 4 và CSS thuần cho storefront
- Lucide React

## Yêu cầu trước khi chạy

- Node.js 20+
- Backend Gaming Gear đang chạy tại `http://localhost:8080`
- PostgreSQL, Redis và MinIO được cấu hình theo backend nếu muốn sử dụng đầy đủ dữ liệu/ảnh.

## Chạy local

```bash
npm ci
npm run dev:storefront
```

Mở Storefront tại `http://localhost:5173`.

Mở terminal thứ hai:

```bash
npm run dev:admin
```

Mở Admin Portal tại `http://localhost:5174`.

Hai app là hai Vite entrypoint và build output riêng, không phải một SPA đổi route `/admin`. Storefront không có route hoặc menu quản trị. Admin Portal có trang login riêng, chỉ chấp nhận token có role `ADMIN`, sau đó gọi một admin API thật trước khi render dashboard. Việc kiểm tra này phục vụ UX; backend vẫn là security boundary cuối cùng.

Biến môi trường tùy chọn:

```bash
VITE_API_BASE_URL=/api/v1
VITE_STOREFRONT_URL=http://localhost:5173
```

Sao chép `.env.example` thành `.env.local` nếu cần thay đổi URL API. Giá trị `/api/v1` dùng Vite proxy local; có thể đặt `http://localhost:8080/api/v1` để gọi API cross-origin và kiểm tra CORS.

## Kiểm tra production build

```bash
npm run build:storefront
npm run build:admin
```

## Cấu trúc chính

```text
src/
├── api/          # Axios client và các hàm gọi API dùng chung
├── auth/         # Session JWT dùng chung cho Storefront
├── admin/        # Router/login/guard chỉ của Admin Portal
├── components/   # Layout, UI dùng lại, catalog, admin
├── pages/        # Các màn hình theo route
├── lib/          # Format tiền, ngày tháng, local storage
└── types/        # Kiểu TypeScript khớp response backend
```

## Tài khoản

Frontend không tự tạo tài khoản mẫu. Hãy sử dụng tài khoản đã seed từ backend hoặc đăng ký một tài khoản mới. Tài khoản `ADMIN` đăng nhập trực tiếp tại Admin Portal; Storefront không hiển thị menu quản trị và không truyền token sang origin admin.
