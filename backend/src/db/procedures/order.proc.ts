import { callProc } from "../callProc";

export async function ProcessOrderPOS(storeId: number, payload: any) {
  return callProc("ProcessOrderPOS", [
    storeId,
    JSON.stringify(payload),
  ]);
}

export async function GetOrderHistory(
  storeId: number,
  orderId: number | null = null,
  searchTerm: string | null = null,
  paymentMethod: string | null = null,
  dateFrom: string | null = null,
  dateTo: string | null = null,
  sortBy = "order_date",
  sortDir = "desc",
  limit: number | null = null,
  offset: number | null = null
) {
  try {
    const rows = await callProc<any>("GetOrderHistory", [
      storeId,
      orderId,
      searchTerm,
      paymentMethod,
      dateFrom,
      dateTo,
      sortBy,
      sortDir,
      limit,
      offset,
    ]);
    return rows;
  } catch (err: any) {
    if (err?.code !== "ER_SP_WRONG_NO_OF_ARGS") throw err;

    const rows = await callProc<any>("GetOrderHistory", [
      storeId,
      orderId,
      searchTerm,
    ]);
    return rows;
  }
}
