import React, { useState, useEffect } from "react";
import {
  Product,
  Category,
  Supplier,
  createProduct,
  updateProduct,
} from "../utils/api";
import ConfirmationModal from "./ConfirmationModal";

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

    if (!formData.unit_price || isNaN(Number(formData.unit_price))) {
      setError("Unit price must be a valid number.");
      return;
    }

    if (!formData.selling_price || isNaN(Number(formData.selling_price))) {
      setError("Selling price must be a valid number.");
      return;
    }

    setIsConfirmSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const productPayload = {
        name: formData.name,
        sku: formData.sku || null,
        unit_price: parseFloat(formData.unit_price),
        selling_price: parseFloat(formData.selling_price),
        stock: parseInt(formData.stock) || 0,
        category_id: parseInt(formData.category_id),
        supplier_id: formData.supplier_id
          ? parseInt(formData.supplier_id)
          : null,
        barcode: formData.barcode || null,
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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">
          {product ? "Edit Product" : "Add New Product"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>

          {/* SKU & Stock Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sku"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                SKU (Optional)
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="stock"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="unit_price"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Unit Price
              </label>
              <input
                type="number"
                id="unit_price"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label
                htmlFor="selling_price"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Selling Price
              </label>
              <input
                type="number"
                id="selling_price"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Category & Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                disabled={loading}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="supplier_id"
                className="block text-sm font-medium text-gray-400 mb-1"
              >
                Supplier (Optional)
              </label>
              <select
                id="supplier_id"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.supplier_id} value={sup.supplier_id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          {/* Buttons */}
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="ml-2">Saving...</span>
                </div>
              ) : (
                "Save Product"
              )}
            </button>
          </div>
        </form>
      </div>

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
    </div>
  );
};

export default ProductFormModal;
