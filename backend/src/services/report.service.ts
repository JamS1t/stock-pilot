import { GetSalesReportJSON } from "../db/procedures/report.proc";
import { ApiError } from "../utils/apiError";

export async function getSalesReportJSON(
  storeId: number,
  startDate: Date,
  endDate: Date,
  categoryId: number | null = null,
  productId: number | null = null,
  granularity: "minute" | "day"
) {
  const rows = await GetSalesReportJSON(
    storeId,
    startDate,
    endDate,
    categoryId,
    productId,
    granularity
  );
  return rows;
}
