import { Request, Response } from "express";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../services/customer.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { errorResponse, successResponse } from "../utils/response.util";

function parseId(value: unknown, code: string, message: string) {
  const id = Number(value);
  if (!value || !Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, code, message);
  }
  return id;
}

export async function createCustomerHandler(req: Request, res: Response) {
  try {
    const { name, phone, photo_url, notes } = req.body;
    const { store_id } = req.user!;

    if (!name || typeof name !== "string") {
      throw new ApiError(400, "NAME_REQUIRED", "Customer name is required.");
    }

    const result = await createCustomer(
      store_id,
      name.trim(),
      phone || null,
      photo_url || null,
      notes || null
    );

    return successResponse(res, "Customer created successfully", result, 201);
  } catch (err: any) {
    console.error("Customer create error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function updateCustomerHandler(req: Request, res: Response) {
  try {
    const customerId = parseId(
      req.params.id,
      "INVALID_CUSTOMER_ID",
      "Customer ID is required and must be a valid number."
    );
    const { name, phone, photo_url, notes } = req.body;
    const { store_id } = req.user!;

    if (!name || typeof name !== "string") {
      throw new ApiError(400, "NAME_REQUIRED", "Customer name is required.");
    }

    const result = await updateCustomer(
      store_id,
      customerId,
      name.trim(),
      phone || null,
      photo_url || null,
      notes || null
    );

    return successResponse(res, "Customer updated successfully", result);
  } catch (err: any) {
    console.error("Customer update error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function deleteCustomerHandler(req: Request, res: Response) {
  try {
    const customerId = parseId(
      req.params.id,
      "INVALID_CUSTOMER_ID",
      "Customer ID is required and must be a valid number."
    );
    const { store_id } = req.user!;

    const result = await deleteCustomer(store_id, customerId);

    return successResponse(res, "Customer deleted successfully", result);
  } catch (err: any) {
    console.error("Customer delete error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function getCustomersHandler(req: Request, res: Response) {
  try {
    const { id, search } = req.query;
    const { store_id } = req.user!;

    const customerId = id
      ? parseId(
          id,
          "INVALID_CUSTOMER_ID",
          "Customer ID must be a valid number if provided."
        )
      : null;
    const rows = await getCustomers(
      store_id,
      customerId,
      search ? String(search) : null
    );
    const customers = safeJSONParse<any[]>(rows?.[0]?.customers_json, []);

    return successResponse(res, "Customers fetched successfully", customers);
  } catch (err: any) {
    console.error("Customer fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
