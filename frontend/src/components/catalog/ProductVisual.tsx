import { Headphones, Keyboard, Monitor, Mouse, PackageOpen, Radio } from 'lucide-react';

type ProductVisualProps = {
  name: string;
  imageUrl?: string | null;
  className?: string;
};

function FallbackIcon({ name }: { name: string }) {
  const loweredName = name.toLocaleLowerCase('vi-VN');

  if (loweredName.includes('chuột') || loweredName.includes('mouse')) return <Mouse />;
  if (loweredName.includes('bàn phím') || loweredName.includes('keyboard')) return <Keyboard />;
  if (loweredName.includes('tai nghe') || loweredName.includes('headphone')) return <Headphones />;
  if (loweredName.includes('màn hình') || loweredName.includes('monitor')) return <Monitor />;
  if (loweredName.includes('loa') || loweredName.includes('mic')) return <Radio />;
  return <PackageOpen />;
}

// Nếu database chưa có ảnh MinIO, card vẫn giữ được bố cục đẹp bằng icon theo loại sản phẩm.
export function ProductVisual({ name, imageUrl, className = '' }: ProductVisualProps) {
  if (imageUrl) {
    return <img className={`product-visual-image ${className}`} src={imageUrl} alt={name} loading="lazy" />;
  }

  return (
    <div className={`product-visual-fallback ${className}`} aria-label={`Minh hoạ ${name}`}>
      <span>{name.charAt(0).toUpperCase()}</span>
      <FallbackIcon name={name} />
    </div>
  );
}
