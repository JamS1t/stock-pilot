import React, { useState, useEffect, useCallback, useMemo } from "react";
import InventoryTable, {
  InventorySortKey,
} from "../components/InventoryTable";
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
  const [noBarcodeOnly, setNoBarcodeOnly] = useState(false);
  const [sortKey, setSortKey] = useState<InventorySortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 25;

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

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearchTerm,
    debouncedCategoryFilter,
    debouncedSupplierFilter,
    debouncedStockStatusFilter,
    noBarcodeOnly,
    sortKey,
    sortDirection,
  ]);

  const categoryNameById = useMemo(
    () =>
      new Map(categories.map((category) => [category.category_id, category.name])),
    [categories]
  );

  const visibleProducts = useMemo(() => {
    const filtered = noBarcodeOnly
      ? products.filter((product) => !product.barcode)
      : products;

    const getSortValue = (product: Product) => {
      switch (sortKey) {
        case "category":
          return product.category_name || categoryNameById.get(product.category_id) || "";
        case "sku":
          return product.sku || "";
        case "barcode":
          return product.barcode || "";
        case "selling_price":
          return Number(product.selling_price || 0);
        case "stock":
          return Number(product.stock || 0);
        case "stock_status":
          return product.stock_status || "";
        case "name":
        default:
          return product.name || "";
      }
    };

    return [...filtered].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      const direction = sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue)) * direction;
    });
  }, [categoryNameById, noBarcodeOnly, products, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const pagedProducts = useMemo(
    () => visibleProducts.slice((page - 1) * pageSize, page * pageSize),
    [page, visibleProducts]
  );

  const handleSort = (key: InventorySortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setSupplierFilter("");
    setStockStatusFilter("");
    setNoBarcodeOnly(false);
  };

  const exportInventoryCsv = () => {
    const headers = [
      "Product ID",
      "Name",
      "SKU",
      "Barcode",
      "Category",
      "Supplier",
      "Unit Price",
      "Selling Price",
      "Stock",
      "Stock Status",
    ];
    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = visibleProducts.map((product) => [
      product.product_id,
      product.name,
      product.sku || "",
      product.barcode || "",
      product.category_name || categoryNameById.get(product.category_id) || "",
      product.supplier_name || "",
      product.unit_price,
      product.selling_price,
      product.stock,
      product.stock_status || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setStockStatusFilter("Low Stock");
                  setNoBarcodeOnly(false);
                }}
                className="pill pill-warn"
              >
                Low stock
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockStatusFilter("Out of Stock");
                  setNoBarcodeOnly(false);
                }}
                className="pill pill-bad"
              >
                Out of stock
              </button>
              <button
                type="button"
                onClick={() => setNoBarcodeOnly((current) => !current)}
                className={`pill ${noBarcodeOnly ? "pill-ok" : "pill-muted"}`}
              >
                No barcode
              </button>
            </div>
            <button
              type="button"
              onClick={exportInventoryCsv}
              disabled={visibleProducts.length === 0}
              className="btn btn-ghost"
            >
              Export CSV
            </button>
          </div>

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

          {(searchTerm ||
            categoryFilter ||
            supplierFilter ||
            stockStatusFilter ||
            noBarcodeOnly) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase text-faint">
                Active filters
              </span>
              {searchTerm && <span className="pill pill-muted">Search</span>}
              {categoryFilter && (
                <span className="pill pill-muted">
                  {categoryNameById.get(Number(categoryFilter)) || "Category"}
                </span>
              )}
              {supplierFilter && (
                <span className="pill pill-muted">
                  {suppliers.find((s) => s.supplier_id === Number(supplierFilter))
                    ?.name || "Supplier"}
                </span>
              )}
              {stockStatusFilter && (
                <span className="pill pill-muted">{stockStatusFilter}</span>
              )}
              {noBarcodeOnly && <span className="pill pill-muted">No barcode</span>}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-peso hover:text-peso-deep"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Table or Empty State */}
          <div className="relative flex-1 overflow-hidden">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-peso"></div>
              </div>
            )}
            {visibleProducts.length === 0 ? (
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
              products={pagedProducts}
              mode="management"
              categories={categories}
              onEdit={handleOpenModalForEdit}
              onDelete={handleDeleteConfirmation}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            )}
          </div>

          {visibleProducts.length > pageSize && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-sm text-muted">
              <span>
                Showing {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, visibleProducts.length)} of{" "}
                {visibleProducts.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost"
                >
                  Previous
                </button>
                <span className="money text-xs font-semibold text-ink">
                  {page} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(pageCount, current + 1))
                  }
                  disabled={page === pageCount}
                  className="btn btn-ghost"
                >
                  Next
                </button>
              </div>
            </div>
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
