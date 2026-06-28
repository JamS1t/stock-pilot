import { Request, Response } from "express";
import { StockMovementReason } from "../db/procedures/stockMovement.proc";
import {
  createStockMovement,
  listStockMovements,
} from "../services/stockMovement.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { errorResponse, successResponse } from "../utils/response.util";
import { logAuditSafe } from "../services/audit.service";
import { logger } from "../utils/logger.util";

const REASONS: StockMovementReason[] = [
  "sale",
  "stock_in",
  "return",
  "damage",
  "expired",
  "owner_use",
  "correction",
];

function parseId(value: unknown, code: string, message: string) {
  const id = Number(value);
  if (!value || !Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, code, message);
  }
  return id;
}

export async function createStockMovementHandler(req: Request, res: Response) {
  try {
    const {
      product_id,
      quantity_delta,
      reason,
      source_type,
      source_id,
      note,
      client_mutation_id,
    } = req.body;
    const { store_id, user_id } = req.user!;
    const productId = parseId(
      product_id,
      "INVALID_PRODUCT_ID",
      "Product ID is required and must be a valid number."
    );
    const quantityDelta = Number(quantity_delta);

    if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
      throw new ApiError(
        400,
        "INVALID_QUANTITY_DELTA",
        "Quantity delta is required and cannot be zero."
      );
    }
    if (!REASONS.includes(reason)) {
      throw new ApiError(400, "INVALID_REASON", "Invalid movement reason.");
    }

    const result = await createStockMovement(
      store_id,
      productId,
      quantityDelta,
      reason,
      source_type || null,
      source_id ? Number(source_id) : null,
      note || null,
      user_id,
      client_mutation_id || null
    );
    await logAuditSafe(
      {
        storeId: store_id,
        userId: user_id,
        ip: req.ip || null,
        userAgent: req.get("User-Agent") || null,
      },
      "stock.change",
      "stock_movement",
      result.movement_id,
      {
        product_id: productId,
        quantity_delta: quantityDelta,
        reason,
        source_type: source_type || null,
        source_id: source_id ? Number(source_id) : null,
      }
    );
    logger.info("stock_movement.create_succeeded", {
      store_id,
      user_id,
      movement_id: result.movement_id,
      product_id: productId,
      quantity_delta: quantityDelta,
      reason,
      source_type: source_type || null,
      source_id: source_id ? Number(source_id) : null,
      client_mutation_id: client_mutation_id || null,
    });

    return successResponse(
      res,
      "Stock movement created successfully",
      result,
      201
    );
  } catch (err: any) {
    logger.error("stock_movement.create_failed", {
      error: err,
      store_id: req.user?.store_id || null,
      user_id: req.user?.user_id || null,
      product_id: req.body?.product_id || null,
      quantity_delta: Number.isFinite(Number(req.body?.quantity_delta))
        ? Number(req.body.quantity_delta)
        : null,
      reason: req.body?.reason || null,
      source_type: req.body?.source_type || null,
      source_id: req.body?.source_id || null,
      client_mutation_id: req.body?.client_mutation_id || null,
    });
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function listStockMovementsHandler(req: Request, res: Response) {
  try {
    const { product_id, from, to } = req.query;
    const { store_id } = req.user!;
    const productId = product_id
      ? parseId(
          product_id,
          "INVALID_PRODUCT_ID",
          "Product ID must be a valid number if provided."
        )
      : null;

    const rows = await listStockMovements(
      store_id,
      productId,
      from ? String(from) : null,
      to ? String(to) : null
    );
    const movements = safeJSONParse<any[]>(rows?.[0]?.movements_json, []);

    return successResponse(
      res,
      "Stock movements fetched successfully",
      movements
    );
  } catch (err: any) {
    logger.error("stock_movement.list_failed", {
      error: err,
      store_id: req.user?.store_id || null,
      product_id: req.query?.product_id || null,
      from: req.query?.from || null,
      to: req.query?.to || null,
    });
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
