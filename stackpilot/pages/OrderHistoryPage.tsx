import React, { useState, useEffect, useCallback } from "react";
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

const OrderHistoryPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

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
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by order ID or product name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="field max-w-md"
            />
          </div>

          <div className="relative max-h-[calc(100vh-280px)] overflow-x-auto">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-peso"></div>
              </div>
            )}
            <table className="data-table">
              <thead className="sticky top-0">
                <tr>
                  <th scope="col">Order ID</th>
                  <th scope="col">Date</th>
                  <th scope="col">Items</th>
                  <th scope="col">Total</th>
                  <th scope="col" className="text-center">Payment</th>
                  <th scope="col" className="text-center">Resibo</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-sm font-semibold text-muted">
                        {searchTerm ? "Walang tugmang order" : "Wala pang benta"}
                      </p>
                      <p className="mt-1 text-xs text-faint">
                        {searchTerm
                          ? "Try a different order ID or product name."
                          : "Recorded sales will show up here."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
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
                        <td className="money font-bold text-ink">
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
        </div>
      </div>

      {viewingOrder && (
        <InvoiceModal orderId={viewingOrder.order_id} onClose={handleCloseReceipt} />
      )}
    </main>
  );
};

export default OrderHistoryPage;