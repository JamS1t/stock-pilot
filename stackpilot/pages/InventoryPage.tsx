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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        <p className="ml-3 text-sky-400">Loading inventory...</p>
      </main>
    );
  }

  // === Error State ===
  if (error) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center text-red-400">
        <p>Error: {error}</p>
        <button
          onClick={fetchInventoryData}
          className="ml-4 px-4 py-2 bg-sky-600 text-white rounded-md"
        >
          Retry
        </button>
      </main>
    );
  }

  // === Main Layout ===
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col overflow-hidden">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Inventory Management
          </h1>
          <p className="text-gray-400">Add, edit, and remove products.</p>
        </div>
        <button
          onClick={handleOpenModalForCreate}
          className="flex items-center space-x-2 bg-sky-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-sky-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-sky-500/20"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </header>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.supplier_id} value={s.supplier_id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        {/* Table or Empty State */}
        <div className="flex-1 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          )}
          {products.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No products found.
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
