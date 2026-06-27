import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingCartIcon } from "../components/icons";
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
  ProcessOrderPayload,
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
  const [gcashSales, setGcashSales] = useState(0);
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

  const utangOwed = useMemo(
    () => whoOwes.reduce((sum, customer) => sum + Number(customer.balance || 0), 0),
    [whoOwes]
  );

  const pendingSync = queueSummary.queued + queueSummary.failed;

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

  const buildOrderPayload = (
    paymentMethod: "cash" | "gcash"
  ): ProcessOrderPayload => ({
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
      const payload = buildOrderPayload(paymentMethod);

      if (!isOnline) {
        await queueOfflineMutation({
          entity_type: "sale",
          operation_type: "create",
          endpoint: "/orders/process",
          method: "POST",
          payload: { payload },
        });
        setTodaySales((current) => current + subtotal);
        if (paymentMethod === "cash") {
          setExpectedCash((current) => current + subtotal);
        } else {
          setGcashSales((current) => current + subtotal);
        }
        setCart([]);
        setActionStatus(`${paymentMethod.toUpperCase()} sale queued offline.`);
        await refreshQueueSummary();
        return;
      }

      const response = await processOrderPOS(payload);
      const orderId = response.data?.order_id;

      setTodaySales((current) => current + subtotal);
      if (paymentMethod === "cash") {
        setExpectedCash((current) => current + subtotal);
      } else {
        setGcashSales((current) => current + subtotal);
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
      const payload = {
        product_id: Number(adjustmentProductId),
        quantity_delta: quantityDelta,
        reason: adjustmentReason,
        source_type: "counter_adjustment",
        note: adjustmentNote || null,
      };

      if (!isOnline) {
        await queueOfflineMutation({
          entity_type: "stock_movement",
          operation_type: "create",
          endpoint: "/stock-movements",
          method: "POST",
          payload,
        });
        setAdjustmentProductId("");
        setAdjustmentQty("");
        setAdjustmentReason("correction");
        setAdjustmentNote("");
        setActionStatus("Stock movement queued offline.");
        await refreshQueueSummary();
        return;
      }

      await createStockMovement(payload);
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

  const kitaCells: { label: string; value: string; tone: string }[] = [
    { label: "Benta ngayon", value: formatCurrency(todaySales), tone: "text-peso" },
    { label: "Cash sa kahon", value: formatCurrency(expectedCash), tone: "text-ink" },
    { label: "GCash", value: formatCurrency(gcashSales), tone: "text-gcash" },
    { label: "Utang (open)", value: formatCurrency(utangOwed), tone: "text-utang" },
  ];

  return (
    <main className="page">
      <div className="page-inner space-y-4 lg:space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-3 pl-12 lg:pl-0">
          <div>
            <p className="eyebrow">{store?.name || "Your store"}</p>
            <h1 className="page-title mt-1">Counter</h1>
          </div>
          <button
            type="button"
            onClick={() => setActivePage("legacy_pos")}
            className="btn btn-ghost"
          >
            Legacy POS
          </button>
        </header>

        {/* Kita Bar — the money truth, beside the sync state that protects it */}
        <section className="card animate-fade-in overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {kitaCells.map((cell) => (
              <div
                key={cell.label}
                className="flex-1 border-b border-line p-4 last:border-b-0 lg:border-b-0 lg:border-r"
              >
                <p className="eyebrow">{cell.label}</p>
                <p className={`money mt-1.5 text-2xl font-bold lg:text-[1.7rem] ${cell.tone}`}>
                  {cell.value}
                </p>
              </div>
            ))}
            <div className="flex flex-1 items-center justify-between gap-3 p-4">
              <div>
                <p className="eyebrow">Sync</p>
                <p className="mt-1.5 font-display text-base font-semibold text-ink">
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
              <span className={`pill ${pendingSync ? "pill-warn" : "pill-ok"}`}>
                <span className="pill-dot" />
                {pendingSync ? `${pendingSync} pending` : "All synced"}
              </span>
            </div>
          </div>
        </section>

        {/* Three-column counter */}
        <section className="grid gap-4 xl:grid-cols-[minmax(320px,1.1fr)_minmax(360px,1fr)_minmax(300px,0.78fr)]">
          {/* Products */}
          <div className="card flex min-h-[620px] flex-col p-4 lg:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Mga produkto
                </h2>
                <p className="text-sm text-muted">
                  {loading ? "Loading items…" : `${products.length} in stock`}
                </p>
              </div>
            </div>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, SKU, or barcode"
              className="field mb-4 min-h-12"
            />

            {error && (
              <div className="mb-4 rounded-xl border border-danger/30 bg-danger-tint px-3.5 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pr-1">
              {products.map((product) => (
                <button
                  key={product.product_id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="flex min-h-[104px] flex-col justify-between rounded-xl border border-line bg-surface p-3 text-left transition hover:border-peso hover:shadow-card active:scale-[0.99]"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-ink">
                    {product.name}
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span className="text-xs text-faint">Stock {product.stock}</span>
                    <span className="money text-base font-bold text-peso">
                      {formatCurrency(product.selling_price)}
                    </span>
                  </div>
                </button>
              ))}

              {!loading && products.length === 0 && (
                <div className="col-span-full flex min-h-[260px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-center">
                  <p className="text-sm font-semibold text-muted">No products found</p>
                  <p className="text-xs text-faint">
                    Try another search, or add stock in Inventory.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Current Sale */}
          <div className="card flex min-h-[620px] flex-col p-4 lg:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Current sale
                </h2>
                <p className="text-sm text-muted">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in cart
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="btn btn-ghost"
              >
                Clear
              </button>
            </div>

            {(actionStatus || actionError) && (
              <div
                className={`mb-4 rounded-xl border px-3.5 py-3 text-sm ${
                  actionError
                    ? "border-danger/30 bg-danger-tint text-danger"
                    : "border-peso/30 bg-peso-tint text-peso-deep"
                }`}
              >
                {actionError || actionStatus}
              </div>
            )}

            <div className="mb-4 max-h-[280px] space-y-2.5 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="rounded-xl border border-line bg-surface p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {item.product_name}
                      </p>
                      <p className="money text-sm text-muted">
                        {formatCurrency(item.price_at_sale)}
                      </p>
                    </div>
                    <p className="money font-bold text-ink">
                      {formatCurrency(item.price_at_sale * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center overflow-hidden rounded-xl border border-line">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="flex min-h-11 min-w-11 items-center justify-center text-xl text-ink hover:bg-sunken"
                        aria-label={`Less ${item.product_name}`}
                      >
                        −
                      </button>
                      <span className="money min-w-12 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="flex min-h-11 min-w-11 items-center justify-center text-xl text-ink hover:bg-sunken"
                        aria-label={`More ${item.product_name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-faint">Max {item.stock}</span>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-center">
                  <p className="text-sm font-semibold text-muted">Cart is empty</p>
                  <p className="text-xs text-faint">Tap a product to start a sale.</p>
                </div>
              )}
            </div>

            {/* Suki / utang controls */}
            <div className="card-sunken mb-4 p-3">
              <p className="eyebrow mb-2.5">Suki ledger</p>
              <div className="mb-2.5 grid grid-cols-[1fr_auto] gap-2">
                <select
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  className="field field-sm"
                >
                  <option value="">Pumili ng suki (utang / bayad)</option>
                  {customers.map((customer) => (
                    <option key={customer.customer_id} value={customer.customer_id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <div className="flex min-w-[110px] flex-col justify-center rounded-xl border border-line bg-surface px-3 py-1.5 text-right">
                  <span className="text-[0.65rem] font-medium text-muted">Balance</span>
                  <span className="money text-sm font-bold text-utang">
                    {formatCurrency(customerBalance?.balance ?? 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  value={newCustomerName}
                  onChange={(event) => setNewCustomerName(event.target.value)}
                  placeholder="New suki name"
                  className="field field-sm"
                />
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={newCustomerPhone}
                    onChange={(event) => setNewCustomerPhone(event.target.value)}
                    placeholder="Phone"
                    className="field field-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomer}
                    disabled={!newCustomerName.trim() || isSubmitting}
                    className="btn btn-ghost px-4"
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
                  className="field field-sm"
                />
                <input
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="Bayad ₱"
                  inputMode="decimal"
                  className="field field-sm"
                />
              </div>
            </div>

            {/* Totals + actions */}
            <div className="mt-auto rounded-xl border border-line bg-surface p-4">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted">Total</span>
                <span className="money text-3xl font-bold text-ink">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSale("cash")}
                  disabled={cart.length === 0 || isSubmitting}
                  className="btn btn-primary btn-lg"
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => handleSale("gcash")}
                  disabled={cart.length === 0 || isSubmitting}
                  className="btn btn-gcash btn-lg"
                >
                  GCash
                </button>
                <button
                  type="button"
                  onClick={handleUtang}
                  disabled={cart.length === 0 || !selectedCustomerId || isSubmitting}
                  className="btn btn-utang btn-lg"
                >
                  Utang
                </button>
              </div>
              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={
                  !selectedCustomerId ||
                  !Number.isFinite(Number(paymentAmount)) ||
                  Number(paymentAmount) <= 0 ||
                  isSubmitting
                }
                className="btn btn-outline mt-2 w-full"
              >
                Record bayad
              </button>
              {selectedCustomer && (
                <p className="mt-2 text-xs text-faint">
                  Suki: {selectedCustomer.name}
                </p>
              )}
            </div>
          </div>

          {/* Owner panel */}
          <aside className="flex min-h-[620px] flex-col gap-4">
            <div className="card p-4 lg:p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-peso-tint text-peso">
                  <ShoppingCartIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">
                    Owner panel
                  </h2>
                  <p className="text-sm text-muted">Today at a glance</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="stat">
                  <p className="stat-label">Benta</p>
                  <p className="stat-value text-peso">{formatCurrency(todaySales)}</p>
                  <p className="stat-sub">Sales this session</p>
                </div>
                <div className="stat">
                  <p className="stat-label">Cash sa kahon</p>
                  <p className="stat-value">{formatCurrency(expectedCash)}</p>
                  <p className="stat-sub">Cash + bayad</p>
                </div>
                <div className="stat">
                  <p className="stat-label">Paubos</p>
                  <p className="stat-value">0</p>
                  <p className="stat-sub">Low-stock items</p>
                </div>
                <div className="stat">
                  <p className="stat-label">May utang</p>
                  <p className="stat-value text-utang">{whoOwes.length}</p>
                  <p className="stat-sub">
                    {whoOwes.length
                      ? `${whoOwes[0].name}: ${formatCurrency(whoOwes[0].balance)}`
                      : "No open balances"}
                  </p>
                </div>
              </div>
            </div>

            {/* Cash session */}
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-base font-semibold text-ink">
                    Cash session
                  </p>
                  <p className="text-xs text-faint">
                    {cashSession
                      ? `Open · #${cashSession.cash_session_id}`
                      : "No open session"}
                  </p>
                </div>
                <span className={`pill ${cashSession ? "pill-ok" : "pill-muted"}`}>
                  <span className="pill-dot" />
                  {cashSession ? "Open" : "Closed"}
                </span>
              </div>

              {cashSession ? (
                <div className="space-y-2">
                  <input
                    value={actualCash}
                    onChange={(event) => setActualCash(event.target.value)}
                    placeholder="Bilang ng cash (actual)"
                    inputMode="decimal"
                    className="field field-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCloseCashSession}
                    disabled={
                      !Number.isFinite(Number(actualCash)) ||
                      Number(actualCash) < 0 ||
                      isSubmitting
                    }
                    className="btn btn-primary w-full"
                  >
                    Close session
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={openingCash}
                    onChange={(event) => setOpeningCash(event.target.value)}
                    placeholder="Opening cash"
                    inputMode="decimal"
                    className="field field-sm"
                  />
                  <button
                    type="button"
                    onClick={handleOpenCashSession}
                    disabled={
                      !Number.isFinite(Number(openingCash || 0)) ||
                      Number(openingCash || 0) < 0 ||
                      isSubmitting
                    }
                    className="btn btn-ghost px-4"
                  >
                    Open
                  </button>
                </div>
              )}
            </div>

            {/* Stock adjustment */}
            <div className="card p-4">
              <p className="font-display text-base font-semibold text-ink">
                Stock adjustment
              </p>
              <p className="mb-3 text-xs text-faint">
                Record a movement with a reason.
              </p>
              <div className="space-y-2">
                <select
                  value={adjustmentProductId}
                  onChange={(event) => setAdjustmentProductId(event.target.value)}
                  className="field field-sm"
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
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
                    className="field field-sm"
                  />
                  <select
                    value={adjustmentReason}
                    onChange={(event) =>
                      setAdjustmentReason(event.target.value as StockMovementReason)
                    }
                    className="field field-sm"
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
                  className="field field-sm"
                />
                <button
                  type="button"
                  onClick={handleStockAdjustment}
                  disabled={
                    !adjustmentProductId ||
                    !Number.isFinite(Number(adjustmentQty)) ||
                    Number(adjustmentQty) === 0 ||
                    isSubmitting
                  }
                  className="btn btn-ghost w-full"
                >
                  Record movement
                </button>
              </div>
            </div>

            {/* Offline / sync */}
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-semibold text-ink">
                  Offline &amp; sync
                </p>
                <span className={`pill ${isOnline ? "pill-ok" : "pill-warn"}`}>
                  <span className="pill-dot" />
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Queued", queueSummary.queued],
                  ["Failed", queueSummary.failed],
                  ["Synced", queueSummary.synced],
                ].map(([label, value]) => (
                  <div key={label} className="card-sunken py-2.5">
                    <p className="money text-lg font-bold text-ink">{value}</p>
                    <p className="text-[0.65rem] font-medium text-muted">{label}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRetrySync}
                disabled={isSubmitting || (!queueSummary.queued && !queueSummary.failed) || !isOnline}
                className="btn btn-ghost mt-3 w-full"
              >
                Retry sync
              </button>
            </div>

            {/* Who owes */}
            {whoOwes.length > 0 && (
              <div className="card p-4">
                <p className="font-display text-base font-semibold text-ink">
                  Sino may utang
                </p>
                <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                  {whoOwes.slice(0, 6).map((customer) => (
                    <button
                      key={customer.customer_id}
                      type="button"
                      onClick={() => setSelectedCustomerId(String(customer.customer_id))}
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-line px-3 text-left transition hover:border-utang hover:bg-utang-tint/40"
                    >
                      <span className="truncate text-sm text-ink">{customer.name}</span>
                      <span className="money text-sm font-bold text-utang">
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
