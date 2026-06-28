import React, { useState, useEffect } from "react";
import {
  Product,
  Category,
  Supplier,
  createProduct,
  updateProduct,
} from "../utils/api";
import ConfirmationModal from "./ConfirmationModal";
import DialogFrame from "./DialogFrame";

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onSave: () => void;
  onClose: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  categories,
  suppliers,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    unit_price: "",
    selling_price: "",
    stock: "",
    category_id: "",
    supplier_id: "",
    barcode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);

  // Prefill form if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        unit_price: product.unit_price?.toString() || "",
        selling_price: product.selling_price?.toString() || "",
        stock: product.stock?.toString() || "",
        category_id: product.category_id?.toString() || "",
        supplier_id: product.supplier_id?.toString() || "",
        barcode: product.barcode || "",
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        unit_price: "",
        selling_price: "",
        stock: "",
        category_id: "",
        supplier_id: "",
        barcode: "",
      });
    }
    setError(null);
  }, [product]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (
      formData.unit_price === "" ||
      isNaN(Number(formData.unit_price)) ||
      Number(formData.unit_price) < 0
    ) {
      setError("Unit price must be a valid number.");
      return;
    }

    if (
      formData.selling_price === "" ||
      isNaN(Number(formData.selling_price)) ||
      Number(formData.selling_price) <= 0
    ) {
      setError("Selling price must be greater than zero.");
      return;
    }

    if (
      formData.stock === "" ||
      isNaN(Number(formData.stock)) ||
      Number(formData.stock) < 0 ||
      !Number.isInteger(Number(formData.stock))
    ) {
      setError("Stock quantity must be a whole number of zero or more.");
      return;
    }

    if (!formData.category_id) {
      setError("Category is required.");
      return;
    }

    setIsConfirmSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const productPayload = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        unit_price: parseFloat(formData.unit_price),
        selling_price: parseFloat(formData.selling_price),
        stock: parseInt(formData.stock, 10),
        category_id: parseInt(formData.category_id, 10),
        supplier_id: formData.supplier_id
          ? parseInt(formData.supplier_id, 10)
          : null,
        barcode: formData.barcode.trim() || null,
      };

      if (product) {
        await updateProduct(product.product_id, productPayload);
      } else {
        await createProduct(productPayload);
      }

      onSave(); // Trigger parent re-fetch
      onClose(); // Close modal after success
    } catch (err: any) {
      setError(err.message || "Failed to save product.");
    } finally {
      setLoading(false);
      setIsConfirmSaveOpen(false);
    }
  };

  return (
    <>
      <DialogFrame onClose={onClose} maxWidth="max-w-2xl">
        <h2 className="font-display text-xl font-bold text-ink mb-5">
          {product ? "Edit product" : "Add new product"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="field-label">
              Product name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className="field"
              required
            />
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sku" className="field-label">
                SKU (optional)
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                disabled={loading}
                className="field"
              />
            </div>

            <div>
              <label htmlFor="barcode" className="field-label">
                Barcode (optional)
              </label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                disabled={loading}
                className="field font-mono"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Stock Quantity */}
          <div>
            <label htmlFor="stock" className="field-label">
              Stock quantity
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              disabled={loading}
              className="field"
              min="0"
              step="1"
              required
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit_price" className="field-label">
                Unit price (puhunan)
              </label>
              <input
                type="number"
                id="unit_price"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                disabled={loading}
                className="field"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label htmlFor="selling_price" className="field-label">
                Selling price (benta)
              </label>
              <input
                type="number"
                id="selling_price"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleChange}
                disabled={loading}
                className="field"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Category & Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category_id" className="field-label">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                disabled={loading}
                required
                className="field"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="supplier_id" className="field-label">
                Supplier (optional)
              </label>
              <select
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                disabled={loading}
                className="field"
              >
                <option value="">Select supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.supplier_id} value={sup.supplier_id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger-tint px-3.5 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="ml-2">Saving…</span>
                </div>
              ) : (
                "Save product"
              )}
            </button>
          </div>
        </form>
      </DialogFrame>

      {/* ✅ Confirmation Modal inside Form */}
      <ConfirmationModal
        isOpen={isConfirmSaveOpen}
        title={`Confirm ${product ? "Update" : "Creation"}`}
        message={`Are you sure you want to ${
          product ? "update" : "create"
        } the product "${formData.name}"?`}
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmSaveOpen(false)}
      />
    </>
  );
};

export default ProductFormModal;
