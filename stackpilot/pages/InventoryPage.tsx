import React, { useState, useEffect, useCallback } from "react";
import InventoryTable from "../components/InventoryTable";
import ProductFormModal from "../components/ProductFormModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { PlusCircleIcon } from "../components/icons";
import {
  getProducts,
  deleteProduct,
  getCategories,
  getSuppliers,
  Product,
  Category,
  Supplier,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../utils/hooks";

const InventoryPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState("");

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedCategoryFilter = useDebounce(categoryFilter, 300);
  const debouncedSupplierFilter = useDebounce(supplierFilter, 300);
  const debouncedStockStatusFilter = useDebounce(stockStatusFilter, 300);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "primary" as "primary" | "danger",
  });

  // === Fetch Data ===
  const fetchInventoryData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        getProducts({
          search: debouncedSearchTerm || undefined,
          category_id:
            debouncedCategoryFilter !== ""
              ? Number(debouncedCategoryFilter)
              : undefined,
          supplier_id:
            debouncedSupplierFilter !== ""
              ? Number(debouncedSupplierFilter)
              : undefined,
          stock_status:
            debouncedStockStatusFilter && debouncedStockStatusFilter !== "all"
              ? (debouncedStockStatusFilter as
                  | "Out of Stock"
                  | "Low Stock"
                  | "In Stock")
              : undefined,
        }),
        getCategories(),
        getSuppliers(),
      ]);

      setProducts(
        Array.isArray(productsRes.data) ? productsRes.data : [productsRes.data]
      );
      setCategories(
        Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : [categoriesRes.data]
      );
      setSuppliers(
        Array.isArray(suppliersRes.data)
          ? suppliersRes.data
          : [suppliersRes.data]
      );
    } catch (err: any) {
      setError(err.message || "Failed to fetch inventory data.");
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    debouncedSearchTerm,
    debouncedCategoryFilter,
    debouncedSupplierFilter,
    debouncedStockStatusFilter,
  ]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // === Modal Handlers ===
  const handleOpenModalForCreate = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  const handleOpenModalForEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProduct(null);
  };

  // ✅ This is simpler now — just re-fetch after save
  const handleSaveProduct = () => {
    fetchInventoryData();
    handleCloseFormModal();
  };

  const handleDeleteConfirmation = (productId: number) => {
    const product = products.find((p) => p.product_id === productId);
    if (!product) return;

    const action = async () => {
      setLoading(true);
      setError(null);
      try {
        await deleteProduct(productId);
        await fetchInventoryData();
      } catch (err: any) {
        setError(err.message || "Failed to delete product.");
      } finally {
        setLoading(false);
        setIsConfirmModalOpen(false);
      }
    };

    setConfirmModalContent({
      title: "Confirm Deletion",
      message: `Are you sure you want to delete the product "${product.name}"? This action cannot be undone.`,
      onConfirm: action,
      variant: "danger",
    });
    setIsConfirmModalOpen(true);
  };

  const handleCancelConfirmation = () => {
    setIsConfirmModalOpen(false);
  };

  // === Loading State ===
  if (loading && products.length === 0) {
    return (
      <main className="page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-peso"></div>
        <p className="ml-3 text-muted">Loading inventory…</p>
      </main>
    );
  }

  // === Error State ===
  if (error) {
    return (
      <main className="page flex items-center justify-center">
        <div className="card flex items-center gap-4 p-6">
          <p className="text-sm text-danger">{error}</p>
          <button onClick={fetchInventoryData} className="btn btn-primary">
            Retry
          </button>
        </div>
      </main>
    );
  }

  // === Main Layout ===
  return (
    <main className="page">
      <div className="page-inner flex flex-col space-y-4 lg:space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3 pl-12 lg:pl-0">
          <div>
            <p className="eyebrow">Stock</p>
            <h1 className="page-title mt-1">Inventory</h1>
            <p className="mt-1 text-sm text-muted">
              Add, edit, at i-track ang mga produkto.
            </p>
          </div>
          <button
            onClick={handleOpenModalForCreate}
            className="btn btn-primary"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span>Add product</span>
          </button>
        </header>

        <div className="card flex flex-1 flex-col overflow-hidden p-4 lg:p-5">
          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="search"
              placeholder="Search name, SKU, or barcode"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="field"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="field"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="field"
            >
              <option value="">All suppliers</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="field"
            >
              <option value="">All stock statuses</option>
              <option value="In Stock">In stock</option>
              <option value="Low Stock">Low stock (paubos)</option>
              <option value="Out of Stock">Out of stock</option>
            </select>
          </div>

          {/* Table or Empty State */}
          <div className="relative flex-1 overflow-hidden">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-peso"></div>
              </div>
            )}
            {products.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                <p className="text-sm font-semibold text-muted">
                  No products found
                </p>
                <p className="text-xs text-faint">
                  Try another search, or add a product to start your stock list.
                </p>
              </div>
            ) : (
            <InventoryTable
              products={products}
              mode="management"
              categories={categories}
              onEdit={handleOpenModalForEdit}
              onDelete={handleDeleteConfirmation}
            />
            )}
          </div>
        </div>
      </div>

      {/* ✅ Product Modal (confirmation handled inside it) */}
      {isFormModalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          suppliers={suppliers}
          onSave={handleSaveProduct} // just re-fetch
          onClose={handleCloseFormModal}
        />
      )}

      {/* 🗑️ Confirmation for Delete */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title={confirmModalContent.title}
        message={confirmModalContent.message}
        variant={confirmModalContent.variant}
        onConfirm={confirmModalContent.onConfirm}
        onCancel={handleCancelConfirmation}
      />
    </main>
  );
};

export default InventoryPage;
