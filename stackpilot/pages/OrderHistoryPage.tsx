import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CashIcon,
  CreditCardIcon,
  DocumentDuplicateIcon,
} from "../components/icons";
import InvoiceModal from "../components/InvoiceModal";
import { useFormatters } from "../format";
import { useAuth } from "../context/AuthContext";
import { getOrderInvoice, OrderListItem, OrdersListRow } from "../utils/api";
import { useDebounce } from "../utils/hooks";

interface OrderItem {
  product: string;
  qty: number;
  price: number;
  total: number;
}

interface Order {
  order_id: number;
  order_date: string;
  sub_total: number;
  discount: number | null;
  total: number;
  status: string;
  items: OrderItem[];
  payment_method?: string;
}

type OrderSortKey = "order_id" | "order_date" | "items" | "total" | "payment";

const OrderHistoryPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<OrderSortKey>("order_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { formatCurrency, formatLocalDate } = useFormatters();

  // Debounce the search term - only triggers after user stops typing
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  /** Fetch all orders (list mode) */
  const fetchOrderHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      // call typed API: returns { data: (OrdersListRow | InvoiceRow)[] }
      const response = await getOrderInvoice({
        searchTerm: debouncedSearchTerm || undefined,
      });

      // response.data is (OrdersListRow | InvoiceRow)[]
      const firstRow = response.data?.[0] as OrdersListRow | undefined;

      // ordersJsonRaw can be:
      // - undefined (no rows)
      // - a string (JSON text)
      // - already-parsed array (OrderListItem[])
      const ordersJsonRaw = firstRow?.orders_json ?? response.data;

      let parsedOrders: OrderListItem[] = [];

      if (!ordersJsonRaw) {
        parsedOrders = [];
      } else if (typeof ordersJsonRaw === "string") {
        // parse string JSON
        try {
          parsedOrders = JSON.parse(ordersJsonRaw) as OrderListItem[];
        } catch (parseErr) {
          // console.error("Failed to parse orders_json string:", parseErr);
          parsedOrders = [];
        }
      } else if (Array.isArray(ordersJsonRaw)) {
        parsedOrders = ordersJsonRaw as OrderListItem[];
      } else {
        parsedOrders = [];
      }

      setOrders(parsedOrders);
    } catch (err: any) {
      // console.error("Failed to fetch order history:", err);
      setError(err?.message || "Failed to fetch order history.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, debouncedSearchTerm]);

  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, paymentFilter, dateFrom, dateTo, sortKey, sortDirection]);

  const visibleOrders = useMemo(() => {
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;

    const filtered = orders.filter((order) => {
      const orderTime = new Date(order.order_date).getTime();
      const method = (order.payment_method || "").toLowerCase();

      if (paymentFilter && method !== paymentFilter) return false;
      if (fromTime !== null && orderTime < fromTime) return false;
      if (toTime !== null && orderTime > toTime) return false;
      return true;
    });

    const getSortValue = (order: Order) => {
      switch (sortKey) {
        case "order_id":
          return order.order_id;
        case "items":
          return order.items?.length || 0;
        case "total":
          return Number(order.total || 0);
        case "payment":
          return order.payment_method || "";
        case "order_date":
        default:
          return new Date(order.order_date).getTime();
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
  }, [dateFrom, dateTo, orders, paymentFilter, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(visibleOrders.length / pageSize));
  const pagedOrders = useMemo(
    () => visibleOrders.slice((page - 1) * pageSize, page * pageSize),
    [page, visibleOrders]
  );

  const handleSort = (key: OrderSortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "order_date" ? "desc" : "asc");
  };

  const renderSortHeader = (
    key: OrderSortKey,
    label: string,
    className = ""
  ) => {
    const isActive = sortKey === key;
    return (
      <th
        scope="col"
        className={className}
        aria-sort={
          isActive
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <button
          type="button"
          onClick={() => handleSort(key)}
          className={`flex w-full items-center gap-1 text-left ${
            className.includes("text-center")
              ? "justify-center"
              : className.includes("text-right")
              ? "justify-end"
              : ""
          }`}
        >
          <span>{label}</span>
          <span className="text-[0.65rem] text-faint">
            {isActive ? (sortDirection === "asc" ? "^" : "v") : ""}
          </span>
        </button>
      </th>
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPaymentFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const exportOrdersCsv = () => {
    const headers = [
      "Order ID",
      "Date",
      "Items",
      "Subtotal",
      "Discount",
      "Total",
      "Payment Method",
      "Status",
    ];
    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = visibleOrders.map((order) => [
      order.order_id,
      order.order_date,
      order.items?.map((item) => `${item.product} x${item.qty}`).join("; ") || "",
      order.sub_total,
      order.discount || 0,
      order.total,
      order.payment_method || "",
      order.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleViewReceipt = (order: Order) => {
    setViewingOrder(order);
  };

  const handleCloseReceipt = () => {
    setViewingOrder(null);
  };

  if (loading && orders.length === 0) {
    return (
      <main className="page">
        <div className="page-inner flex min-h-[60vh] items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-peso"></div>
          <p className="text-sm text-muted">Loading order history…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="page-inner flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div>
            <p className="font-display text-lg font-semibold text-ink">Hindi ma-load ang benta</p>
            <p className="mt-1 text-sm text-danger">{error}</p>
          </div>
          <button onClick={fetchOrderHistory} className="btn btn-primary">
            Subukan ulit
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-inner space-y-4 lg:space-y-5">
        <header className="pl-12 lg:pl-0">
          <p className="eyebrow">Benta</p>
          <h1 className="page-title mt-1">Order history</h1>
          <p className="mt-1 text-sm text-muted">Review past transactions and reprint resibo.</p>
        </header>

        <div className="card p-4 lg:p-5 animate-fade-in">
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_repeat(4,minmax(140px,auto))]">
            <input
              type="text"
              placeholder="Search by order ID or product name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="field"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="field"
              aria-label="Date from"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="field"
              aria-label="Date to"
            />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="field"
            >
              <option value="">All payments</option>
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="utang">Utang</option>
            </select>
            <button
              type="button"
              onClick={exportOrdersCsv}
              disabled={visibleOrders.length === 0}
              className="btn btn-ghost"
            >
              Export CSV
            </button>
          </div>

          {(searchTerm || paymentFilter || dateFrom || dateTo) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase text-faint">
                Active filters
              </span>
              {searchTerm && <span className="pill pill-muted">Search</span>}
              {dateFrom && <span className="pill pill-muted">From {dateFrom}</span>}
              {dateTo && <span className="pill pill-muted">To {dateTo}</span>}
              {paymentFilter && (
                <span className="pill pill-muted capitalize">{paymentFilter}</span>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-peso hover:text-peso-deep"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="relative max-h-[calc(100vh-280px)] overflow-x-auto">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-peso"></div>
              </div>
            )}
            <table className="data-table">
              <thead className="sticky top-0">
                <tr>
                  {renderSortHeader("order_id", "Order ID")}
                  {renderSortHeader("order_date", "Date")}
                  {renderSortHeader("items", "Items")}
                  {renderSortHeader("total", "Total", "text-right")}
                  {renderSortHeader("payment", "Payment", "text-center")}
                  <th scope="col" className="text-center">Resibo</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-sm font-semibold text-muted">
                        {searchTerm || paymentFilter || dateFrom || dateTo
                          ? "Walang tugmang order"
                          : "Wala pang benta"}
                      </p>
                      <p className="mt-1 text-xs text-faint">
                        {searchTerm
                          ? "Try a different order ID or product name."
                          : "Recorded sales will show up here."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  pagedOrders.map((order) => {
                    const method = (order.payment_method || "").toLowerCase();
                    const pillClass =
                      method === "cash"
                        ? "pill pill-ok"
                        : method === "gcash"
                        ? "pill bg-gcash-tint text-gcash"
                        : method === "utang"
                        ? "pill pill-warn"
                        : "pill pill-muted";
                    return (
                      <tr key={order.order_id}>
                        <td className="money text-xs text-muted">
                          #{order.order_id}
                        </td>
                        <td className="text-muted">
                          {formatLocalDate(order.order_date)}
                        </td>
                        <td className="text-ink">
                          {order.items
                            ?.map((i) => `${i.product} (x${i.qty})`)
                            .join(", ") || "—"}
                        </td>
                        <td className="money text-right font-bold text-ink">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="text-center">
                          <span className={pillClass}>
                            {method === "cash" ? (
                              <CashIcon className="h-4 w-4" />
                            ) : (
                              <CreditCardIcon className="h-4 w-4" />
                            )}
                            <span className="capitalize">
                              {order.payment_method || "—"}
                            </span>
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => handleViewReceipt(order)}
                            className="btn btn-ghost mx-auto min-h-11 min-w-11 px-0"
                            aria-label="View resibo"
                          >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {visibleOrders.length > pageSize && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-sm text-muted">
              <span>
                Showing {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, visibleOrders.length)} of{" "}
                {visibleOrders.length}
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

      {viewingOrder && (
        <InvoiceModal orderId={viewingOrder.order_id} onClose={handleCloseReceipt} />
      )}
    </main>
  );
};

export default OrderHistoryPage;
