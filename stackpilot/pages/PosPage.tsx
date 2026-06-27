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
        // Check if we can add more (don't exceed available stock)
        if (existingItem.quantity >= product.stock) {
          // Don't add more if already at max stock
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // New item - check if stock is available
      if (product.stock < 1) {
        return prevCart;
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
      prevCart.map((item) => {
        if (item.product_id === productId) {
          // Find the product to check stock limit
          const product = products.find((p) => p.product_id === productId);
          const maxQuantity = product ? product.stock : item.quantity;
          // Ensure quantity is between 1 and available stock
          return { ...item, quantity: Math.max(1, Math.min(quantity, maxQuantity)) };
        }
        return item;
      })
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
        isProcessingOrder.current = false;
      }
    } catch (err: any) {
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
      <main className="page flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-peso"></div>
        <p className="ml-3 text-muted">Loading counter…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page flex items-center justify-center">
        <div className="card flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-danger">
            Couldn't load the counter
          </p>
          <p className="text-xs text-muted">{error}</p>
          <button
            type="button"
            onClick={fetchPosData}
            className="btn btn-primary"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="page flex min-w-0 flex-col">
        <div className="page-inner flex flex-1 flex-col">
          <header className="mb-6 pl-12 lg:pl-0">
            <p className="eyebrow">Benta</p>
            <h1 className="page-title mt-1">Legacy POS</h1>
            <p className="mt-1 text-sm text-muted">
              Add products to start a sale.
            </p>
          </header>

          <div className="card flex flex-1 flex-col overflow-hidden p-4 lg:p-5">
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="search"
                placeholder="Search name, SKU, or barcode"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="field min-h-12"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="field min-h-12"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 overflow-hidden">
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-peso"></div>
                </div>
              )}
              {products.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                  <p className="text-sm font-semibold text-muted">
                    No products found
                  </p>
                  <p className="text-xs text-faint">
                    Try another search, or add stock in Inventory.
                  </p>
                </div>
              ) : (
                <InventoryTable
                  products={products}
                  categories={categories}
                  mode="pos"
                  onAddToCart={handleAddToCart}
                  cartItems={cart}
                />
              )}
            </div>
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