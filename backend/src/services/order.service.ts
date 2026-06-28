import {
  ProcessOrderPOS,
  GetOrderHistory,
} from "../db/procedures/order.proc";
import { pool } from "../config/db";
import { ApiError } from "../utils/apiError";
import { SortDirection } from "../utils/pagination.util";
import { AuditContext, logAudit } from "./audit.service";

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
  searchTerm: string | null = null,
  paymentMethod: string | null = null,
  dateFrom: string | null = null,
  dateTo: string | null = null,
  sortBy = "order_date",
  sortDir: SortDirection = "desc",
  limit: number | null = null,
  offset: number | null = null
) {
  const rows = await GetOrderHistory(
    storeId,
    orderId,
    searchTerm,
    paymentMethod,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
    limit,
    offset
  );
  return rows;
}

export type OrderVoidAction = "cancel" | "refund";
export type OrderStatus = "paid" | "pending" | "cancelled" | "refunded";

export function validateOrderVoidTransition(
  currentStatus: OrderStatus,
  action: OrderVoidAction
) {
  if (["cancelled", "refunded"].includes(currentStatus)) {
    throw new ApiError(
      409,
      "ORDER_ALREADY_VOIDED",
      "Order has already been cancelled or refunded."
    );
  }
  if (action === "cancel" && currentStatus !== "pending") {
    throw new ApiError(
      400,
      "ORDER_NOT_CANCELLABLE",
      "Only pending orders can be cancelled."
    );
  }
  if (action === "refund" && currentStatus !== "paid") {
    throw new ApiError(
      400,
      "ORDER_NOT_REFUNDABLE",
      "Only paid orders can be refunded."
    );
  }
}

export async function voidOrder(
  storeId: number,
  orderId: number,
  action: OrderVoidAction,
  userId: number,
  audit: AuditContext
) {
  const connection = await pool.getConnection();
  const nextStatus = action === "cancel" ? "cancelled" : "refunded";
  try {
    await connection.beginTransaction();
    const [orderRows] = await connection.query<any[]>(
      `SELECT order_id, status, total, payment_method
         FROM orders
        WHERE store_id = ? AND order_id = ?
        FOR UPDATE`,
      [storeId, orderId]
    );
    const order = orderRows[0];
    if (!order) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
    }
    validateOrderVoidTransition(order.status, action);

    const [items] = await connection.query<any[]>(
      `SELECT product_id, quantity, name
         FROM orderitems
        WHERE order_id = ?`,
      [orderId]
    );

    await connection.query(
      `UPDATE orders SET status = ? WHERE store_id = ? AND order_id = ?`,
      [nextStatus, storeId, orderId]
    );

    for (const item of items) {
      await connection.query(
        `UPDATE products
            SET stock = stock + ?
          WHERE store_id = ? AND product_id = ?`,
        [item.quantity, storeId, item.product_id]
      );
      await connection.query(
        `INSERT INTO stock_movements (
            store_id,
            product_id,
            quantity_delta,
            reason,
            source_type,
            source_id,
            note,
            created_by,
            client_mutation_id
          ) VALUES (?, ?, ?, 'return', ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE movement_id = LAST_INSERT_ID(movement_id)`,
        [
          storeId,
          item.product_id,
          item.quantity,
          action === "refund" ? "order_refund" : "order_cancel",
          orderId,
          `${nextStatus} order #${orderId}`,
          userId,
          `${nextStatus}:${orderId}:${item.product_id}`,
        ]
      );
    }

    await connection.commit();
    await logAudit(audit, `order.${action}`, "order", orderId, {
      previous_status: order.status,
      status: nextStatus,
      total: order.total,
      payment_method: order.payment_method,
      restored_items: items.length,
    });

    return { order_id: orderId, status: nextStatus, restored_items: items.length };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
