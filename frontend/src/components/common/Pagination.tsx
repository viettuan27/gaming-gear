import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    if (totalPages <= 5) return index;
    if (page < 3) return index;
    if (page > totalPages - 4) return totalPages - 5 + index;
    return page - 2 + index;
  });

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button onClick={() => onChange(page - 1)} disabled={page <= 0} aria-label="Trang trước"><ChevronLeft size={18} /></button>
      {pages.map((item) => (
        <button key={item} onClick={() => onChange(item)} className={item === page ? 'active' : ''}>{item + 1}</button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1} aria-label="Trang sau"><ChevronRight size={18} /></button>
    </nav>
  );
}
