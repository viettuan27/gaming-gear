import { type FormEvent, type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FolderTree,
  ImagePlus,
  Layers3,
  LoaderCircle,
  PackagePlus,
  Plus,
  Search,
  Settings2,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { adminApi, catalogApi } from '../../api/services';
import type {
  Brand,
  Category,
  PageResponse,
  Product,
  ProductDetails,
  ProductImagePayload,
  ProductVariantPayload,
} from '../../types/api';

type CatalogTab = 'categories' | 'brands' | 'products';
type ResponseEnvelope<T> = { data: T };

type CategoryPayload = {
  name: string;
  description: string;
  active: boolean;
};

type BrandPayload = CategoryPayload & {
  logoUrl: string;
};

type ProductPayload = {
  categoryId: number;
  brandId: number;
  name: string;
  description: string;
  active: boolean;
};

type ProductManagementTab = 'variants' | 'images';

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50';

function unwrapResponse<T>(response: T | ResponseEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ResponseEnvelope<T>).data;
  }

  return response as T;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Không thể lưu thay đổi. Hãy thử lại.';
}

function AdminModal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-4 py-6 sm:grid sm:place-items-center">
      <section
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className="mx-auto w-full max-w-2xl rounded-2xl bg-white shadow-[0_25px_80px_rgba(15,23,42,0.25)]"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 id="admin-modal-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <button
            aria-label="Đóng biểu mẫu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            type="button"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        active
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-slate-100 text-slate-500 ring-slate-200',
      ].join(' ')}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Đang hoạt động' : 'Đang ẩn'}
    </span>
  );
}

function EmptyTable({ message }: { message: string }) {
  return (
    <div className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <FolderTree className="mx-auto h-10 w-10 text-slate-200" />
        <p className="mt-4 text-sm font-semibold text-slate-600">{message}</p>
        <p className="mt-1 text-sm text-slate-400">Bạn có thể thêm mục mới bằng nút ở phía trên.</p>
      </div>
    </div>
  );
}

