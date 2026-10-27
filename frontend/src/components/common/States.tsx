import { AlertCircle, Box, LoaderCircle } from 'lucide-react';

export function PageLoader({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
  return <div className="page-state"><LoaderCircle className="spin" size={28} /><p>{label}</p></div>;
}

export function InlineError({ message = 'Không thể tải dữ liệu. Vui lòng thử lại.' }: { message?: string }) {
  return <div className="inline-error"><AlertCircle size={19} /><span>{message}</span></div>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="empty-state"><Box size={34} /><h3>{title}</h3>{description && <p>{description}</p>}</div>;
}
