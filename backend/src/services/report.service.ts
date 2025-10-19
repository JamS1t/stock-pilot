import { GetSalesReportJSON } from "../db/procedures/report.proc";
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
