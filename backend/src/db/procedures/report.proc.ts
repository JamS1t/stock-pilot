import { callProc } from "../callProc";
import { pool } from "../../config/db";
import { fromUTCToLocal, toUTCDateRange } from "../../utils/timezone";
import { safeJSONParse } from "../../utils/json.util";

export async function GetSalesReportJSON(
  storeId: number,
  startDate: string | Date,
  endDate: string | Date,
  categoryId: number | null = null,
  productId: number | null = null,
  granularity: "minute" | "day"
) {
  // Fetch timezone from DB
  const [rows]: any = await pool.query("SELECT timezone FROM stockpilot.stores WHERE store_id = ?", [storeId]);
  const store = Array.isArray(rows) ? rows[0] : rows;
  const timezone = store?.timezone || "Asia/Manila";

  // Convert local date range → UTC date range (for DB filtering)
  const { startUTC, endUTC } = toUTCDateRange(
    timezone,
    startDate instanceof Date ? startDate.toISOString() : startDate,
    endDate instanceof Date ? endDate.toISOString() : endDate
  );

  // Call stored procedure
  const [result]: any = await callProc("GetSalesReportJSON", [
    storeId,
    startUTC,
    endUTC,
    categoryId,
    productId,
    granularity,
  ]);

  // Parse JSON safely
  const reportJSON = safeJSONParse<any>(result?.report_json, {});

  console.log(reportJSON)

  reportJSON.chart = reportJSON.chart.map((entry: any) => ({
    ...entry,
    period: fromUTCToLocal(entry.period, timezone, granularity),
  }));

  return reportJSON;
}
