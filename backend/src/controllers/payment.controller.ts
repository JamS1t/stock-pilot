import { Request, Response } from "express";
import { PaymentMethod } from "../db/procedures/payment.proc";
import {
  createPayment,
  listPayments,
  voidPayment,
} from "../services/payment.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { errorResponse, successResponse } from "../utils/response.util";
import { logAuditSafe } from "../services/audit.service";
import { logger } from "../utils/logger.util";

const PAYMENT_METHODS: PaymentMethod[] = ["cash", "gcash", "other"];

function parseId(value: unknown, code: string, message: string) {
  const id = Number(value);
  if (!value || !Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, code, message);
  }
  return id;
}

function parsePositiveAmount(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(
      400,
      "INVALID_AMOUNT",
      "Amount is required and must be greater than zero."
    );
  }
  return amount;
}

export async function createPaymentHandler(req: Request, res: Response) {
  try {
    const {
      customer_id,
      amount,
      method,
      note,
      client_mutation_id,
      device_id,
      local_id,
    } = req.body;
    const { store_id, user_id } = req.user!;
    const customerId = parseId(
      customer_id,
      "INVALID_CUSTOMER_ID",
      "Customer ID is required and must be a valid number."
    );
    const parsedAmount = parsePositiveAmount(amount);
    const parsedMethod = method ? String(method) : "cash";

    if (!PAYMENT_METHODS.includes(parsedMethod as PaymentMethod)) {
      throw new ApiError(
        400,
        "INVALID_METHOD",
        "Method must be cash, gcash, or other."
      );
    }

    const result = await createPayment(
      store_id,
      customerId,
      parsedAmount,
      parsedMethod as PaymentMethod,
      note || null,
      user_id,
      client_mutation_id || null,
      device_id || null,
      local_id || null
    );
    await logAuditSafe(
      {
        storeId: store_id,
        userId: user_id,
        ip: req.ip || null,
        userAgent: req.get("User-Agent") || null,
      },
      "payment.create",
      "payment",
      result.payment_id,
      {
        customer_id: customerId,
        amount: parsedAmount,
        method: parsedMethod,
      }
    );
    logger.info("payment.create_succeeded", {
      store_id,
      user_id,
      payment_id: result.payment_id,
      customer_id: customerId,
      amount: parsedAmount,
      method: parsedMethod,
      client_mutation_id: client_mutation_id || null,
      device_id: device_id || null,
      local_id: local_id || null,
    });

    return successResponse(res, "Payment created successfully", result, 201);
  } catch (err: any) {
    logger.error("payment.create_failed", {
      error: err,
      store_id: req.user?.store_id || null,
      user_id: req.user?.user_id || null,
      customer_id: req.body?.customer_id || null,
      amount: Number.isFinite(Number(req.body?.amount))
        ? Number(req.body.amount)
        : null,
      method: req.body?.method || null,
      client_mutation_id: req.body?.client_mutation_id || null,
      device_id: req.body?.device_id || null,
      local_id: req.body?.local_id || null,
    });
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function listPaymentsHandler(req: Request, res: Response) {
  try {
    const { customer_id, from, to } = req.query;
    const { store_id } = req.user!;
    const customerId = customer_id
      ? parseId(
          customer_id,
          "INVALID_CUSTOMER_ID",
          "Customer ID must be a valid number if provided."
        )
      : null;

    const rows = await listPayments(
      store_id,
      customerId,
      from ? String(from) : null,
      to ? String(to) : null
    );
    const payments = safeJSONParse<any[]>(rows?.[0]?.payments_json, []);

    return successResponse(res, "Payments fetched successfully", payments);
  } catch (err: any) {
    logger.error("payment.list_failed", {
      error: err,
      store_id: req.user?.store_id || null,
      customer_id: req.query?.customer_id || null,
      from: req.query?.from || null,
      to: req.query?.to || null,
    });
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function voidPaymentHandler(req: Request, res: Response) {
  try {
    const paymentId = parseId(
      req.params.id,
      "INVALID_PAYMENT_ID",
      "Payment ID is required and must be a valid number."
    );
    const { store_id, user_id } = req.user!;

    const result = await voidPayment(store_id, paymentId, user_id);
    await logAuditSafe(
      {
        storeId: store_id,
        userId: user_id,
        ip: req.ip || null,
        userAgent: req.get("User-Agent") || null,
      },
      "payment.void",
      "payment",
      paymentId
    );
    logger.info("payment.void_succeeded", {
      store_id,
      user_id,
      payment_id: paymentId,
      affected_rows: result.affected_rows,
    });

    return successResponse(res, "Payment voided successfully", result);
  } catch (err: any) {
    logger.error("payment.void_failed", {
      error: err,
      store_id: req.user?.store_id || null,
      user_id: req.user?.user_id || null,
      payment_id: req.params.id || null,
    });
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
