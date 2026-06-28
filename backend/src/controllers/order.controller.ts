import { Request, Response } from "express";
import { processOrderPOS, getOrderHistory } from "../services/order.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { successResponse, errorResponse } from "../utils/response.util";

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
    const { id, searchTerm } = req.query;
    const { store_id } = req.user!;

    if (id && isNaN(Number(id))) {
      throw new ApiError(
        400,
        "INVALID_ORDER_ID",
        "Order ID must be a valid number if provided."
      );
    }

    const orders = await getOrderHistory(
      store_id,
      id ? Number(id) : null,
      searchTerm ? String(searchTerm) : null
    );

    const orderJSON = safeJSONParse<any[]>(orders?.[0]?.orders_json, []);

    return successResponse(
      res,
      "Order history fetched successfully",
      orderJSON
    );
  } catch (err: any) {
    console.error("Order history fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
