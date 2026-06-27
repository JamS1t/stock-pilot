import { Request, Response } from "express";
import { UtangItemInput, UtangSource } from "../db/procedures/utang.proc";
import {
  createUtang,
  getCustomerBalance,
  getWhoOwes,
  listUtang,
  voidUtang,
} from "../services/utang.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { errorResponse, successResponse } from "../utils/response.util";

const UTANG_SOURCES: UtangSource[] = ["manual", "voice", "ocr"];

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

function parseItems(value: unknown) {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) {
    throw new ApiError(400, "INVALID_ITEMS", "Items must be an array.");
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new ApiError(400, "INVALID_ITEMS", "Each item must be an object.");
    }

    const input = item as UtangItemInput;
    if (!input.name || typeof input.name !== "string") {
      throw new ApiError(
        400,
        "INVALID_ITEM_NAME",
        `Item at index ${index} must have a name.`
      );
    }

    return input;
  });
}

export async function createUtangHandler(req: Request, res: Response) {
  try {
    const { customer_id, amount, note, source, items } = req.body;
    const { store_id, user_id } = req.user!;
    const customerId = parseId(
      customer_id,
      "INVALID_CUSTOMER_ID",
      "Customer ID is required and must be a valid number."
    );
    const parsedAmount = parsePositiveAmount(amount);
    const parsedSource = source ? String(source) : "manual";

    if (!UTANG_SOURCES.includes(parsedSource as UtangSource)) {
      throw new ApiError(
        400,
        "INVALID_SOURCE",
        "Source must be manual, voice, or ocr."
      );
    }

    const result = await createUtang(
      store_id,
      customerId,
      parsedAmount,
      note || null,
      parsedSource as UtangSource,
      user_id,
      parseItems(items)
    );

    return successResponse(res, "Utang entry created successfully", result, 201);
  } catch (err: any) {
    console.error("Utang create error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function listUtangHandler(req: Request, res: Response) {
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

    const rows = await listUtang(
      store_id,
      customerId,
      from ? String(from) : null,
      to ? String(to) : null
    );
    const entries = safeJSONParse<any[]>(rows?.[0]?.entries_json, []);

    return successResponse(res, "Utang entries fetched successfully", entries);
  } catch (err: any) {
    console.error("Utang list error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function voidUtangHandler(req: Request, res: Response) {
  try {
    const entryId = parseId(
      req.params.id,
      "INVALID_ENTRY_ID",
      "Utang entry ID is required and must be a valid number."
    );
    const { store_id, user_id } = req.user!;

    const result = await voidUtang(store_id, entryId, user_id);

    return successResponse(res, "Utang entry voided successfully", result);
  } catch (err: any) {
    console.error("Utang void error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function getCustomerBalanceHandler(req: Request, res: Response) {
  try {
    const customerId = parseId(
      req.params.id,
      "INVALID_CUSTOMER_ID",
      "Customer ID is required and must be a valid number."
    );
    const { store_id } = req.user!;

    const row = await getCustomerBalance(store_id, customerId);
    const balance = safeJSONParse<any>(row?.balance_json, null);

    return successResponse(res, "Customer balance fetched successfully", balance);
  } catch (err: any) {
    console.error("Customer balance error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function getWhoOwesHandler(req: Request, res: Response) {
  try {
    const { store_id } = req.user!;

    const rows = await getWhoOwes(store_id);
    const whoOwes = safeJSONParse<any[]>(rows?.[0]?.who_owes_json, []);

    return successResponse(res, "Who owes fetched successfully", whoOwes);
  } catch (err: any) {
    console.error("Who owes error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
