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
  searchTerm: string | null = null
) {
  const rows = await callProc<any>("GetOrderHistory", [
    storeId,
    orderId,
    searchTerm,
  ]);
  return rows;
}
