import { Request, Response } from "express";
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
  getSuppliers,
} from "../services/supplier.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { successResponse, errorResponse } from "../utils/response.util";

// ✅ Create Supplier
export async function createSupplierHandler(req: Request, res: Response) {
  try {
    const { name, contact_person, phone, email, address } = req.body;
    const { store_id } = req.user!; // ✅ from JWT

    // --- Field validations ---
    if (!name || typeof name !== "string" || name.trim() === "")
      throw new ApiError(
        400,
        "INVALID_NAME",
        "Supplier name is required and must be a non-empty string."
      );
    if (phone && !/^[0-9+\-\s()]+$/.test(phone))
      throw new ApiError(
        400,
        "INVALID_PHONE",
        "Phone number contains invalid characters."
      );
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ApiError(400, "INVALID_EMAIL", "Invalid email format.");
    if (address && typeof address !== "string")
      throw new ApiError(400, "INVALID_ADDRESS", "Address must be a string.");
    if (contact_person && typeof contact_person !== "string")
      throw new ApiError(
        400,
        "INVALID_CONTACT_PERSON",
        "Contact person must be a string."
      );

    const result = await createSupplier(
      store_id,
      name.trim(),
      contact_person || null,
      phone || null,
      email || null,
      address || null
    );

    return successResponse(res, "Supplier created successfully", result, 201);
  } catch (err: any) {
    console.error("Supplier create error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

// ✅ Delete Supplier
export async function deleteSupplierHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { store_id } = req.user!;

    if (!id || isNaN(Number(id)))
      throw new ApiError(
        400,
        "INVALID_ID",
        "Supplier ID is required and must be a valid number."
      );

    const result = await deleteSupplier(store_id, Number(id));

    return successResponse(res, "Supplier deleted successfully", result);
  } catch (err: any) {
    console.error("Supplier delete error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

// ✅ Update Supplier
export async function updateSupplierHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address } = req.body;
    const { store_id } = req.user!;

    // --- Field validations ---
    if (!id || isNaN(Number(id)))
      throw new ApiError(
        400,
        "INVALID_ID",
        "Supplier ID is required and must be a valid number."
      );
    if (!name || typeof name !== "string" || name.trim() === "")
      throw new ApiError(
        400,
        "INVALID_NAME",
        "Supplier name is required and must be a non-empty string."
      );
    if (phone && !/^[0-9+\-\s()]+$/.test(phone))
      throw new ApiError(
        400,
        "INVALID_PHONE",
        "Phone number contains invalid characters."
      );
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ApiError(400, "INVALID_EMAIL", "Invalid email format.");
    if (address && typeof address !== "string")
      throw new ApiError(400, "INVALID_ADDRESS", "Address must be a string.");
    if (contact_person && typeof contact_person !== "string")
      throw new ApiError(
        400,
        "INVALID_CONTACT_PERSON",
        "Contact person must be a string."
      );

    const result = await updateSupplier(
      store_id,
      Number(id),
      name.trim(),
      contact_person || null,
      phone || null,
      email || null,
      address || null
    );

    return successResponse(res, "Supplier updated successfully", result);
  } catch (err: any) {
    console.error("Supplier update error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

// ✅ Get Suppliers
export async function getSuppliersHandler(req: Request, res: Response) {
  try {
    const { id } = req.query;
    const { store_id } = req.user!;

    if (id && isNaN(Number(id)))
      throw new ApiError(
        400,
        "INVALID_ID",
        "Supplier ID must be a valid number if provided."
      );

    const suppliers = await getSuppliers(store_id, id ? Number(id) : null);

    const supplierJSON = safeJSONParse<any[]>(
      suppliers?.[0]?.json_suppliers,
      []
    );

    return successResponse(res, "Suppliers fetched successfully", supplierJSON);
  } catch (err: any) {
    console.error("Supplier fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