export function AdminCatalogPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<CatalogTab>('categories');
  const [keyword, setKeyword] = useState('');
  const [productPage, setProductPage] = useState(0);
  const [categoryForm, setCategoryForm] = useState<CategoryPayload | null>(null);
  const [categoryEditingId, setCategoryEditingId] = useState<number | null>(null);
  const [brandForm, setBrandForm] = useState<BrandPayload | null>(null);
  const [brandEditingId, setBrandEditingId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductPayload | null>(null);
  const [productEditingId, setProductEditingId] = useState<number | null>(null);
  const [managedProductId, setManagedProductId] = useState<number | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => unwrapResponse<Category[]>(await adminApi.getCategories()),
  });
  const brandsQuery = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: async () => unwrapResponse<Brand[]>(await adminApi.getBrands()),
  });
  const productsQuery = useQuery({
    queryKey: ['admin', 'products', { keyword, page: productPage }],
    queryFn: async () =>
      unwrapResponse<PageResponse<Product>>(
        await adminApi.getProducts({
          keyword: keyword.trim() || undefined,
          page: productPage,
          size: 10,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        }),
      ),
  });

  const saveCategoryMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number | null; payload: CategoryPayload }) => {
      if (id) return adminApi.updateCategory(id, payload);
      return adminApi.createCategory(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setCategoryForm(null);
      setCategoryEditingId(null);
    },
  });
  const saveBrandMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number | null; payload: BrandPayload }) => {
      if (id) return adminApi.updateBrand(id, payload);
      return adminApi.createBrand(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
      setBrandForm(null);
      setBrandEditingId(null);
    },
  });
  const saveProductMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number | null; payload: ProductPayload }) => {
      if (id) return adminApi.updateProduct(id, payload);
      return adminApi.createProduct(payload);
    },
    onSuccess: async (savedProduct) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      const shouldOpenManagement = productEditingId === null;
      setProductForm(null);
      setProductEditingId(null);
      if (shouldOpenManagement) setManagedProductId(savedProduct.id);
    },
  });

  const products = productsQuery.data?.content ?? [];
  const totalProductPages = Math.max(productsQuery.data?.totalPages ?? 1, 1);

  const openCreate = () => {
    if (tab === 'categories') {
      setCategoryEditingId(null);
      setCategoryForm({ name: '', description: '', active: true });
      return;
    }
    if (tab === 'brands') {
      setBrandEditingId(null);
      setBrandForm({ name: '', description: '', logoUrl: '', active: true });
      return;
    }

    const firstCategory = categoriesQuery.data?.[0];
    const firstBrand = brandsQuery.data?.[0];
    setProductEditingId(null);
    setProductForm({
      categoryId: firstCategory?.id ?? 0,
      brandId: firstBrand?.id ?? 0,
      name: '',
      description: '',
      active: true,
    });
  };

  const tabItems: Array<{ id: CatalogTab; label: string; icon: typeof Tag }> = [
    { id: 'categories', label: 'Danh mục', icon: Tag },
    { id: 'brands', label: 'Thương hiệu', icon: Boxes },
    { id: 'products', label: 'Sản phẩm', icon: PackagePlus },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0b5cff]">Catalog</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Danh mục sản phẩm</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Duy trì dữ liệu hiển thị trên cửa hàng: danh mục, thương hiệu và sản phẩm.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b5cff] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(11,92,255,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          type="button"
          disabled={tab === 'products' && (!categoriesQuery.data?.length || !brandsQuery.data?.length)}
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />
          {tab === 'categories' ? 'Thêm danh mục' : tab === 'brands' ? 'Thêm thương hiệu' : 'Thêm sản phẩm'}
        </button>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full overflow-x-auto rounded-xl bg-slate-50 p-1 lg:w-auto">
            {tabItems.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  className={[
                    'inline-flex min-w-max items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-bold transition sm:px-4',
                    isActive ? 'bg-white text-[#0b5cff] shadow-sm' : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setKeyword('');
                    setProductPage(0);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {tab === 'products' && (
            <label className="relative block w-full lg:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                placeholder="Tìm theo tên sản phẩm"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setProductPage(0);
                }}
              />
            </label>
          )}
        </div>

        {tab === 'categories' && (
          <CategoryTable
            categories={categoriesQuery.data ?? []}
            isLoading={categoriesQuery.isLoading}
            isError={categoriesQuery.isError}
            onEdit={(category) => {
              setCategoryEditingId(category.id);
              setCategoryForm({
                name: category.name,
                description: category.description ?? '',
                active: category.active,
              });
            }}
          />
        )}
        {tab === 'brands' && (
          <BrandTable
            brands={brandsQuery.data ?? []}
            isLoading={brandsQuery.isLoading}
            isError={brandsQuery.isError}
            onEdit={(brand) => {
              setBrandEditingId(brand.id);
              setBrandForm({
                name: brand.name,
                description: brand.description ?? '',
                logoUrl: brand.logoUrl ?? '',
                active: brand.active,
              });
            }}
          />
        )}
        {tab === 'products' && (
          <ProductTable
            products={products}
            isLoading={productsQuery.isLoading}
            isError={productsQuery.isError}
            page={productPage}
            totalPages={totalProductPages}
            totalProducts={productsQuery.data?.totalElements ?? 0}
            onPreviousPage={() => setProductPage((current) => Math.max(current - 1, 0))}
            onNextPage={() => setProductPage((current) => Math.min(current + 1, totalProductPages - 1))}
            onEdit={(product) => {
              setProductEditingId(product.id);
              setProductForm({
                categoryId: product.categoryId,
                brandId: product.brandId,
                name: product.name,
                description: product.description ?? '',
                active: product.active,
              });
            }}
            onManage={(product) => setManagedProductId(product.id)}
          />
        )}
      </section>

      {categoryForm && (
        <AdminModal
          title={categoryEditingId ? 'Cập nhật danh mục' : 'Thêm danh mục'}
          description="Tên danh mục hiển thị ở bộ lọc và trang quản lý sản phẩm."
          onClose={() => setCategoryForm(null)}
        >
          <form
            className="space-y-5 p-5 sm:p-6"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              saveCategoryMutation.mutate({ id: categoryEditingId, payload: categoryForm });
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên danh mục</span>
              <input
                required
                maxLength={150}
                className={inputClassName}
                placeholder="Ví dụ: Chuột gaming"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả</span>
              <textarea
                rows={4}
                maxLength={1000}
                className={inputClassName}
                placeholder="Mô tả ngắn giúp đội ngũ dễ nhận biết danh mục."
                value={categoryForm.description}
                onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
              />
            </label>
            <Toggle
              checked={categoryForm.active}
              label="Hiển thị danh mục trên cửa hàng"
              onChange={(active) => setCategoryForm({ ...categoryForm, active })}
            />
            <MutationError error={saveCategoryMutation.error} />
            <FormActions
              isPending={saveCategoryMutation.isPending}
              label={categoryEditingId ? 'Lưu thay đổi' : 'Tạo danh mục'}
              onCancel={() => setCategoryForm(null)}
            />
          </form>
        </AdminModal>
      )}

      {brandForm && (
        <AdminModal
          title={brandEditingId ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu'}
          description="Logo là một URL tùy chọn; có thể bỏ trống khi thương hiệu chưa có logo."
          onClose={() => setBrandForm(null)}
        >
          <form
            className="space-y-5 p-5 sm:p-6"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              saveBrandMutation.mutate({ id: brandEditingId, payload: brandForm });
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên thương hiệu</span>
              <input
                required
                maxLength={150}
                className={inputClassName}
                placeholder="Ví dụ: Logitech"
                value={brandForm.name}
                onChange={(event) => setBrandForm({ ...brandForm, name: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Đường dẫn logo</span>
              <input
                maxLength={500}
                type="url"
                className={inputClassName}
                placeholder="https://..."
                value={brandForm.logoUrl}
                onChange={(event) => setBrandForm({ ...brandForm, logoUrl: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả</span>
              <textarea
                rows={4}
                maxLength={1000}
                className={inputClassName}
                placeholder="Ghi chú ngắn về thương hiệu."
                value={brandForm.description}
                onChange={(event) => setBrandForm({ ...brandForm, description: event.target.value })}
              />
            </label>
            <Toggle
              checked={brandForm.active}
              label="Hiển thị thương hiệu trên cửa hàng"
              onChange={(active) => setBrandForm({ ...brandForm, active })}
            />
            <MutationError error={saveBrandMutation.error} />
            <FormActions
              isPending={saveBrandMutation.isPending}
              label={brandEditingId ? 'Lưu thay đổi' : 'Tạo thương hiệu'}
              onCancel={() => setBrandForm(null)}
            />
          </form>
        </AdminModal>
      )}

      {productForm && (
        <AdminModal
          title={productEditingId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
          description="Sau khi lưu, bạn có thể quản lý phiên bản, giá, tồn kho và ảnh ngay tại đây."
          onClose={() => setProductForm(null)}
        >
          <form
            className="space-y-5 p-5 sm:p-6"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              if (!productForm.categoryId || !productForm.brandId) return;
              saveProductMutation.mutate({ id: productEditingId, payload: productForm });
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Danh mục</span>
                <select
                  required
                  className={inputClassName}
                  value={productForm.categoryId || ''}
                  onChange={(event) => setProductForm({ ...productForm, categoryId: Number(event.target.value) })}
                >
                  <option value="">Chọn danh mục</option>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Thương hiệu</span>
                <select
                  required
                  className={inputClassName}
                  value={productForm.brandId || ''}
                  onChange={(event) => setProductForm({ ...productForm, brandId: Number(event.target.value) })}
                >
                  <option value="">Chọn thương hiệu</option>
                  {(brandsQuery.data ?? []).map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên sản phẩm</span>
              <input
                required
                maxLength={150}
                className={inputClassName}
                placeholder="Ví dụ: Logitech G Pro X Superlight 2"
                value={productForm.name}
                onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Mô tả</span>
              <textarea
                rows={5}
                className={inputClassName}
                placeholder="Mô tả hiển thị tại trang chi tiết sản phẩm."
                value={productForm.description}
                onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
              />
            </label>
            <Toggle
              checked={productForm.active}
              label="Cho phép sản phẩm hiển thị ở cửa hàng"
              onChange={(active) => setProductForm({ ...productForm, active })}
            />
            <MutationError error={saveProductMutation.error} />
            <FormActions
              isPending={saveProductMutation.isPending}
              label={productEditingId ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
              onCancel={() => setProductForm(null)}
            />
          </form>
        </AdminModal>
      )}

      {managedProductId && (
        <ProductManagerModal
          productId={managedProductId}
          onClose={() => setManagedProductId(null)}
        />
      )}
    </section>
  );
}

function CategoryTable({
  categories,
  isLoading,
  isError,
  onEdit,
}: {
  categories: Category[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (category: Category) => void;
}) {
  if (isError) return <ErrorTable />;
  if (!isLoading && categories.length === 0) return <EmptyTable message="Chưa có danh mục nào" />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-3.5 font-semibold sm:px-6">ID</th>
            <th className="px-5 py-3.5 font-semibold">Tên danh mục</th>
            <th className="px-5 py-3.5 font-semibold">Mô tả</th>
            <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
            <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading
            ? <LoadingRows columns={5} />
            : categories.map((category) => (
                <tr key={category.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-slate-500 sm:px-6">#{category.id}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">{category.name}</td>
                  <td className="max-w-sm px-5 py-4 text-slate-500">
                    <span className="line-clamp-2">{category.description || '—'}</span>
                  </td>
                  <td className="px-5 py-4"><ActiveBadge active={category.active} /></td>
                  <td className="px-5 py-4 text-right sm:px-6">
                    <EditButton label={`Sửa ${category.name}`} onClick={() => onEdit(category)} />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

function BrandTable({
  brands,
  isLoading,
  isError,
  onEdit,
}: {
  brands: Brand[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (brand: Brand) => void;
}) {
  if (isError) return <ErrorTable />;
  if (!isLoading && brands.length === 0) return <EmptyTable message="Chưa có thương hiệu nào" />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-5 py-3.5 font-semibold sm:px-6">ID</th>
            <th className="px-5 py-3.5 font-semibold">Thương hiệu</th>
            <th className="px-5 py-3.5 font-semibold">Logo</th>
            <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
            <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading
            ? <LoadingRows columns={5} />
            : brands.map((brand) => (
                <tr key={brand.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-slate-500 sm:px-6">#{brand.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">{brand.name}</p>
                    <p className="mt-1 max-w-sm truncate text-xs text-slate-400">{brand.description || 'Chưa có mô tả'}</p>
                  </td>
                  <td className="px-5 py-4">
                    {brand.logoUrl ? (
                      <img className="h-9 w-14 rounded-lg border border-slate-100 object-contain p-1" src={brand.logoUrl} alt={`Logo ${brand.name}`} />
                    ) : (
                      <span className="text-xs text-slate-400">Chưa có logo</span>
                    )}
                  </td>
                  <td className="px-5 py-4"><ActiveBadge active={brand.active} /></td>
                  <td className="px-5 py-4 text-right sm:px-6">
                    <EditButton label={`Sửa ${brand.name}`} onClick={() => onEdit(brand)} />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductTable({
  products,
  isLoading,
  isError,
  page,
  totalPages,
  totalProducts,
  onPreviousPage,
  onNextPage,
  onEdit,
  onManage,
}: {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  page: number;
  totalPages: number;
  totalProducts: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onEdit: (product: Product) => void;
  onManage: (product: Product) => void;
}) {
  if (isError) return <ErrorTable />;
  if (!isLoading && products.length === 0) return <EmptyTable message="Không tìm thấy sản phẩm nào" />;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3.5 font-semibold sm:px-6">ID</th>
              <th className="px-5 py-3.5 font-semibold">Sản phẩm</th>
              <th className="px-5 py-3.5 font-semibold">Danh mục</th>
              <th className="px-5 py-3.5 font-semibold">Thương hiệu</th>
              <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
              <th className="px-5 py-3.5 text-right font-semibold sm:px-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? <LoadingRows columns={6} />
              : products.map((product) => (
                  <tr key={product.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-semibold text-slate-500 sm:px-6">#{product.id}</td>
                    <td className="px-5 py-4">
                      <p className="max-w-xs font-bold text-slate-800">{product.name}</p>
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-400">{product.description || 'Chưa có mô tả'}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{product.categoryName}</td>
                    <td className="px-5 py-4 text-slate-600">{product.brandName}</td>
                    <td className="px-5 py-4"><ActiveBadge active={product.active} /></td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <button
                        aria-label={`Quản lý ${product.name}`}
                        className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                        type="button"
                        onClick={() => onManage(product)}
                      >
                        <Settings2 className="h-4 w-4" />
                        <span className="hidden lg:inline">Quản lý</span>
                      </button>
                      <EditButton label={`Sửa ${product.name}`} onClick={() => onEdit(product)} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-slate-400">Tổng cộng {totalProducts} sản phẩm</p>
        <div className="flex items-center gap-2">
          <button
            aria-label="Trang trước"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b5cff] disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={page === 0}
            onClick={onPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-20 text-center text-sm font-semibold text-slate-600">
            {page + 1} / {totalPages}
          </span>
          <button
            aria-label="Trang sau"
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0b5cff] disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={page >= totalPages - 1}
            onClick={onNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function ProductManagerModal({ productId, onClose }: { productId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ProductManagementTab>('variants');
  const [variantEditingId, setVariantEditingId] = useState<number | null>(null);
  const [variantForm, setVariantForm] = useState<ProductVariantPayload | null>(null);
  const [imageEditingId, setImageEditingId] = useState<number | null>(null);
  const [imageForm, setImageForm] = useState<ProductImagePayload | null>(null);
  const detailsQuery = useQuery({
    queryKey: ['admin', 'product-details', productId],
    queryFn: () => catalogApi.getProductDetails(productId),
  });

  const refreshDetails = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'product-details', productId] });
    await queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };

  const saveVariantMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number | null; payload: ProductVariantPayload }) => {
      if (id) return adminApi.updateVariant(id, payload);
      return adminApi.createVariant(productId, payload);
    },
    onSuccess: async () => {
      await refreshDetails();
      setVariantEditingId(null);
      setVariantForm(null);
    },
  });

  const saveImageMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number | null; payload: ProductImagePayload }) => {
      if (id) return adminApi.updateProductImage(id, payload);
      return adminApi.uploadProductImage(productId, payload);
    },
    onSuccess: async () => {
      await refreshDetails();
      setImageEditingId(null);
      setImageForm(null);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => adminApi.deleteProductImage(imageId),
    onSuccess: refreshDetails,
  });

  const details = detailsQuery.data as ProductDetails | undefined;

  return (
    <AdminModal
      title={details ? `Quản lý: ${details.name}` : 'Quản lý sản phẩm'}
      description="Cập nhật phiên bản, giá niêm yết, giá bán, tồn kho và hình ảnh hiển thị tại cửa hàng."
      onClose={onClose}
    >
      {detailsQuery.isLoading && <div className="p-8 text-center text-sm font-medium text-slate-400">Đang tải thông tin sản phẩm...</div>}
      {detailsQuery.isError && <div className="p-6"><MutationError error={detailsQuery.error} /></div>}
      {details && (
        <div>
          <div className="flex gap-2 border-b border-slate-100 px-5 pt-4 sm:px-6">
            <button
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold transition ${tab === 'variants' ? 'border-[#0b5cff] text-[#0b5cff]' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              type="button"
              onClick={() => setTab('variants')}
            >
              <Layers3 className="h-4 w-4" /> Phiên bản ({details.variants.length})
            </button>
            <button
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold transition ${tab === 'images' ? 'border-[#0b5cff] text-[#0b5cff]' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              type="button"
              onClick={() => setTab('images')}
            >
              <ImagePlus className="h-4 w-4" /> Hình ảnh ({details.images.length})
            </button>
          </div>

          {tab === 'variants' && (
            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">Phiên bản sản phẩm</h3>
                  <p className="mt-1 text-sm text-slate-500">Mỗi phiên bản có SKU, giá niêm yết, giá bán và số lượng tồn kho riêng.</p>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0b5cff] px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  type="button"
                  onClick={() => {
                    setVariantEditingId(null);
                    setVariantForm({ name: '', sku: '', price: 0, originalPrice: null, stockQuantity: 0, active: true });
                  }}
                >
                  <Plus className="h-4 w-4" /> Thêm phiên bản
                </button>
              </div>

              {details.variants.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">Sản phẩm chưa có phiên bản. Hãy thêm ít nhất một phiên bản để khách hàng có thể đặt mua.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Phiên bản</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Giá niêm yết</th><th className="px-4 py-3">Giá bán</th><th className="px-4 py-3">Tồn kho</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {details.variants.map((variant) => (
                        <tr key={variant.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800">{variant.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{variant.sku}</td>
                          <td className="px-4 py-3 text-slate-500">{variant.originalPrice == null ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(variant.originalPrice)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(variant.price)}</td>
                          <td className="px-4 py-3 text-slate-700">{variant.stockQuantity}</td>
                          <td className="px-4 py-3 text-right"><EditButton label={`Sửa phiên bản ${variant.name}`} onClick={() => { setVariantEditingId(variant.id); setVariantForm({ name: variant.name, sku: variant.sku, price: variant.price, originalPrice: variant.originalPrice, stockQuantity: variant.stockQuantity, active: variant.active }); }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {variantForm && (
                <form
                  className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4"
                  onSubmit={(event) => { event.preventDefault(); saveVariantMutation.mutate({ id: variantEditingId, payload: variantForm }); }}
                >
                  <p className="font-bold text-slate-800">{variantEditingId ? 'Cập nhật phiên bản' : 'Thêm phiên bản mới'}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Tên phiên bản</span><input required maxLength={150} className={inputClassName} placeholder="Ví dụ: Black & Gold" value={variantForm.name} onChange={(event) => setVariantForm({ ...variantForm, name: event.target.value })} /></label>
                    <label><span className="mb-1.5 block text-sm font-semibold text-slate-700">SKU</span><input required maxLength={100} className={inputClassName} placeholder="MOUSE-LOG-01-BLK" value={variantForm.sku} onChange={(event) => setVariantForm({ ...variantForm, sku: event.target.value })} /></label>
                    <label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Giá niêm yết (VNĐ)</span><input min="0" type="number" className={inputClassName} placeholder="Để trống nếu không giảm giá" value={variantForm.originalPrice ?? ''} onChange={(event) => setVariantForm({ ...variantForm, originalPrice: event.target.value === '' ? null : Number(event.target.value) })} /></label>
                    <label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Giá bán (VNĐ)</span><input required min="0" type="number" className={inputClassName} value={variantForm.price} onChange={(event) => setVariantForm({ ...variantForm, price: Number(event.target.value) })} /></label>
                    <label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Số lượng tồn kho</span><input required min="0" type="number" className={inputClassName} value={variantForm.stockQuantity} onChange={(event) => setVariantForm({ ...variantForm, stockQuantity: Number(event.target.value) })} /></label>
                  </div>
                  <Toggle checked={variantForm.active} label="Cho phép khách hàng chọn phiên bản này" onChange={(active) => setVariantForm({ ...variantForm, active })} />
                  <MutationError error={saveVariantMutation.error} />
                  <FormActions isPending={saveVariantMutation.isPending} label={variantEditingId ? 'Lưu phiên bản' : 'Thêm phiên bản'} onCancel={() => { setVariantEditingId(null); setVariantForm(null); }} />
                </form>
              )}
            </div>
          )}

          {tab === 'images' && (
            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <h3 className="font-bold text-slate-900">Hình ảnh sản phẩm</h3>
                <p className="mt-1 text-sm text-slate-500">Chọn file JPEG, PNG hoặc WebP. Ảnh sẽ được lưu an toàn cùng dữ liệu cửa hàng.</p>
              </div>
              {details.images.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">Sản phẩm chưa có ảnh. Hãy upload ảnh đầu tiên để hiển thị tại cửa hàng.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {details.images.map((image) => (
                    <article key={image.id} className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                      <img className="h-36 w-full bg-slate-50 object-contain" src={image.imageUrl} alt={`${details.name} ${image.sortOrder + 1}`} />
                      <div className="flex items-center justify-between gap-3 p-3"><span className="text-xs font-semibold text-slate-500">Thứ tự {image.sortOrder}</span><div className="flex gap-1"><button className="grid h-8 w-8 place-items-center rounded-lg text-[#0b5cff] hover:bg-blue-50" type="button" aria-label="Sửa ảnh" onClick={() => { setImageEditingId(image.id); setImageForm({ sortOrder: image.sortOrder, file: null }); }}><Edit3 className="h-4 w-4" /></button><button className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" type="button" aria-label="Xóa ảnh" disabled={deleteImageMutation.isPending} onClick={() => deleteImageMutation.mutate(image.id)}><Trash2 className="h-4 w-4" /></button></div></div>
                    </article>
                  ))}
                </div>
              )}
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-4 py-3 text-sm font-bold text-[#0b5cff] transition hover:bg-blue-50"
                type="button"
                onClick={() => { setImageEditingId(null); setImageForm({ sortOrder: details.images.length, file: null }); }}
              >
                <Upload className="h-4 w-4" /> Thêm ảnh
              </button>
              {imageForm && (
                <form
                  className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4"
                  onSubmit={(event) => { event.preventDefault(); saveImageMutation.mutate({ id: imageEditingId, payload: imageForm }); }}
                >
                  <p className="font-bold text-slate-800">{imageEditingId ? 'Cập nhật ảnh' : 'Upload ảnh sản phẩm'}</p>
                  <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Chọn ảnh {imageEditingId ? '(không bắt buộc nếu chỉ đổi thứ tự)' : ''}</span><input required={!imageEditingId} accept="image/jpeg,image/png,image/webp" type="file" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#0b5cff]" onChange={(event) => setImageForm({ ...imageForm, file: event.target.files?.[0] ?? null })} /><p className="mt-2 text-xs text-slate-400">Hỗ trợ JPEG, PNG hoặc WebP; dung lượng tối đa 5 MB.</p></label>
                  <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Thứ tự hiển thị</span><input required min="0" type="number" className={inputClassName} value={imageForm.sortOrder} onChange={(event) => setImageForm({ ...imageForm, sortOrder: Number(event.target.value) })} /></label>
                  <MutationError error={saveImageMutation.error || deleteImageMutation.error} />
                  <FormActions isPending={saveImageMutation.isPending} label={imageEditingId ? 'Lưu ảnh' : 'Upload ảnh'} onCancel={() => { setImageEditingId(null); setImageForm(null); }} />
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </AdminModal>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          checked={checked}
          className="peer sr-only"
          type="checkbox"
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-[#0b5cff]" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function FormActions({ isPending, label, onCancel }: { isPending: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
      <button
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        type="button"
        onClick={onCancel}
      >
        Hủy
      </button>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b5cff] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        type="submit"
        disabled={isPending}
      >
        {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {label}
      </button>
    </div>
  );
}

function MutationError({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">{getErrorMessage(error)}</p>;
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-bold text-[#0b5cff] transition hover:bg-blue-50"
      type="button"
      onClick={onClick}
    >
      <Edit3 className="h-4 w-4" />
      <span className="hidden sm:inline">Sửa</span>
    </button>
  );
}

function LoadingRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-4 sm:px-6" colSpan={columns}>
            <div className="h-5 animate-pulse rounded bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}

function ErrorTable() {
  return (
    <div className="p-10 text-center">
      <p className="text-sm font-semibold text-rose-600">Không thể tải dữ liệu quản trị.</p>
      <p className="mt-1 text-sm text-slate-400">Hãy kiểm tra quyền quản trị hoặc thử tải lại trang.</p>
    </div>
  );
}

export default AdminCatalogPage;
