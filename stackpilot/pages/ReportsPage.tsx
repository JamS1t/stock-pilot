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
  Category,
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

const ReportsPage: React.FC<ReportsPageProps> = () => {
  const { isAuthenticated } = useAuth();
  const [salesReport, setSalesReport] = useState<SalesReportResponse | null>(
    null
  );
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

  const fetchReportData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    const { startDate, endDate, granularity } = getDatesForTimeframe(timeframe);

    try {
      const [reportResponse, categoriesResponse, productsResponse] =
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
          getCategories(),
          getProducts({
            category_id:
              debouncedCategoryFilter !== ""
                ? Number(debouncedCategoryFilter)
                : undefined,
          }),
        ]);

      // console.log("Sales report response:", reportResponse);

      // Handle the response structure - check what's actually returned
      setSalesReport(reportResponse.data || reportResponse);

      setCategories(
        Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : [categoriesResponse.data]
      );
      setProducts(productsResponse.data || []);
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
              change="Selected period"
              changeType="neutral"
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
              change={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} view`}
              changeType="neutral"
            />
            <DashboardCard
              icon={PackageIcon}
              title="Items sold"
              value={totalItemsSold.toLocaleString("en-US")}
              change={reportInsights.activeFilter}
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
        </div>
      </div>
    </main>
  );
};

export default ReportsPage;
