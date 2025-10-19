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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        <p className="ml-3 text-sky-400">Loading reports...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center text-red-400">
        <p>Error: {error}</p>
        <button
          onClick={fetchReportData}
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
          Reports & Analytics
        </h1>
        <p className="text-gray-400">
          View your business performance and sales data.
        </p>
      </header>

      {/* Filters Bar */}
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-1 bg-gray-700 p-1 rounded-lg">
          {(["today", "week", "month", "year"] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                timeframe === t
                  ? "bg-sky-500 text-white"
                  : "text-gray-300 hover:bg-gray-600"
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
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
          disabled={categoryFilter === ""}
        >
          <option value="">All Products in Category</option>
          {products
            .filter((p) => p.category_id === Number(categoryFilter))
            .map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <DashboardCard
            icon={ChartBarIcon}
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            change={`For selected period`}
            changeType="increase"
          />
          <DashboardCard
            icon={ChartBarIcon}
            title="Total Profit"
            value={formatCurrency(totalProfit)}
            change={`For selected period`}
            changeType="increase"
          />
          <DashboardCard
            icon={ShoppingCartIcon}
            title="Total Sales"
            value={totalSales.toLocaleString("en-US")}
            change={`For selected period`}
            changeType="increase"
          />
          <DashboardCard
            icon={PackageIcon}
            title="Items Sold"
            value={totalItemsSold.toLocaleString("en-US")}
            change={`For selected period`}
            changeType="increase"
          />
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            {getFilterTitle()}
          </h2>
          {chartData.length > 0 ? (
            <SalesChart data={chartData} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No sales data for the selected period.
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ReportsPage;