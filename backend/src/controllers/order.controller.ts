import { Request, Response } from "express";
import {
  processOrderPOS,
  getOrderHistory,
  voidOrder,
  OrderVoidAction,
} from "../services/order.service";
import { ApiError } from "../utils/apiError";
import {
  buildPaginationMeta,
  parsePaginationParams,
} from "../utils/pagination.util";
import { safeJSONParse } from "../utils/json.util";
import { successResponse, errorResponse } from "../utils/response.util";
import { logAuditSafe } from "../services/audit.service";

const ORDER_SORT_KEYS = [
  "order_id",
  "order_date",
  "items",
  "total",
  "payment",
] as const;

const PAYMENT_METHODS = ["cash", "gcash", "utang"] as const;

type OrderSortKey = (typeof ORDER_SORT_KEYS)[number];

function parseDateFilter(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new ApiError(400, "INVALID_DATE", `${label} must use YYYY-MM-DD.`);
  }

  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "INVALID_DATE", `${label} must be a real date.`);
  }
  return raw;
}

function parseId(value: unknown, code: string, message: string) {
  const id = Number(value);
  if (!value || !Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, code, message);
  }
  return id;
}

export async function processOrderPOSHandler(req: Request, res: Response) {
  try {
    const { payload, client_mutation_id, device_id, local_id } = req.body;
    const { store_id } = req.user!;

    if (!payload) {
      throw new ApiError(400, "PAYLOAD_REQUIRED", "Order payload is required.");
    }

    const result = await processOrderPOS(store_id, {
      ...payload,
      client_mutation_id: payload.client_mutation_id || client_mutation_id || null,
      device_id: payload.device_id || device_id || null,
      local_id: payload.local_id || local_id || null,
    });
    await logAuditSafe(
      {
        storeId: store_id,
        userId: req.user!.user_id,
        ip: req.ip || null,
        userAgent: req.get("User-Agent") || null,
      },
      "order.create",
      "order",
      result.order_id,
      {
        payment_method: payload.payment_method || null,
        total: payload.total || null,
        item_count: Array.isArray(payload.items) ? payload.items.length : 0,
      }
    );

    return successResponse(res, "Order processed successfully", result, 201);
  } catch (err: any) {
    console.error("Order process error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function getOrderHistoryHandler(req: Request, res: Response) {
  try {
    const { id, searchTerm, payment_method, date_from, date_to } = req.query;
    const { store_id } = req.user!;
    const pagination = parsePaginationParams<OrderSortKey>(
      req.query,
      ORDER_SORT_KEYS,
      "order_date",
      "desc"
    );

    if (id && isNaN(Number(id))) {
      throw new ApiError(
        400,
        "INVALID_ORDER_ID",
        "Order ID must be a valid number if provided."
      );
    }
    if (
      payment_method &&
      !PAYMENT_METHODS.includes(String(payment_method) as any)
    ) {
      throw new ApiError(
        400,
        "INVALID_PAYMENT_METHOD",
        "Payment method filter is not supported."
      );
    }
    const dateFrom = parseDateFilter(date_from, "Date from");
    const dateTo = parseDateFilter(date_to, "Date to");
    if (
      dateFrom &&
      dateTo &&
      new Date(`${dateFrom}T00:00:00`).getTime() >
        new Date(`${dateTo}T00:00:00`).getTime()
    ) {
      throw new ApiError(
        400,
        "INVALID_DATE_RANGE",
        "Date from must be before date to."
      );
    }

    const orders = await getOrderHistory(
      store_id,
      id ? Number(id) : null,
      searchTerm ? String(searchTerm) : null,
      payment_method ? String(payment_method) : null,
      dateFrom,
      dateTo,
      pagination.sortBy,
      pagination.sortDir,
      pagination.pageSize,
      pagination.offset
    );

    if (id) {
      const invoiceRaw =
        orders?.[0]?.invoice_json ?? orders?.[0]?.orders_json ?? null;
      const invoice =
        typeof invoiceRaw === "string"
          ? safeJSONParse<any>(invoiceRaw, null)
          : invoiceRaw;

      return successResponse(
        res,
        "Order history fetched successfully",
        invoice
      );
    }

    let orderJSON = safeJSONParse<any[]>(orders?.[0]?.orders_json, []);
    const hasBackendPaging = orders?.[0]?.total_count !== undefined;

    if (!hasBackendPaging) {
      const fromTime = dateFrom
        ? new Date(`${dateFrom}T00:00:00`).getTime()
        : null;
      const toTime = dateTo
        ? new Date(`${dateTo}T23:59:59`).getTime()
        : null;

      orderJSON = orderJSON.filter((order) => {
        const orderTime = new Date(order.order_date).getTime();
        const method = (order.payment_method || "").toLowerCase();

        if (payment_method && method !== String(payment_method)) return false;
        if (fromTime !== null && orderTime < fromTime) return false;
        if (toTime !== null && orderTime > toTime) return false;
        return true;
      });

      const getSortValue = (order: any) => {
        switch (pagination.sortBy) {
          case "order_id":
            return Number(order.order_id || 0);
          case "items":
            return order.items?.length || 0;
          case "total":
            return Number(order.total || 0);
          case "payment":
            return order.payment_method || "";
          case "order_date":
          default:
            return new Date(order.order_date).getTime();
        }
      };
      orderJSON = [...orderJSON].sort((a, b) => {
        const aValue = getSortValue(a);
        const bValue = getSortValue(b);
        const direction = pagination.sortDir === "asc" ? 1 : -1;

        if (typeof aValue === "number" && typeof bValue === "number") {
          return (aValue - bValue) * direction;
        }
        return String(aValue).localeCompare(String(bValue)) * direction;
      });
    }

    const total = hasBackendPaging
      ? Number(orders?.[0]?.total_count || 0)
      : orderJSON.length;
    if (!hasBackendPaging && pagination.pageSize !== null && pagination.offset !== null) {
      orderJSON = orderJSON.slice(
        pagination.offset,
        pagination.offset + pagination.pageSize
      );
    }

    return successResponse(
      res,
      "Order history fetched successfully",
      orderJSON,
      200,
      buildPaginationMeta(pagination.page, pagination.pageSize, total)
    );
  } catch (err: any) {
    console.error("Order history fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function voidOrderHandler(req: Request, res: Response) {
  try {
    const orderId = parseId(
      req.params.id,
      "INVALID_ORDER_ID",
      "Order ID is required and must be a valid number."
    );
    const action = String(req.body.action || "refund") as OrderVoidAction;
    if (!["cancel", "refund"].includes(action)) {
      throw new ApiError(
        400,
        "INVALID_ACTION",
        "Action must be cancel or refund."
      );
    }
    const { store_id, user_id } = req.user!;

    const result = await voidOrder(store_id, orderId, action, user_id, {
      storeId: store_id,
      userId: user_id,
      ip: req.ip || null,
      userAgent: req.get("User-Agent") || null,
    });

    return successResponse(res, "Order void flow completed successfully", result);
  } catch (err: any) {
    console.error("Order void error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
