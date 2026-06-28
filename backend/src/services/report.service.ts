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
import { logger } from "../utils/logger.util";

function serializeReportDate(value: ReportDateInput) {
  return value instanceof Date ? value.toISOString() : value;
}

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
    logger.error("report.sales_fetch_failed", {
      error: err,
      store_id: storeId,
      start_date: serializeReportDate(startDate),
      end_date: serializeReportDate(endDate),
      category_id: categoryId,
      product_id: productId,
      granularity,
    });
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
    logger.error("report.best_sellers_fetch_failed", {
      error: err,
      store_id: storeId,
      start_date: serializeReportDate(startDate),
      end_date: serializeReportDate(endDate),
      category_id: categoryId,
      product_id: productId,
      limit,
    });
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
    logger.error("report.profit_breakdown_fetch_failed", {
      error: err,
      store_id: storeId,
      start_date: serializeReportDate(startDate),
      end_date: serializeReportDate(endDate),
      category_id: categoryId,
      product_id: productId,
      limit,
    });
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
    logger.error("report.payment_split_fetch_failed", {
      error: err,
      store_id: storeId,
      start_date: serializeReportDate(startDate),
      end_date: serializeReportDate(endDate),
      category_id: categoryId,
      product_id: productId,
    });
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
    logger.error("report.low_stock_selling_fast_fetch_failed", {
      error: err,
      store_id: storeId,
      start_date: serializeReportDate(startDate),
      end_date: serializeReportDate(endDate),
      category_id: categoryId,
      product_id: productId,
      low_stock_threshold: lowStockThreshold,
      limit,
    });
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
    logger.error("report.dead_stock_fetch_failed", {
      error: err,
      store_id: storeId,
      start_date: serializeReportDate(startDate),
      end_date: serializeReportDate(endDate),
      category_id: categoryId,
      product_id: productId,
      limit,
    });
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
    logger.error("report.previous_period_comparison_fetch_failed", {
      error: err,
      store_id: storeId,
      start_date: serializeReportDate(startDate),
      end_date: serializeReportDate(endDate),
      previous_start_date: serializeReportDate(previousStartDate),
      previous_end_date: serializeReportDate(previousEndDate),
      category_id: categoryId,
      product_id: productId,
    });
    throw new ApiError(
      500,
      "DB_ERROR",
      "Failed to fetch previous-period comparison report."
    );
  }
}
