import { Request, Response } from "express";
import {
  getStoreSettings,
  listStoreUsers,
  StoreRole,
  updateStoreSettings,
  updateStoreUserRole,
} from "../services/settings.service";
import { ApiError } from "../utils/apiError";
import { errorResponse, successResponse } from "../utils/response.util";

const STORE_ROLES: StoreRole[] = ["owner", "admin", "staff"];

function cleanOptionalString(value: unknown) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function parseRequiredString(value: unknown, label: string) {
  const trimmed = cleanOptionalString(value);
  if (!trimmed) {
    throw new ApiError(400, "MISSING_FIELD", `${label} is required.`);
  }
  return trimmed;
}

function parseBoolean(value: unknown, label: string) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  throw new ApiError(400, "INVALID_BOOLEAN", `${label} must be true or false.`);
}

function parseTaxRate(value: unknown) {
  const rate = Number(value ?? 0);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new ApiError(
      400,
      "INVALID_TAX_RATE",
      "Tax rate must be a number between 0 and 100."
    );
  }
  return rate;
}

function parseId(value: unknown, code: string, message: string) {
  const id = Number(value);
  if (!value || !Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, code, message);
  }
  return id;
}

export function parseStoreSettingsBody(body: Record<string, unknown>) {
  return {
    name: parseRequiredString(body.name, "Store name"),
    timezone: parseRequiredString(body.timezone, "Timezone"),
    currency: parseRequiredString(body.currency, "Currency"),
    receipt_name: cleanOptionalString(body.receipt_name),
    receipt_address: cleanOptionalString(body.receipt_address),
    receipt_phone: cleanOptionalString(body.receipt_phone),
    receipt_footer: cleanOptionalString(body.receipt_footer),
    tax_enabled: parseBoolean(body.tax_enabled ?? false, "Tax enabled"),
    tax_rate: parseTaxRate(body.tax_rate),
    tax_label: parseRequiredString(body.tax_label || "Tax", "Tax label"),
    require_cash_session: parseBoolean(
      body.require_cash_session ?? false,
      "Require cash session"
    ),
    allow_negative_stock: parseBoolean(
      body.allow_negative_stock ?? false,
      "Allow negative stock"
    ),
  };
}

export async function getStoreSettingsHandler(req: Request, res: Response) {
  try {
    const { store_id } = req.user!;
    const settings = await getStoreSettings(store_id);
    return successResponse(res, "Store settings fetched successfully", settings);
  } catch (err: any) {
    console.error("Store settings fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function updateStoreSettingsHandler(req: Request, res: Response) {
  try {
    const { store_id, user_id } = req.user!;
    const settings = await updateStoreSettings(
      store_id,
      parseStoreSettingsBody(req.body),
      {
        storeId: store_id,
        userId: user_id,
        ip: req.ip || null,
        userAgent: req.get("User-Agent") || null,
      }
    );
    return successResponse(res, "Store settings updated successfully", settings);
  } catch (err: any) {
    console.error("Store settings update error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function listStoreUsersHandler(req: Request, res: Response) {
  try {
    const { store_id } = req.user!;
    const users = await listStoreUsers(store_id);
    return successResponse(res, "Store users fetched successfully", users);
  } catch (err: any) {
    console.error("Store users fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function updateStoreUserRoleHandler(req: Request, res: Response) {
  try {
    const { store_id, user_id } = req.user!;
    const targetUserId = parseId(
      req.params.userId,
      "INVALID_USER_ID",
      "User ID is required and must be a valid number."
    );
    const role = String(req.body.role || "") as StoreRole;
    if (!STORE_ROLES.includes(role)) {
      throw new ApiError(400, "INVALID_ROLE", "Role must be owner, admin, or staff.");
    }

    const result = await updateStoreUserRole(
      store_id,
      targetUserId,
      role,
      {
        storeId: store_id,
        userId: user_id,
        ip: req.ip || null,
        userAgent: req.get("User-Agent") || null,
      }
    );
    return successResponse(res, "Store user role updated successfully", result);
  } catch (err: any) {
    console.error("Store user role update error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
