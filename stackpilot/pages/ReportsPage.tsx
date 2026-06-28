import React, { useState, useEffect, useMemo, useCallback } from "react";
import DashboardCard from "../components/DashboardCard";
import SalesChart from "../components/SalesChart";
import {
  ChartBarIcon,
  ShoppingCartIcon,
  PackageIcon,
} from "../components/icons";
import { useFormatters } from "../format";
import {
  getSalesReport,
  getCategories,
  getProducts,
  getOrderInvoice,
  Category,
  OrderListItem,
  OrdersListRow,
  Product,
  SalesReportResponse,
} from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../utils/hooks";

interface ReportsPageProps {
  // No props needed as data is fetched internally
}

type Timeframe = "today" | "week" | "month" | "year";
type Granularity = "minute" | "day";

interface ReportOrderItem {
  product: string;
  qty: number;
  price: number;
  total: number;
}

interface ReportOrder {
  order_id: number;
  order_date: string;
  total: number;
  payment_method?: string;
  items: ReportOrderItem[];
}

const ReportsPage: React.FC<ReportsPageProps> = () => {
  const { isAuthenticated } = useAuth();
  const [salesReport, setSalesReport] = useState<SalesReportResponse | null>(
    null
  );
  const [previousSalesReport, setPreviousSalesReport] =
    useState<SalesReportResponse | null>(null);
  const [reportOrders, setReportOrders] = useState<ReportOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");

  // Debounce filters to prevent excessive API calls
  const debouncedCategoryFilter = useDebounce(categoryFilter, 300);
  const debouncedProductFilter = useDebounce(productFilter, 300);

  const { formatCurrency } = useFormatters();

  const getDatesForTimeframe = (
    tf: Timeframe
  ): { startDate: string; endDate: string; granularity: Granularity } => {
    const now = new Date();
    let startDate: Date;
    let granularity: Granularity = "day";

    switch (tf) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        granularity = "minute";
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    const endDate = new Date();

    const format = (date: Date) => date.toISOString().split("T")[0];

    return {
      startDate: format(startDate),
      endDate: format(endDate),
      granularity,
    };
  };

  const getPreviousDatesForTimeframe = (
    tf: Timeframe
  ): { startDate: string; endDate: string; granularity: Granularity } => {
    const current = getDatesForTimeframe(tf);
    const currentStart = new Date(`${current.startDate}T00:00:00`);
    const currentEnd = new Date(`${current.endDate}T23:59:59`);
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.max(
      1,
      Math.ceil((currentEnd.getTime() - currentStart.getTime()) / dayMs)
    );
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - days + 1);
    const format = (date: Date) => date.toISOString().split("T")[0];

    return {
      startDate: format(previousStart),
      endDate: format(previousEnd),
      granularity: current.granularity,
    };
  };

  const fetchReportData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    const { startDate, endDate, granularity } = getDatesForTimeframe(timeframe);
    const previous = getPreviousDatesForTimeframe(timeframe);

    try {
      const [
        reportResponse,
        previousReportResponse,
        categoriesResponse,
        productsResponse,
        ordersResponse,
      ] =
        await Promise.all([
          getSalesReport(startDate, endDate, granularity, {
            category_id:
              debouncedCategoryFilter !== ""
                ? Number(debouncedCategoryFilter)
                : undefined,
            product_id:
              debouncedProductFilter !== ""
                ? Number(debouncedProductFilter)
                : undefined,
          }),
          getSalesReport(previous.startDate, previous.endDate, previous.granularity, {
            category_id:
              debouncedCategoryFilter !== ""
                ? Number(debouncedCategoryFilter)
                : undefined,
            product_id:
              debouncedProductFilter !== ""
                ? Number(debouncedProductFilter)
                : undefined,
          }),
          getCategories(),
          getProducts({
            category_id:
              debouncedCategoryFilter !== ""
                ? Number(debouncedCategoryFilter)
                : undefined,
          }),
          getOrderInvoice({}),
        ]);

      // console.log("Sales report response:", reportResponse);

      // Handle the response structure - check what's actually returned
      setSalesReport(reportResponse.data || reportResponse);
      setPreviousSalesReport(previousReportResponse.data || previousReportResponse);

      setCategories(
        Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : [categoriesResponse.data]
      );
      setProducts(productsResponse.data || []);

      const firstOrderRow = ordersResponse.data?.[0] as OrdersListRow | undefined;
      const ordersJsonRaw = firstOrderRow?.orders_json ?? ordersResponse.data;
      let parsedOrders: OrderListItem[] = [];
      if (typeof ordersJsonRaw === "string") {
        try {
          parsedOrders = JSON.parse(ordersJsonRaw) as OrderListItem[];
        } catch {
          parsedOrders = [];
        }
      } else if (Array.isArray(ordersJsonRaw)) {
        parsedOrders = ordersJsonRaw as OrderListItem[];
      }

      const startTime = new Date(`${startDate}T00:00:00`).getTime();
      const endTime = new Date(`${endDate}T23:59:59`).getTime();
      setReportOrders(
        parsedOrders.filter((order) => {
          const orderTime = new Date(order.order_date).getTime();
          return orderTime >= startTime && orderTime <= endTime;
        }) as ReportOrder[]
      );
    } catch (err: any) {
      // console.error("Failed to fetch report data:", err);
      setError(err.message || "Failed to fetch report data.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, timeframe, debouncedCategoryFilter, debouncedProductFilter]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const { totalRevenue, totalProfit, totalSales, totalItemsSold } =
    useMemo(() => {
      // Default values
      const defaults = {
        totalRevenue: 0,
        totalProfit: 0,
        totalSales: 0,
        totalItemsSold: 0,
      };

      if (!salesReport) return defaults;

      // Check if summary exists
      if (salesReport.summary) {
        return {
          totalRevenue: salesReport.summary.total_revenue || 0,
          totalProfit: salesReport.summary.total_profit || 0,
          totalSales: salesReport.summary.total_sales || 0,
          totalItemsSold: salesReport.summary.total_items_sold || 0,
        };
      }

      // Fallback: calculate from chart data if summary doesn't exist
      if (salesReport.chart && Array.isArray(salesReport.chart)) {
        const calculated = salesReport.chart.reduce(
          (acc, point) => ({
            totalRevenue: acc.totalRevenue + (point.revenue || 0),
            totalProfit: acc.totalProfit + (point.profit || 0),
            totalSales: acc.totalSales + (point.sales || 0),
            totalItemsSold: acc.totalItemsSold + (point.items_sold || 0),
          }),
          defaults
        );
        return calculated;
      }

      return defaults;
    }, [salesReport]);

  const previousSummary = useMemo(() => {
    const summary = previousSalesReport?.summary;
    return {
      revenue: summary?.total_revenue || 0,
      profit: summary?.total_profit || 0,
      sales: summary?.total_sales || 0,
      itemsSold: summary?.total_items_sold || 0,
    };
  }, [previousSalesReport]);

  const revenueChangePercent = useMemo(() => {
    if (previousSummary.revenue <= 0) return null;
    return ((totalRevenue - previousSummary.revenue) / previousSummary.revenue) * 100;
  }, [previousSummary.revenue, totalRevenue]);

  const businessInsights = useMemo(() => {
    const productByName = new Map(
      products.map((product) => [product.name.toLowerCase(), product])
    );
    const selectedProductId =
      productFilter !== "" ? Number(productFilter) : null;
    const selectedCategoryId =
      categoryFilter !== "" ? Number(categoryFilter) : null;
    const productRows = new Map<
      string,
      {
        name: string;
        quantity: number;
        revenue: number;
        profit: number | null;
        stock: number | null;
      }
    >();
    const paymentRows = new Map<string, number>();

    const isItemInScope = (item: ReportOrderItem) => {
      const product = productByName.get(item.product.toLowerCase());
      if (selectedProductId !== null) {
        return product?.product_id === selectedProductId;
      }
      if (selectedCategoryId !== null) {
        return product?.category_id === selectedCategoryId;
      }
      return true;
    };

    for (const order of reportOrders) {
      let scopedOrderTotal = 0;

      for (const item of order.items || []) {
        if (!isItemInScope(item)) continue;

        const product = productByName.get(item.product.toLowerCase());
        const quantity = Number(item.qty || 0);
        const revenue = Number(item.total || item.price * quantity || 0);
        const profit =
          product && Number.isFinite(Number(product.unit_price))
            ? (Number(item.price || 0) - Number(product.unit_price || 0)) * quantity
            : null;
        const existing = productRows.get(item.product) || {
          name: item.product,
          quantity: 0,
          revenue: 0,
          profit: product ? 0 : null,
          stock: product?.stock ?? null,
        };

        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.stock = product?.stock ?? existing.stock;
        existing.profit =
          existing.profit === null || profit === null
            ? null
            : existing.profit + profit;
        productRows.set(item.product, existing);
        scopedOrderTotal += revenue;
      }

      if (scopedOrderTotal > 0) {
        const method = (order.payment_method || "unknown").toLowerCase();
        paymentRows.set(method, (paymentRows.get(method) || 0) + scopedOrderTotal);
      }
    }

    const productBreakdown = [...productRows.values()].sort(
      (a, b) => b.revenue - a.revenue
    );
    const lowStockSellingFast = productBreakdown
      .filter((row) => row.stock !== null && row.stock <= 10 && row.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    const soldNames = new Set(
      productBreakdown.map((row) => row.name.toLowerCase())
    );
    const deadStock = products
      .filter(
        (product) =>
          product.stock > 0 &&
          !soldNames.has(product.name.toLowerCase()) &&
          (selectedCategoryId === null || product.category_id === selectedCategoryId) &&
          (selectedProductId === null || product.product_id === selectedProductId)
      )
      .slice(0, 5);
    const paymentSplit = [...paymentRows.entries()]
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      productBreakdown,
      paymentSplit,
      lowStockSellingFast,
      deadStock,
    };
  }, [categoryFilter, productFilter, products, reportOrders]);

  const chartData = useMemo(() => {
    if (!salesReport?.chart || !Array.isArray(salesReport.chart)) return [];
    return salesReport.chart.map((point) => ({
      date: point.period || point.date || "",
      amount: point.revenue || 0,
      profit: point.profit || 0,
    }));
  }, [salesReport]);

  const reportInsights = useMemo(() => {
    const peakRevenue = chartData.reduce(
      (best, point) => (point.amount > best.amount ? point : best),
      { date: "", amount: 0, profit: 0 }
    );
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const activeFilter =
      productFilter !== ""
        ? products.find((p) => p.product_id === Number(productFilter))?.name
        : categoryFilter !== ""
          ? categories.find((c) => c.category_id === Number(categoryFilter))?.name
          : "All products";

    return {
      peakRevenue,
      profitMargin,
      activeFilter: activeFilter || "All products",
    };
  }, [categories, categoryFilter, chartData, productFilter, products, totalProfit, totalRevenue]);

  const getFilterTitle = () => {
    let title = "";
    if (productFilter !== "") {
      title =
        products.find((p) => p.product_id === Number(productFilter))?.name ||
        "";
    } else if (categoryFilter !== "") {
      title =
        categories.find((c) => c.category_id === Number(categoryFilter))
          ?.name || "";
    } else {
      title = "Overall";
    }

    const timeframeText =
      timeframe.charAt(0).toUpperCase() + timeframe.slice(1);
    return `${timeframeText} Sales Trend for ${title}`;
  };

  if (loading && !salesReport) {
    return (
      <main className="page flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-b-2 border-peso"></span>
          <p className="text-sm text-muted">Loading reports…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page flex items-center justify-center">
        <div className="card flex max-w-md flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-danger">We couldn’t load your reports.</p>
          <p className="text-sm text-muted">{error}</p>
          <button onClick={fetchReportData} className="btn btn-primary">
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-inner space-y-4 lg:space-y-5">
        <header className="pl-12 lg:pl-0">
          <p className="eyebrow">Benta at kita</p>
          <h1 className="page-title mt-1">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            See how your store is doing across sales and profit.
          </p>
        </header>

        {/* Filters Bar */}
        <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-sunken p-1 sm:flex sm:items-center">
            {(["today", "week", "month", "year"] as Timeframe[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`min-h-11 rounded-lg px-3.5 text-sm font-semibold transition ${
                  timeframe === t
                    ? "bg-peso text-white"
                    : "text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setProductFilter("");
            }}
            className="field field-sm w-full sm:w-auto"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="field field-sm w-full sm:w-auto"
            disabled={categoryFilter === ""}
          >
            <option value="">All products in category</option>
            {products
              .filter((p) => p.category_id === Number(categoryFilter))
              .map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>

        <div className="relative space-y-4 lg:space-y-5">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-paper/60 backdrop-blur-sm">
              <span className="h-8 w-8 animate-spin rounded-full border-b-2 border-peso"></span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DashboardCard
              icon={ChartBarIcon}
              title="Total revenue"
              value={formatCurrency(totalRevenue)}
              change={
                revenueChangePercent === null
                  ? "No previous period"
                  : `${revenueChangePercent >= 0 ? "+" : ""}${revenueChangePercent.toFixed(1)}% vs previous`
              }
              changeType={
                revenueChangePercent === null
                  ? "neutral"
                  : revenueChangePercent >= 0
                  ? "increase"
                  : "decrease"
              }
              valueTone="money"
            />
            <DashboardCard
              icon={ChartBarIcon}
              title="Total profit"
              value={formatCurrency(totalProfit)}
              change={totalRevenue > 0 ? `${reportInsights.profitMargin.toFixed(1)}% margin signal` : "No revenue yet"}
              changeType={totalProfit > 0 ? "increase" : "neutral"}
              valueTone="neutral"
            />
            <DashboardCard
              icon={ShoppingCartIcon}
              title="Total sales"
              value={totalSales.toLocaleString("en-US")}
              change={`Previous: ${previousSummary.sales.toLocaleString("en-US")}`}
              changeType="neutral"
            />
            <DashboardCard
              icon={PackageIcon}
              title="Items sold"
              value={totalItemsSold.toLocaleString("en-US")}
              change={`Previous: ${previousSummary.itemsSold.toLocaleString("en-US")}`}
              changeType="neutral"
            />
          </div>

          <div className="card-sunken grid gap-3 p-4 md:grid-cols-3">
            <div>
              <p className="eyebrow">Peak benta</p>
              <p className="money mt-1 text-lg font-bold text-ink">
                {reportInsights.peakRevenue.amount > 0
                  ? formatCurrency(reportInsights.peakRevenue.amount)
                  : "No sales yet"}
              </p>
              {reportInsights.peakRevenue.date && (
                <p className="mt-1 truncate text-xs text-muted">
                  {reportInsights.peakRevenue.date}
                </p>
              )}
            </div>
            <div>
              <p className="eyebrow">Kita signal</p>
              <p className="money mt-1 text-lg font-bold text-ink">
                {totalRevenue > 0 ? `${reportInsights.profitMargin.toFixed(1)}%` : "No signal"}
              </p>
              <p className="mt-1 text-xs text-muted">Based on available profit data</p>
            </div>
            <div>
              <p className="eyebrow">Current view</p>
              <p className="mt-1 truncate text-sm font-semibold text-ink">
                {reportInsights.activeFilter}
              </p>
              <p className="mt-1 text-xs text-muted">Filter scope for this report</p>
            </div>
          </div>

          <div className="card p-4 lg:p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">
              {getFilterTitle()}
            </h2>
            {chartData.length > 0 ? (
              <SalesChart data={chartData} />
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-center">
                <p className="text-sm font-semibold text-muted">No sales yet for this period</p>
                <p className="text-xs text-faint">Record a sale at the counter, or pick another timeframe.</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="card p-4 lg:p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-ink">
                Product performance
              </h2>
              {businessInsights.productBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col" className="text-right">Qty</th>
                        <th scope="col" className="text-right">Revenue</th>
                        <th scope="col" className="text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessInsights.productBreakdown.slice(0, 8).map((row) => (
                        <tr key={row.name}>
                          <td className="font-semibold text-ink">{row.name}</td>
                          <td className="money text-right">{row.quantity}</td>
                          <td className="money text-right font-semibold text-ink">
                            {formatCurrency(row.revenue)}
                          </td>
                          <td className="money text-right text-muted">
                            {row.profit === null
                              ? "No cost"
                              : formatCurrency(row.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted">No product-level sales in this period.</p>
              )}
            </div>

            <div className="card p-4 lg:p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-ink">
                Payment split
              </h2>
              {businessInsights.paymentSplit.length > 0 ? (
                <div className="space-y-2">
                  {businessInsights.paymentSplit.map((row) => (
                    <div
                      key={row.method}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
                    >
                      <span className="text-sm font-semibold capitalize text-ink">
                        {row.method}
                      </span>
                      <span className="money font-bold text-peso">
                        {formatCurrency(row.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No payment-method data in this period.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="card p-4 lg:p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-ink">
                Low stock, still selling
              </h2>
              {businessInsights.lowStockSellingFast.length > 0 ? (
                <div className="space-y-2">
                  {businessInsights.lowStockSellingFast.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {row.name}
                        </p>
                        <p className="text-xs text-muted">Sold {row.quantity}</p>
                      </div>
                      <span className="pill pill-warn">Stock {row.stock}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No low-stock sellers found.</p>
              )}
            </div>

            <div className="card p-4 lg:p-5">
              <h2 className="mb-4 font-display text-lg font-semibold text-ink">
                Dead stock signal
              </h2>
              {businessInsights.deadStock.length > 0 ? (
                <div className="space-y-2">
                  {businessInsights.deadStock.map((product) => (
                    <div
                      key={product.product_id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
                    >
                      <span className="truncate text-sm font-semibold text-ink">
                        {product.name}
                      </span>
                      <span className="money text-sm text-muted">
                        Stock {product.stock}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No dead-stock signal for this view.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ReportsPage;
