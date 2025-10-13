import { callProc } from "../callProc";

export async function GetSalesReportJSON(
  storeId: number,
  startDate: Date,
  endDate: Date,
  categoryId: number | null = null,
  productId: number | null = null,
  granularity: "minute" | "day"
) {
  return callProc("GetSalesReportJSON", [
    storeId,
    startDate,
    endDate,
    categoryId,
    productId,
    granularity,
  ]);
}
