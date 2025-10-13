import {
  ProcessOrderPOS,
  GetOrderHistory,
} from "../db/procedures/order.proc";
import { ApiError } from "../utils/apiError";

export async function processOrderPOS(storeId: number, payload: any) {
  const result = await ProcessOrderPOS(storeId, payload);
  const orderId = result?.[0]?.order_id ?? null;

  if (!orderId) {
    throw new ApiError(500, "ORDER_PROCESS_FAILED", "Failed to process order.");
  }

  return { order_id: orderId };
}

export async function getOrderHistory(
  storeId: number,
  orderId: number | null = null,
  searchTerm: string | null = null
) {
  const rows = await GetOrderHistory(storeId, orderId, searchTerm);
  return rows;
}
