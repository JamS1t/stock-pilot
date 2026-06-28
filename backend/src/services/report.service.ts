import {
  GetBestSellersReport,
  GetDeadStockReport,
  GetLowStockSellingFastReport,
  GetPaymentSplitReport,
  GetPreviousPeriodComparisonReport,
  GetProfitBreakdownReport,
  GetSalesReportJSON,
  ReportDateInput,
} from "../db/procedures/report.proc";
import { ApiError } from "../utils/apiError";

export async function getSalesReportJSON(
  storeId: number,
  startDate: string | Date,
  endDate: string | Date,
  categoryId: number | null = null,
  productId: number | null = null,
  granularity: "minute" | "day"
) {
  try {
    const report = await GetSalesReportJSON(
      storeId,
      startDate,
      endDate,
      categoryId,
      productId,
      granularity
    );
    return report;
  } catch (err) {
    console.error("GetSalesReportJSON error:", err);
    throw new ApiError(500, "DB_ERROR", "Failed to fetch sales report.");
  }
}

export async function getBestSellersReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null,
  limit: number | null = null
) {
  try {
    return await GetBestSellersReport(
      storeId,
      startDate,
      endDate,
      categoryId,
      productId,
      limit
    );
  } catch (err) {
    console.error("GetBestSellersReport error:", err);
    throw new ApiError(500, "DB_ERROR", "Failed to fetch best sellers report.");
  }
}

export async function getProfitBreakdownReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null,
  limit: number | null = null
) {
  try {
    return await GetProfitBreakdownReport(
      storeId,
      startDate,
      endDate,
      categoryId,
      productId,
      limit
    );
  } catch (err) {
    console.error("GetProfitBreakdownReport error:", err);
    throw new ApiError(
      500,
      "DB_ERROR",
      "Failed to fetch profit breakdown report."
    );
  }
}

export async function getPaymentSplitReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null
) {
  try {
    return await GetPaymentSplitReport(
      storeId,
      startDate,
      endDate,
      categoryId,
      productId
    );
  } catch (err) {
    console.error("GetPaymentSplitReport error:", err);
    throw new ApiError(500, "DB_ERROR", "Failed to fetch payment split report.");
  }
}

export async function getLowStockSellingFastReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null,
  lowStockThreshold: number | null = null,
  limit: number | null = null
) {
  try {
    return await GetLowStockSellingFastReport(
      storeId,
      startDate,
      endDate,
      categoryId,
      productId,
      lowStockThreshold,
      limit
    );
  } catch (err) {
    console.error("GetLowStockSellingFastReport error:", err);
    throw new ApiError(
      500,
      "DB_ERROR",
      "Failed to fetch low-stock selling-fast report."
    );
  }
}

export async function getDeadStockReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null,
  limit: number | null = null
) {
  try {
    return await GetDeadStockReport(
      storeId,
      startDate,
      endDate,
      categoryId,
      productId,
      limit
    );
  } catch (err) {
    console.error("GetDeadStockReport error:", err);
    throw new ApiError(500, "DB_ERROR", "Failed to fetch dead stock report.");
  }
}

export async function getPreviousPeriodComparisonReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  previousStartDate: ReportDateInput,
  previousEndDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null
) {
  try {
    return await GetPreviousPeriodComparisonReport(
      storeId,
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      categoryId,
      productId
    );
  } catch (err) {
    console.error("GetPreviousPeriodComparisonReport error:", err);
    throw new ApiError(
      500,
      "DB_ERROR",
      "Failed to fetch previous-period comparison report."
    );
  }
}
