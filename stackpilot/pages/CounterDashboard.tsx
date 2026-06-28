import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CashDrawerSheet from "../components/counter/CashDrawerSheet";
import ChargeSheet from "../components/counter/ChargeSheet";
import CounterTopBar, {
  CounterOverlay,
} from "../components/counter/CounterTopBar";
import { SheetStatusState } from "../components/counter/SheetStatus";
import StockAdjustSheet from "../components/counter/StockAdjustSheet";
import SyncSheet from "../components/counter/SyncSheet";
import WhoOwesDrawer from "../components/counter/WhoOwesDrawer";
import InvoiceModal from "../components/InvoiceModal";
import { useAuth } from "../context/AuthContext";
import { useFormatters } from "../format";
import {
  cacheCustomers,
  cacheProducts,
  readCachedCustomers,
  readCachedProducts,
} from "../offline/cache";
import {
  discardSyncQueueItem,
  listFailedSyncQueue,
  getSyncQueueSummary,
  queueOfflineMutation,
  retrySyncQueue,
  SyncQueueItem,
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

interface ActionResult {
  ok: boolean;
  error?: string;
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
  const [chargeCustomerId, setChargeCustomerId] = useState("");
  const [paymentCustomerId, setPaymentCustomerId] = useState("");
  const [chargeCustomerBalance, setChargeCustomerBalance] =
    useState<CustomerBalance | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [chargeNote, setChargeNote] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [chargeStatus, setChargeStatus] = useState<SheetStatusState>({});
  const [cashDrawerStatus, setCashDrawerStatus] = useState<SheetStatusState>({});
  const [stockStatus, setStockStatus] = useState<SheetStatusState>({});
  const [syncStatus, setSyncStatus] = useState<SheetStatusState>({});
  const [whoOwesStatus, setWhoOwesStatus] = useState<SheetStatusState>({});
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderForReceipt, setOrderForReceipt] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<CounterOverlay>("none");
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
    conflict: 0,
    total: 0,
  });
  const [failedSyncItems, setFailedSyncItems] = useState<SyncQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastAutoAddedBarcode = useRef<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cachedProducts = await readCachedProducts();
      if (cachedProducts.length > 0) {
        setProducts(
          cachedProducts
            .filter((product) => product.stock > 0)
            .filter((product) => {
              const term = debouncedSearchTerm.trim().toLowerCase();
              if (!term) return true;
              return (
                product.name.toLowerCase().includes(term) ||
                String(product.sku || "").toLowerCase().includes(term) ||
                String(product.barcode || "").toLowerCase().includes(term)
              );
            })
        );
      }

      const response = await getProducts({
        search: debouncedSearchTerm || undefined,
      });
      const networkProducts = (response.data || []).filter(
        (product) => product.stock > 0
      );
      setProducts(networkProducts);
      await cacheProducts(response.data || []);
    } catch (err: any) {
      const cachedProducts = await readCachedProducts();
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts.filter((product) => product.stock > 0));
        setError(null);
      } else {
        setError(err.message || "Unable to load products.");
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refreshLedger = useCallback(async () => {
    const cachedCustomers = await readCachedCustomers();
    if (cachedCustomers.length > 0) {
      setCustomers(cachedCustomers);
    }

    const [customersResponse, whoOwesResponse] = await Promise.all([
      getCustomers(),
      getWhoOwes(),
    ]);

    setCustomers(customersResponse.data || []);
    await cacheCustomers(customersResponse.data || []);
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
    const [summary, failedItems] = await Promise.all([
      getSyncQueueSummary(),
      listFailedSyncQueue(),
    ]);
    setQueueSummary(summary);
    setFailedSyncItems(failedItems);
  }, []);

  useEffect(() => {
    refreshQueueSummary().catch(() => undefined);

    const handleOnline = () => {
      setIsOnline(true);
      retrySyncQueue()
        .then(refreshQueueSummary)
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
    if (!chargeCustomerId) {
      setChargeCustomerBalance(null);
      return;
    }

    getCustomerBalance(Number(chargeCustomerId))
      .then((response) => setChargeCustomerBalance(response.data))
      .catch((err: any) => {
        setActionError(err.message || "Unable to load customer balance.");
      });
  }, [chargeCustomerId]);

  useEffect(() => {
    if (overlay === "charge" && cart.length === 0) {
      setOverlay("none");
    }
  }, [cart.length, overlay]);

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

  const utangOwed = useMemo(
    () => whoOwes.reduce((sum, customer) => sum + Number(customer.balance || 0), 0),
    [whoOwes]
  );

  const pendingSync =
    queueSummary.queued + queueSummary.failed + queueSummary.conflict;
  const firstSearchResult = products[0];

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
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  useEffect(() => {
    const term = debouncedSearchTerm.trim();
    if (!term || lastAutoAddedBarcode.current === term) return;

    const exactBarcodeMatch = products.find(
      (product) => String(product.barcode || "").trim() === term
    );

    if (!exactBarcodeMatch) return;

    lastAutoAddedBarcode.current = term;
    addToCart(exactBarcodeMatch);
    setSearchTerm("");
  }, [debouncedSearchTerm, products]);

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
    if (chargeCustomerId) {
      const balanceResponse = await getCustomerBalance(Number(chargeCustomerId));
      setChargeCustomerBalance(balanceResponse.data);
    }
  };

  const closeOverlay = () => {
    if (overlay === "charge") {
      setNewCustomerName("");
      setNewCustomerPhone("");
      setChargeStatus({});
    }
    if (overlay === "whoOwes") {
      setPaymentAmount("");
      setPaymentNote("");
      setWhoOwesStatus({});
    }
    if (overlay === "cashDrawer") setCashDrawerStatus({});
    if (overlay === "stock") setStockStatus({});
    if (overlay === "sync") setSyncStatus({});
    setOverlay("none");
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
    if (cart.length === 0 || isSubmitting) {
      return { ok: false, error: "Cart is empty." };
    }

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
        return { ok: true };
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
      return { ok: true };
    } catch (err: any) {
      const message = err.message || "Unable to process sale.";
      setActionError(message);
      return { ok: false, error: message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim() || isSubmitting) return false;

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      const payload = {
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || null,
      };

      if (!isOnline) {
        await queueOfflineMutation({
          entity_type: "customer",
          operation_type: "create",
          endpoint: "/customers",
          method: "POST",
          payload,
        });
        setNewCustomerName("");
        setNewCustomerPhone("");
        setActionStatus("Customer queued offline.");
        await refreshQueueSummary();
        return true;
      }

      const response = await createCustomer(payload);
      await refreshLedger();
      setChargeCustomerId(String(response.data.customer_id));
      setNewCustomerName("");
      setNewCustomerPhone("");
      setActionStatus("Customer added.");
      return true;
    } catch (err: any) {
      setActionError(err.message || "Unable to create customer.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUtang = async () => {
    if (cart.length === 0 || !chargeCustomerId || isSubmitting) return false;

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      const payload = {
        customer_id: Number(chargeCustomerId),
        amount: subtotal,
        note: chargeNote || "Counter credit sale",
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
        setChargeNote("");
        setActionStatus("Utang queued offline.");
        await refreshQueueSummary();
        return true;
      }

      await createUtang({
        ...payload,
      });

      setCart([]);
      setChargeNote("");
      setActionStatus("Utang added to customer balance.");
      await reloadCounterData();
      return true;
    } catch (err: any) {
      setActionError(err.message || "Unable to create utang entry.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    const amount = Number(paymentAmount);
    if (!paymentCustomerId || !Number.isFinite(amount) || amount <= 0) return false;

    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      const payload = {
        customer_id: Number(paymentCustomerId),
        amount,
        method: "cash" as const,
        note: paymentNote || null,
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
        setPaymentNote("");
        setActionStatus("Payment queued offline.");
        await refreshQueueSummary();
        return true;
      }

      await recordPayment({
        ...payload,
      });

      setExpectedCash((current) => current + amount);
      setPaymentAmount("");
      setPaymentNote("");
      setActionStatus("Payment recorded.");
      await reloadCounterData();
      return true;
    } catch (err: any) {
      setActionError(err.message || "Unable to record payment.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetrySync = async () => {
    setIsSubmitting(true);
    setActionError(null);
    setActionStatus(null);

    try {
      await retrySyncQueue();
      await refreshQueueSummary();
      setActionStatus("Sync retry finished.");
      await reloadCounterData();
      return true;
    } catch (err: any) {
      setActionError(err.message || "Unable to retry sync queue.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCashSession = async () => {
    const openingAmount = Number(openingCash || 0);
    if (!Number.isFinite(openingAmount) || openingAmount < 0 || isSubmitting) {
      return false;
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
      return true;
    } catch (err: any) {
      setActionError(err.message || "Unable to open cash session.");
      return false;
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
      return false;
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
      return true;
    } catch (err: any) {
      setActionError(err.message || "Unable to close cash session.");
      return false;
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
      return false;
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
        return true;
      }

      await createStockMovement(payload);
      setAdjustmentProductId("");
      setAdjustmentQty("");
      setAdjustmentReason("correction");
      setAdjustmentNote("");
      setActionStatus("Stock movement recorded.");
      await fetchProducts();
      return true;
    } catch (err: any) {
      setActionError(err.message || "Unable to record stock movement.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const chargeCash = async () => {
    setChargeStatus({ loading: "Recording cash sale..." });
    const result: ActionResult = await handleSale("cash");
    if (result.ok) {
      setChargeStatus({ success: "Cash sale recorded." });
      setOverlay("none");
    } else {
      setChargeStatus({ error: result.error || "Unable to record cash sale." });
    }
  };

  const chargeGcash = async () => {
    setChargeStatus({ loading: "Recording GCash sale..." });
    const result: ActionResult = await handleSale("gcash");
    if (result.ok) {
      setChargeStatus({ success: "GCash sale recorded." });
      setOverlay("none");
    } else {
      setChargeStatus({ error: result.error || "Unable to record GCash sale." });
    }
  };

  const chargeUtang = async () => {
    setChargeStatus({ loading: "Saving utang..." });
    const ok = await handleUtang();
    if (ok) {
      setChargeStatus({ success: "Utang added to customer balance." });
      setOverlay("none");
    } else {
      setChargeStatus({ error: "Unable to save utang." });
    }
  };

  const addCustomerFromCharge = async () => {
    setChargeStatus({ loading: "Adding suki..." });
    const ok = await handleCreateCustomer();
    setChargeStatus(
      ok
        ? { success: isOnline ? "Customer added." : "Customer queued offline." }
        : { error: "Unable to add customer." }
    );
  };

  const recordPaymentFromDrawer = async () => {
    setWhoOwesStatus({ loading: "Recording bayad..." });
    const ok = await handleRecordPayment();
    setWhoOwesStatus(ok ? { success: "Bayad recorded." } : { error: "Unable to record bayad." });
  };

  const openCashSessionFromSheet = async () => {
    setCashDrawerStatus({ loading: "Starting cash session..." });
    const ok = await handleOpenCashSession();
    setCashDrawerStatus(ok ? { success: "Cash session started." } : { error: "Unable to start cash session." });
  };

  const closeCashSessionFromSheet = async () => {
    setCashDrawerStatus({ loading: "Closing cash session..." });
    const difference = Number(actualCash) - expectedCash;
    const ok = await handleCloseCashSession();
    setCashDrawerStatus(
      ok
        ? { success: `Cash session closed. Difference: ${formatCurrency(difference)}` }
        : { error: "Unable to close cash session." }
    );
  };

  const saveStockChangeFromSheet = async () => {
    setStockStatus({ loading: "Saving stock change..." });
    const ok = await handleStockAdjustment();
    setStockStatus(ok ? { success: "Stock change saved." } : { error: "Unable to save stock change." });
  };

  const retrySyncFromSheet = async () => {
    setSyncStatus({ loading: "Retrying sync..." });
    const ok = await handleRetrySync();
    setSyncStatus(ok ? { success: "Sync retry finished." } : { error: "Unable to retry sync." });
  };

  const discardSyncFromSheet = async (localId: string) => {
    setSyncStatus({ loading: "Discarding sync item..." });
    try {
      const summary = await discardSyncQueueItem(localId);
      setQueueSummary(summary);
      setFailedSyncItems(await listFailedSyncQueue());
      setSyncStatus({ success: "Sync item discarded." });
    } catch (err: any) {
      setSyncStatus({ error: err.message || "Unable to discard sync item." });
    }
  };

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

        {/* Money truth + summon points */}
        <CounterTopBar
          todaySales={todaySales}
          expectedCash={expectedCash}
          gcashSales={gcashSales}
          utangOwed={utangOwed}
          isOnline={isOnline}
          pendingSync={pendingSync}
          formatCurrency={formatCurrency}
          onOpen={setOverlay}
        />

        {/* Two-column counter */}
        <section className="grid gap-4 xl:grid-cols-[minmax(360px,1.3fr)_minmax(340px,1fr)]">
          {/* Products */}
          <div className="card flex min-h-[520px] flex-col p-4 lg:min-h-[620px] lg:p-5">
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
              ref={searchInputRef}
              type="search"
              value={searchTerm}
              onChange={(event) => {
                lastAutoAddedBarcode.current = null;
                setSearchTerm(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && firstSearchResult) {
                  event.preventDefault();
                  const term = searchTerm.trim();
                  const exactBarcodeMatch = products.find(
                    (product) => String(product.barcode || "").trim() === term
                  );
                  addToCart(exactBarcodeMatch || firstSearchResult);
                  setSearchTerm("");
                }
              }}
              placeholder="Search name, SKU, or barcode"
              className="field mb-4 min-h-12"
            />

            {error && (
              <div className="mb-4 rounded-xl border border-danger/30 bg-danger-tint px-3.5 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
              {products.map((product) => (
                <button
                  key={product.product_id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="flex min-h-[104px] flex-col justify-between rounded-xl border border-line bg-surface p-3 text-left transition hover:border-peso hover:shadow-card active:scale-[0.99]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold text-ink">
                        {product.name}
                      </p>
                      {(product.stock_status === "Low Stock" || product.stock <= 5) && (
                        <span className="pill pill-warn flex-shrink-0 px-2 py-0.5 text-[0.65rem]">
                          Paubos
                        </span>
                      )}
                    </div>
                    {(product.sku || product.barcode || product.category_name) && (
                      <p className="mt-1 truncate text-xs text-faint">
                        {product.sku || product.barcode || product.category_name}
                      </p>
                    )}
                  </div>
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
          <div className="card flex min-h-[520px] flex-col p-4 lg:min-h-[620px] lg:p-5">
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

            <div className="mb-4 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
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

            {cart.length > 0 && (
              <div className="sticky bottom-0 mt-auto rounded-xl border border-line bg-surface p-4 shadow-card">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <span className="text-sm font-medium text-muted">Total</span>
                    <p className="text-xs text-faint">
                      {cart.length} lines Â· {itemCount} qty
                    </p>
                  </div>
                  <span className="money text-3xl font-bold text-ink">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOverlay("charge")}
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg w-full"
                >
                  Charge {formatCurrency(subtotal)}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <ChargeSheet
        isOpen={overlay === "charge"}
        onClose={closeOverlay}
        subtotal={subtotal}
        formatCurrency={formatCurrency}
        customers={customers}
        customerBalance={chargeCustomerBalance}
        chargeCustomerId={chargeCustomerId}
        setChargeCustomerId={setChargeCustomerId}
        newCustomerName={newCustomerName}
        setNewCustomerName={setNewCustomerName}
        newCustomerPhone={newCustomerPhone}
        setNewCustomerPhone={setNewCustomerPhone}
        chargeNote={chargeNote}
        setChargeNote={setChargeNote}
        status={chargeStatus}
        isSubmitting={isSubmitting}
        onCash={chargeCash}
        onGcash={chargeGcash}
        onUtang={chargeUtang}
        onCreateCustomer={addCustomerFromCharge}
      />
      <WhoOwesDrawer
        isOpen={overlay === "whoOwes"}
        onOpen={() => setOverlay("whoOwes")}
        onClose={closeOverlay}
        whoOwes={whoOwes}
        formatCurrency={formatCurrency}
        paymentCustomerId={paymentCustomerId}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentNote={paymentNote}
        setPaymentNote={setPaymentNote}
        setPaymentCustomerId={setPaymentCustomerId}
        status={whoOwesStatus}
        isSubmitting={isSubmitting}
        onRecordPayment={recordPaymentFromDrawer}
      />
      <CashDrawerSheet
        isOpen={overlay === "cashDrawer"}
        onClose={closeOverlay}
        cashSession={cashSession}
        openingCash={openingCash}
        setOpeningCash={setOpeningCash}
        actualCash={actualCash}
        setActualCash={setActualCash}
        expectedCash={expectedCash}
        todaySales={todaySales}
        owingCount={whoOwes.length}
        formatCurrency={formatCurrency}
        status={cashDrawerStatus}
        isSubmitting={isSubmitting}
        onOpenSession={openCashSessionFromSheet}
        onCloseSession={closeCashSessionFromSheet}
      />
      <StockAdjustSheet
        isOpen={overlay === "stock"}
        onClose={closeOverlay}
        products={products}
        adjustmentProductId={adjustmentProductId}
        setAdjustmentProductId={setAdjustmentProductId}
        adjustmentQty={adjustmentQty}
        setAdjustmentQty={setAdjustmentQty}
        adjustmentReason={adjustmentReason}
        setAdjustmentReason={setAdjustmentReason}
        adjustmentNote={adjustmentNote}
        setAdjustmentNote={setAdjustmentNote}
        formatCurrency={formatCurrency}
        status={stockStatus}
        isSubmitting={isSubmitting}
        onRecord={saveStockChangeFromSheet}
      />
      <SyncSheet
        isOpen={overlay === "sync"}
        onClose={closeOverlay}
        queueSummary={queueSummary}
        isOnline={isOnline}
        status={syncStatus}
        isSubmitting={isSubmitting}
        failedItems={failedSyncItems}
        onRetry={retrySyncFromSheet}
        onDiscard={discardSyncFromSheet}
      />

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
