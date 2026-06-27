import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  PackageIcon,
  ShoppingCartIcon,
  TagIcon,
  UsersIcon,
} from "../components/icons";
import { useAuth } from "../context/AuthContext";
import { useFormatters } from "../format";
import { useDebounce } from "../utils/hooks";
import { getProducts, Product } from "../utils/api";

interface CounterDashboardProps {
  setActivePage: (page: string) => void;
}

interface CounterCartItem {
  product_id: number;
  product_name: string;
  price_at_sale: number;
  quantity: number;
  category_id: number;
  stock: number;
}

const secondaryLinks = [
  { label: "Inventory", page: "inventory", icon: PackageIcon },
  { label: "Reports", page: "reports", icon: ChartBarIcon },
  { label: "Categories", page: "categories", icon: TagIcon },
  { label: "Suppliers", page: "suppliers", icon: UsersIcon },
  { label: "Orders", page: "order_history", icon: ClockIcon },
  { label: "Settings", page: "settings", icon: Cog6ToothIcon },
];

const CounterDashboard: React.FC<CounterDashboardProps> = ({
  setActivePage,
}) => {
  const { store } = useAuth();
  const { formatCurrency } = useFormatters();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CounterCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProducts({
        search: debouncedSearchTerm || undefined,
      });
      setProducts((response.data || []).filter((product) => product.stock > 0));
    } catch (err: any) {
      setError(err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price_at_sale * item.quantity,
        0
      ),
    [cart]
  );

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find(
        (item) => item.product_id === product.product_id
      );

      if (existing) {
        return current.map((item) =>
          item.product_id === product.product_id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.stock),
              }
            : item
        );
      }

      return [
        ...current,
        {
          product_id: product.product_id,
          product_name: product.name,
          price_at_sale: product.selling_price,
          quantity: 1,
          category_id: product.category_id,
          stock: product.stock,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product_id === productId
            ? {
                ...item,
                quantity: Math.max(
                  0,
                  Math.min(item.stock, item.quantity + delta)
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  return (
    <main className="flex-1 overflow-auto bg-neutral-950 text-white">
      <div className="min-h-full p-4 lg:p-5">
        <header className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">
              {store?.name || "StockPilot"}
            </p>
            <h1 className="text-2xl font-bold tracking-normal text-white lg:text-3xl">
              Counter
            </h1>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Secondary views">
            {secondaryLinks.map(({ label, page, icon: Icon }) => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm font-medium text-neutral-200 hover:border-emerald-500 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(320px,1.15fr)_minmax(360px,0.95fr)_minmax(280px,0.7fr)]">
          <div className="min-h-[620px] rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Products</h2>
                <p className="text-sm text-neutral-400">
                  {loading ? "Loading items" : `${products.length} available`}
                </p>
              </div>
              <button
                onClick={() => setActivePage("legacy_pos")}
                className="min-h-11 rounded-lg border border-neutral-700 px-3 text-sm font-medium text-neutral-300 hover:border-amber-400 hover:text-white"
              >
                Old POS
              </button>
            </div>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search product name, SKU, barcode"
              className="mb-4 min-h-12 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 text-base text-white outline-none focus:border-emerald-400"
            />

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="grid max-h-[500px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
              {products.map((product) => (
                <button
                  key={product.product_id}
                  onClick={() => addToCart(product)}
                  className="min-h-[96px] rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-left hover:border-emerald-500 focus:border-emerald-400 focus:outline-none"
                >
                  <div className="flex h-full flex-col justify-between gap-3">
                    <div>
                      <p className="line-clamp-2 text-sm font-semibold text-white">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Stock {product.stock}
                      </p>
                    </div>
                    <p className="text-base font-bold text-emerald-300">
                      {formatCurrency(product.selling_price)}
                    </p>
                  </div>
                </button>
              ))}

              {!loading && products.length === 0 && (
                <div className="col-span-full flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-neutral-700 text-neutral-400">
                  No products found
                </div>
              )}
            </div>
          </div>

          <div className="min-h-[620px] rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Current Sale</h2>
                <p className="text-sm text-neutral-400">
                  {itemCount} items in cart
                </p>
              </div>
              <button
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="min-h-11 rounded-lg border border-neutral-700 px-3 text-sm font-medium text-neutral-300 hover:border-red-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <div className="mb-4 max-h-[350px] space-y-3 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {item.product_name}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {formatCurrency(item.price_at_sale)}
                      </p>
                    </div>
                    <p className="font-bold text-white">
                      {formatCurrency(item.price_at_sale * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-neutral-700">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="min-h-11 min-w-11 text-xl text-neutral-200 hover:bg-neutral-800"
                        aria-label={`Decrease ${item.product_name}`}
                      >
                        -
                      </button>
                      <span className="min-w-12 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="min-h-11 min-w-11 text-xl text-neutral-200 hover:bg-neutral-800"
                        aria-label={`Increase ${item.product_name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-neutral-500">
                      Max {item.stock}
                    </span>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-neutral-700 text-neutral-400">
                  Cart is empty
                </div>
              )}
            </div>

            <div className="mt-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-neutral-400">Total</span>
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Cash", "GCash", "Utang"].map((label) => (
                  <button
                    key={label}
                    disabled={cart.length === 0}
                    className="min-h-12 rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="min-h-[620px] rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-4 flex items-center gap-3">
              <ShoppingCartIcon className="h-6 w-6 text-emerald-300" />
              <div>
                <h2 className="text-lg font-semibold">Owner Panel</h2>
                <p className="text-sm text-neutral-400">Today at a glance</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                ["Today Sales", formatCurrency(0), "No completed sales yet"],
                ["Expected Cash", formatCurrency(0), "Open cash session soon"],
                ["Low Stock", "0 items", "Stock movement feed pending"],
                ["Who Owes", "0 customers", "Ledger summary pending"],
              ].map(([label, value, detail]) => (
                <div
                  key={label}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 p-3"
                >
                  <p className="text-sm text-neutral-400">{label}</p>
                  <p className="mt-1 text-xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-xs text-neutral-500">{detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3">
              <p className="text-sm font-semibold text-amber-200">
                Offline / Sync
              </p>
              <p className="mt-1 text-sm text-amber-100">
                Online shell. Queue not configured.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default CounterDashboard;
