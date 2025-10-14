import React, { useState, useEffect, useCallback, useRef } from "react";
import InventoryTable from "../components/InventoryTable";
import PosSystem from "../components/PosSystem";
import InvoiceModal from "../components/InvoiceModal";
import {
  getProducts,
  getCategories,
  processOrderPOS,
  Product,
  Category,
  OrderItem,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../utils/hooks";

const PosPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderForReceipt, setOrderForReceipt] = useState<number | null>(null);

  // Debounce search and filter
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedCategoryFilter = useDebounce(categoryFilter, 300);

  // Track if we're processing an order to prevent multiple renders
  const isProcessingOrder = useRef(false);

  const fetchPosData = useCallback(async () => {
    if (!isAuthenticated) return;

    // Don't refetch if we're in the middle of processing an order
    if (isProcessingOrder.current) return;

    setLoading(true);
    setError(null);

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        getProducts({
          search: debouncedSearchTerm || undefined,
          category_id:
            debouncedCategoryFilter !== ""
              ? Number(debouncedCategoryFilter)
              : undefined,
          supplier_id: undefined,
          stock_status: undefined,
        }),
        getCategories(),
      ]);

      const filteredProducts = (productsResponse.data || []).filter(
        (p: Product) => p.stock > 0
      );

      setProducts(filteredProducts);
      setCategories(
        Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : [categoriesResponse.data]
      );
    } catch (err: any) {
      // console.error("Failed to fetch POS data:", err);
      setError(err.message || "Failed to fetch POS data.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, debouncedSearchTerm, debouncedCategoryFilter]);

  useEffect(() => {
    fetchPosData();
  }, [fetchPosData]);

  /** =====================
   * 🛒 CART HANDLERS
   * ===================== */
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product_id === product.product_id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          product_id: product.product_id,
          product_name: product.name,
          price_at_sale: product.selling_price,
          quantity: 1,
          category_id: product.category_id,
        },
      ];
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product_id !== productId)
    );
  };

  const handleClearCart = () => setCart([]);

  /** =====================
   * 💳 PROCESS ORDER (POS)
   * ===================== */
  const handleCreateOrder = async (payload: {
    sub_total: number;
    tax: number;
    total: number;
    discount: number;
    discount_amount: number;
    discount_type: string | null;
    payment_method: string;
    items: {
      product_id: number;
      name: string;
      price: number;
      quantity: number;
      category_id: number;
    }[];
  }) => {
    try {
      // Set flag to prevent refetch during order processing
      isProcessingOrder.current = true;
      setLoading(true);

      const response = await processOrderPOS(payload);
      const orderId = response?.data?.order_id;

      if (orderId) {
        // Clear cart immediately
        handleClearCart();

        // Show invoice modal
        setOrderForReceipt(orderId);

        // Refresh product list after a short delay
        setTimeout(() => {
          isProcessingOrder.current = false;
          fetchPosData();
        }, 300);
      } else {
        // console.warn("⚠️ No order_id found in response:", response);
        isProcessingOrder.current = false;
      }
    } catch (err: any) {
      // console.error("❌ Failed to process order:", err);
      setError(err.message || "Failed to create order.");
      isProcessingOrder.current = false;
    } finally {
      setLoading(false);
    }
  };

  /** =====================
   * 🖥️ RENDER UI
   * ===================== */
  if (loading && products.length === 0) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        <p className="ml-3 text-sky-400">Loading POS data...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center text-red-400">
        <p>Error: {error}</p>
        <button
          onClick={fetchPosData}
          className="ml-4 px-4 py-2 bg-sky-600 text-white rounded-md"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col min-w-0">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Point of Sale
          </h1>
          <p className="text-gray-400">
            Create a new order by adding products from the list.
          </p>
        </header>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

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
                categories={categories}
                mode="pos"
                onAddToCart={handleAddToCart}
              />
            )}
          </div>
        </div>
      </main>

      <PosSystem
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCreateOrder={handleCreateOrder}
      />

      {orderForReceipt && (
        <InvoiceModal
          orderId={orderForReceipt}
          onClose={() => setOrderForReceipt(null)}
        />
      )}
    </div>
  );
};

export default PosPage;
