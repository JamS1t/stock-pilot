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
import InvoiceModal from "../components/InvoiceModal";
import { useAuth } from "../context/AuthContext";
import { useFormatters } from "../format";
import {
  getSyncQueueSummary,
  queueOfflineMutation,
  retrySyncQueue,
  SyncQueueSummary,
} from "../offline/syncQueue";
import { useDebounce } from "../utils/hooks";
import {
  CashSession,
  closeCashSession,
  createCustomer,
  createStockMovement,
  createUtang,
  Customer,
  CustomerBalance,
  getCustomerBalance,
  getCustomers,
  getOpenCashSession,
  getProducts,
  getWhoOwes,
  openCashSession,
  processOrderPOS,
  Product,
  recordPayment,
  StockMovementReason,
  WhoOwesCustomer,
} from "../utils/api";

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [whoOwes, setWhoOwes] = useState<WhoOwesCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerBalance, setCustomerBalance] =
    useState<CustomerBalance | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [ledgerNote, setLedgerNote] = useState("");
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderForReceipt, setOrderForReceipt] = useState<number | null>(null);
  const [todaySales, setTodaySales] = useState(0);
  const [expectedCash, setExpectedCash] = useState(0);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [openingCash, setOpeningCash] = useState("");
  const [actualCash, setActualCash] = useState("");
  const [adjustmentProductId, setAdjustmentProductId] = useState("");
  const [adjustmentQty, setAdjustmentQty] = useState("");
  const [adjustmentReason, setAdjustmentReason] =
    useState<StockMovementReason>("correction");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [queueSummary, setQueueSummary] = useState<SyncQueueSummary>({
    queued: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    total: 0,
  });
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
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

  const refreshLedger = useCallback(async () => {
    const [customersResponse, whoOwesResponse] = await Promise.all([
      getCustomers(),
      getWhoOwes(),
    ]);

    setCustomers(customersResponse.data || []);
    setWhoOwes(whoOwesResponse.data || []);
  }, []);

  useEffect(() => {
    refreshLedger().catch((err: any) => {
      setActionError(err.message || "Unable to load ledger data.");
    });
  }, [refreshLedger]);

  const refreshCashSession = useCallback(async () => {
    const response = await getOpenCashSession();
    setCashSession(response.data);
    if (response.data?.opening_cash) {
      setExpectedCash((current) =>
        current === 0 ? Number(response.data?.opening_cash ?? 0) : current
      );
    }
  }, []);

  useEffect(() => {
    refreshCashSession().catch((err: any) => {
      setActionError(err.message || "Unable to load cash session.");
    });
  }, [refreshCashSession]);

  const refreshQueueSummary = useCallback(async () => {
    const summary = await getSyncQueueSummary();
    setQueueSummary(summary);
  }, []);

  useEffect(() => {
    refreshQueueSummary().catch(() => undefined);

    const handleOnline = () => {
      setIsOnline(true);
      retrySyncQueue()
        .then(setQueueSummary)
        .catch((err: any) =>
          setActionError(err.message || "Unable to retry sync queue.")
        );
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshQueueSummary]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerBalance(null);
      return;
    }

    getCustomerBalance(Number(selectedCustomerId))
      .then((response) => setCustomerBalance(response.data))
      .catch((err: any) => {
        setActionError(err.message || "Unable to load customer balance.");
      });
  }, [selectedCustomerId]);

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

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) => customer.customer_id === Number(selectedCustomerId)
      ) || null,
    [customers, selectedCustomerId]
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

  const reloadCounterData = async () => {
    await Promise.all([fetchProducts(), refreshLedger()]);
    if (selectedCustomerId) {
      const balanceResponse = await getCustomerBalance(Number(selectedCustomerId));
      setCustomerBalance(balanceResponse.data);
    }
  };

  const buildOrderPayload = (paymentMethod: "cash" | "gcash") => ({
    sub_total: subtotal,
    tax: 0,
    total: subtotal,
    discount: 0,
    discount_amount: 0,
    discount_type: null,
    payment_method: paymentMethod,
    items: cart.map((item) => ({
      product_id: item.product_id,
      name: item.product_name,
      price: item.price_at_sale,
      quantity: item.quantity,
      category_id: item.category_id,
    })),
  });

  const handleSale = async (paymentMethod: "cash" | "gcash") => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      const response = await processOrderPOS(buildOrderPayload(paymentMethod));
      const orderId = response.data?.order_id;

      setTodaySales((current) => current + subtotal);
      if (paymentMethod === "cash") {
        setExpectedCash((current) => current + subtotal);
      }
      setCart([]);
      setActionStatus(`${paymentMethod.toUpperCase()} sale recorded.`);
      if (orderId) setOrderForReceipt(orderId);
      await reloadCounterData();
    } catch (err: any) {
      setActionError(err.message || "Unable to process sale.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      const response = await createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || null,
      });
      await refreshLedger();
      setSelectedCustomerId(String(response.data.customer_id));
      setNewCustomerName("");
      setNewCustomerPhone("");
      setActionStatus("Customer added.");
    } catch (err: any) {
      setActionError(err.message || "Unable to create customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUtang = async () => {
    if (cart.length === 0 || !selectedCustomerId || isSubmitting) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        amount: subtotal,
        note: ledgerNote || "Counter credit sale",
        source: "manual" as const,
        items: cart.map((item) => ({
          product_id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          unit_price: item.price_at_sale,
          line_total: item.price_at_sale * item.quantity,
        })),
      };

      if (!isOnline) {
        await queueOfflineMutation({
          entity_type: "utang_entry",
          operation_type: "create",
          endpoint: "/utang",
          method: "POST",
          payload,
        });
        setCart([]);
        setLedgerNote("");
        setActionStatus("Utang queued offline.");
        await refreshQueueSummary();
        return;
      }

      await createUtang({
        ...payload,
      });

      setCart([]);
      setLedgerNote("");
      setActionStatus("Utang added to customer balance.");
      await reloadCounterData();
    } catch (err: any) {
      setActionError(err.message || "Unable to create utang entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    const amount = Number(paymentAmount);
    if (!selectedCustomerId || !Number.isFinite(amount) || amount <= 0) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        amount,
        method: "cash" as const,
        note: ledgerNote || null,
      };

      if (!isOnline) {
        await queueOfflineMutation({
          entity_type: "utang_payment",
          operation_type: "create",
          endpoint: "/payments",
          method: "POST",
          payload,
        });
        setPaymentAmount("");
        setLedgerNote("");
        setActionStatus("Payment queued offline.");
        await refreshQueueSummary();
        return;
      }

      await recordPayment({
        ...payload,
      });

      setExpectedCash((current) => current + amount);
      setPaymentAmount("");
      setLedgerNote("");
      setActionStatus("Payment recorded.");
      await reloadCounterData();
    } catch (err: any) {
      setActionError(err.message || "Unable to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetrySync = async () => {
    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      const summary = await retrySyncQueue();
      setQueueSummary(summary);
      setActionStatus("Sync retry finished.");
      await reloadCounterData();
    } catch (err: any) {
      setActionError(err.message || "Unable to retry sync queue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCashSession = async () => {
    const openingAmount = Number(openingCash || 0);
    if (!Number.isFinite(openingAmount) || openingAmount < 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      const response = await openCashSession(openingAmount);
      setCashSession({
        cash_session_id: response.data.cash_session_id,
        opened_by: null,
        opened_at: new Date().toISOString(),
        opening_cash: openingAmount,
        status: "open",
      });
      setExpectedCash(openingAmount);
      setOpeningCash("");
      setActionStatus("Cash session opened.");
    } catch (err: any) {
      setActionError(err.message || "Unable to open cash session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCashSession = async () => {
    const actualAmount = Number(actualCash);
    if (
      !cashSession ||
      !Number.isFinite(actualAmount) ||
      actualAmount < 0 ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      await closeCashSession(cashSession.cash_session_id, {
        expected_cash: expectedCash,
        actual_cash: actualAmount,
      });
      setCashSession(null);
      setActualCash("");
      setActionStatus(
        `Cash session closed. Difference: ${formatCurrency(
          actualAmount - expectedCash
        )}`
      );
    } catch (err: any) {
      setActionError(err.message || "Unable to close cash session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockAdjustment = async () => {
    const quantityDelta = Number(adjustmentQty);
    if (
      !adjustmentProductId ||
      !Number.isFinite(quantityDelta) ||
      quantityDelta === 0 ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      await createStockMovement({
        product_id: Number(adjustmentProductId),
        quantity_delta: quantityDelta,
        reason: adjustmentReason,
        source_type: "counter_adjustment",
        note: adjustmentNote || null,
      });
      setAdjustmentProductId("");
      setAdjustmentQty("");
      setAdjustmentReason("correction");
      setAdjustmentNote("");
      setActionStatus("Stock movement recorded.");
      await fetchProducts();
    } catch (err: any) {
      setActionError(err.message || "Unable to record stock movement.");
    } finally {
      setIsSubmitting(false);
    }
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

            {(actionStatus || actionError) && (
              <div
                className={`mb-4 rounded-lg border p-3 text-sm ${
                  actionError
                    ? "border-red-500/40 bg-red-950/40 text-red-200"
                    : "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                }`}
              >
                {actionError || actionStatus}
              </div>
            )}

            <div className="mb-4 max-h-[260px] space-y-3 overflow-y-auto pr-1">
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

            <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
              <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                <select
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                >
                  <option value="">Select customer for utang/bayad</option>
                  {customers.map((customer) => (
                    <option
                      key={customer.customer_id}
                      value={customer.customer_id}
                    >
                      {customer.name}
                    </option>
                  ))}
                </select>
                <div className="rounded-lg border border-neutral-800 px-3 py-2 text-right">
                  <p className="text-xs text-neutral-500">Balance</p>
                  <p className="text-sm font-bold text-white">
                    {formatCurrency(customerBalance?.balance ?? 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  value={newCustomerName}
                  onChange={(event) => setNewCustomerName(event.target.value)}
                  placeholder="New customer name"
                  className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                />
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={newCustomerPhone}
                    onChange={(event) => setNewCustomerPhone(event.target.value)}
                    placeholder="Phone"
                    className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={handleCreateCustomer}
                    disabled={!newCustomerName.trim() || isSubmitting}
                    className="min-h-11 rounded-lg bg-neutral-700 px-3 text-sm font-bold text-white hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_130px]">
                <input
                  value={ledgerNote}
                  onChange={(event) => setLedgerNote(event.target.value)}
                  placeholder="Ledger note"
                  className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                />
                <input
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="Bayad"
                  inputMode="decimal"
                  className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="mt-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-neutral-400">Total</span>
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSale("cash")}
                  disabled={cart.length === 0 || isSubmitting}
                  className="min-h-12 rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                >
                  Cash
                </button>
                <button
                  onClick={() => handleSale("gcash")}
                  disabled={cart.length === 0 || isSubmitting}
                  className="min-h-12 rounded-lg bg-cyan-600 px-3 text-sm font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                >
                  GCash
                </button>
                <button
                  onClick={handleUtang}
                  disabled={
                    cart.length === 0 || !selectedCustomerId || isSubmitting
                  }
                  className="min-h-12 rounded-lg bg-amber-600 px-3 text-sm font-bold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                >
                  Utang
                </button>
              </div>
              <button
                onClick={handleRecordPayment}
                disabled={
                  !selectedCustomerId ||
                  !Number.isFinite(Number(paymentAmount)) ||
                  Number(paymentAmount) <= 0 ||
                  isSubmitting
                }
                className="mt-2 min-h-12 w-full rounded-lg border border-emerald-600 px-3 text-sm font-bold text-emerald-200 hover:bg-emerald-950 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:text-neutral-500"
              >
                Record Bayad
              </button>
              {selectedCustomer && (
                <p className="mt-2 text-xs text-neutral-500">
                  Customer: {selectedCustomer.name}
                </p>
              )}
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
                [
                  "Today Sales",
                  formatCurrency(todaySales),
                  "Counter sales this session",
                ],
                [
                  "Expected Cash",
                  formatCurrency(expectedCash),
                  "Cash sales and bayad this session",
                ],
                ["Low Stock", "0 items", "Stock movement feed pending"],
                [
                  "Who Owes",
                  `${whoOwes.length} customers`,
                  whoOwes.length
                    ? `${whoOwes[0].name}: ${formatCurrency(whoOwes[0].balance)}`
                    : "No open balances",
                ],
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

            <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Cash Session
                  </p>
                  <p className="text-xs text-neutral-500">
                    {cashSession
                      ? `Open #${cashSession.cash_session_id}`
                      : "No open session"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${
                    cashSession
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {cashSession ? "Open" : "Closed"}
                </span>
              </div>

              {cashSession ? (
                <div className="space-y-2">
                  <input
                    value={actualCash}
                    onChange={(event) => setActualCash(event.target.value)}
                    placeholder="Actual cash count"
                    inputMode="decimal"
                    className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={handleCloseCashSession}
                    disabled={
                      !Number.isFinite(Number(actualCash)) ||
                      Number(actualCash) < 0 ||
                      isSubmitting
                    }
                    className="min-h-11 w-full rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                  >
                    Close Session
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={openingCash}
                    onChange={(event) => setOpeningCash(event.target.value)}
                    placeholder="Opening cash"
                    inputMode="decimal"
                    className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={handleOpenCashSession}
                    disabled={
                      !Number.isFinite(Number(openingCash || 0)) ||
                      Number(openingCash || 0) < 0 ||
                      isSubmitting
                    }
                    className="min-h-11 rounded-lg bg-neutral-700 px-3 text-sm font-bold text-white hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Open
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
              <p className="mb-3 text-sm font-semibold text-white">
                Stock Adjustment
              </p>
              <div className="space-y-2">
                <select
                  value={adjustmentProductId}
                  onChange={(event) =>
                    setAdjustmentProductId(event.target.value)
                  }
                  className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option
                      key={product.product_id}
                      value={product.product_id}
                    >
                      {product.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={adjustmentQty}
                    onChange={(event) => setAdjustmentQty(event.target.value)}
                    placeholder="+/- quantity"
                    inputMode="decimal"
                    className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                  />
                  <select
                    value={adjustmentReason}
                    onChange={(event) =>
                      setAdjustmentReason(
                        event.target.value as StockMovementReason
                      )
                    }
                    className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                  >
                    <option value="correction">Correction</option>
                    <option value="stock_in">Stock in</option>
                    <option value="return">Return</option>
                    <option value="damage">Damage</option>
                    <option value="expired">Expired</option>
                    <option value="owner_use">Owner use</option>
                  </select>
                </div>
                <input
                  value={adjustmentNote}
                  onChange={(event) => setAdjustmentNote(event.target.value)}
                  placeholder="Reason note"
                  className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white outline-none focus:border-emerald-400"
                />
                <button
                  onClick={handleStockAdjustment}
                  disabled={
                    !adjustmentProductId ||
                    !Number.isFinite(Number(adjustmentQty)) ||
                    Number(adjustmentQty) === 0 ||
                    isSubmitting
                  }
                  className="min-h-11 w-full rounded-lg border border-neutral-700 px-3 text-sm font-bold text-neutral-200 hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Record Movement
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3">
              <p className="text-sm font-semibold text-amber-200">
                Offline / Sync
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-amber-100">
                <div>
                  <p className="text-xs text-amber-200/70">Status</p>
                  <p className="font-semibold">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-amber-200/70">Queued</p>
                  <p className="font-semibold">{queueSummary.queued}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-200/70">Failed</p>
                  <p className="font-semibold">{queueSummary.failed}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-200/70">Synced</p>
                  <p className="font-semibold">{queueSummary.synced}</p>
                </div>
              </div>
              <button
                onClick={handleRetrySync}
                disabled={
                  isSubmitting ||
                  (!queueSummary.queued && !queueSummary.failed) ||
                  !isOnline
                }
                className="mt-3 min-h-11 w-full rounded-lg border border-amber-400/60 px-3 text-sm font-bold text-amber-100 hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Retry Sync
              </button>
            </div>

            {whoOwes.length > 0 && (
              <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <p className="mb-2 text-sm font-semibold text-white">
                  Who Owes
                </p>
                <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {whoOwes.slice(0, 5).map((customer) => (
                    <button
                      key={customer.customer_id}
                      onClick={() =>
                        setSelectedCustomerId(String(customer.customer_id))
                      }
                      className="flex min-h-11 w-full items-center justify-between rounded-lg border border-neutral-800 px-3 text-left hover:border-amber-400"
                    >
                      <span className="truncate text-sm text-neutral-200">
                        {customer.name}
                      </span>
                      <span className="text-sm font-bold text-amber-200">
                        {formatCurrency(customer.balance)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>

      {orderForReceipt && (
        <InvoiceModal
          orderId={orderForReceipt}
          onClose={() => setOrderForReceipt(null)}
        />
      )}
    </main>
  );
};

export default CounterDashboard;
