import { DateTime } from "luxon";
import { callProc } from "../callProc";
import { pool } from "../../config/db";
import { fromUTCToLocal, toUTCDateRange } from "../../utils/timezone";
import { safeJSONParse } from "../../utils/json.util";

export type ReportDateInput = string | Date;

async function getStoreTimezone(storeId: number) {
  const [rows]: any = await pool.query(
    `SELECT timezone FROM ${process.env.DB_NAME}.stores WHERE store_id = ?`,
    [storeId]
  );
  const store = Array.isArray(rows) ? rows[0] : rows;
  return store?.timezone || "Asia/Manila";
}

function toReportUTCDateRange(
  timezone: string,
  startDate: ReportDateInput,
  endDate: ReportDateInput
) {
  const startRaw = startDate instanceof Date ? startDate.toISOString() : startDate;
  const endRaw = endDate instanceof Date ? endDate.toISOString() : endDate;
  const start = DateTime.fromISO(startRaw, { zone: timezone });
  let end = DateTime.fromISO(endRaw, { zone: timezone });

  if (!start.isValid || !end.isValid) {
    throw new Error(`Invalid report date range: start=${startRaw}, end=${endRaw}`);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(endRaw)) {
    end = end.plus({ days: 1 });
  }

  return {
    startUTC: start.toUTC().toSQL({ includeOffset: false })!,
    endUTC: end.toUTC().toSQL({ includeOffset: false })!,
  };
}

async function callReportJSON<T>(
  procName: string,
  jsonColumn: string,
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null,
  productId: number | null,
  extraParams: any[] = [],
  fallback: T
) {
  const timezone = await getStoreTimezone(storeId);
  const { startUTC, endUTC } = toReportUTCDateRange(
    timezone,
    startDate,
    endDate
  );
  const [result]: any = await callProc(procName, [
    storeId,
    startUTC,
    endUTC,
    categoryId,
    productId,
    ...extraParams,
  ]);

  return safeJSONParse<T>(result?.[jsonColumn], fallback);
}

export async function GetSalesReportJSON(
  storeId: number,
  startDate: string | Date,
  endDate: string | Date,
  categoryId: number | null = null,
  productId: number | null = null,
  granularity: "minute" | "day"
) {
  const timezone = await getStoreTimezone(storeId);

  const { startUTC, endUTC } = toUTCDateRange(
    timezone,
    startDate instanceof Date ? startDate.toISOString() : startDate,
    endDate instanceof Date ? endDate.toISOString() : endDate
  );

  const [result]: any = await callProc("GetSalesReportJSON", [
    storeId,
    startUTC,
    endUTC,
    categoryId,
    productId,
    granularity,
  ]);

  const reportJSON = safeJSONParse<any>(result?.report_json, {});
  reportJSON.chart = Array.isArray(reportJSON.chart) ? reportJSON.chart : [];

  reportJSON.chart = reportJSON.chart.map((entry: any) => ({
    ...entry,
    period: fromUTCToLocal(entry.period, timezone, granularity),
  }));

  return reportJSON;
}

export async function GetBestSellersReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null,
  limit: number | null = null
) {
  return callReportJSON<any[]>(
    "GetReportBestSellers",
    "best_sellers_json",
    storeId,
    startDate,
    endDate,
    categoryId,
    productId,
    [limit],
    []
  );
}

export async function GetProfitBreakdownReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null,
  limit: number | null = null
) {
  return callReportJSON<any[]>(
    "GetReportProfitBreakdown",
    "profit_breakdown_json",
    storeId,
    startDate,
    endDate,
    categoryId,
    productId,
    [limit],
    []
  );
}

export async function GetPaymentSplitReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null
) {
  return callReportJSON<any[]>(
    "GetReportPaymentSplit",
    "payment_split_json",
    storeId,
    startDate,
    endDate,
    categoryId,
    productId,
    [],
    []
  );
}

export async function GetLowStockSellingFastReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null,
  lowStockThreshold: number | null = null,
  limit: number | null = null
) {
  return callReportJSON<any[]>(
    "GetReportLowStockSellingFast",
    "low_stock_selling_fast_json",
    storeId,
    startDate,
    endDate,
    categoryId,
    productId,
    [lowStockThreshold, limit],
    []
  );
}

export async function GetDeadStockReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null,
  limit: number | null = null
) {
  return callReportJSON<any[]>(
    "GetReportDeadStock",
    "dead_stock_json",
    storeId,
    startDate,
    endDate,
    categoryId,
    productId,
    [limit],
    []
  );
}

export async function GetPreviousPeriodComparisonReport(
  storeId: number,
  startDate: ReportDateInput,
  endDate: ReportDateInput,
  previousStartDate: ReportDateInput,
  previousEndDate: ReportDateInput,
  categoryId: number | null = null,
  productId: number | null = null
) {
  const timezone = await getStoreTimezone(storeId);
  const current = toReportUTCDateRange(timezone, startDate, endDate);
  const previous = toReportUTCDateRange(
    timezone,
    previousStartDate,
    previousEndDate
  );
  const [result]: any = await callProc("GetReportPreviousPeriodComparison", [
    storeId,
    current.startUTC,
    current.endUTC,
    previous.startUTC,
    previous.endUTC,
    categoryId,
    productId,
  ]);

  return safeJSONParse<any>(result?.comparison_json, {
    current: {},
    previous: {},
    change: {},
  });
}
