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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        <p className="ml-3 text-sky-400">Loading order history...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center text-red-400">
        <p>Error: {error}</p>
        <button
          onClick={fetchOrderHistory}
          className="ml-4 px-4 py-2 bg-sky-600 text-white rounded-md"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Order History
        </h1>
        <p className="text-gray-400">Review past transactions.</p>
      </header>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by Order ID or Product Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto max-h-[calc(100vh-280px)] relative">
          {loading && (
            <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          )}
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-700/50 sticky top-0 backdrop-blur-sm">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Items
                </th>
                <th scope="col" className="px-6 py-3">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b border-gray-700 hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-sky-400">
                      {order.order_id}
                    </td>
                    <td className="px-6 py-4">
                      {formatLocalDate(order.order_date)}
                    </td>
                    <td className="px-6 py-4">
                      {order.items
                        ?.map((i) => `${i.product} (x${i.qty})`)
                        .join(", ") || "N/A"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {order.payment_method === "cash" ? (
                          <CashIcon className="w-5 h-5" />
                        ) : (
                          <CreditCardIcon className="w-5 h-5" />
                        )}
                        <span className="capitalize">
                          {order.payment_method || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewReceipt(order)}
                        className="p-2 text-sky-400 rounded-full hover:bg-sky-400/10 transition-colors duration-200"
                        aria-label="View receipt"
                      >
                        <DocumentDuplicateIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingOrder && (
        <InvoiceModal orderId={viewingOrder.order_id} onClose={handleCloseReceipt} />
      )}
    </main>
  );
};

export default OrderHistoryPage;