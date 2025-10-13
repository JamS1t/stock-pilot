import { Request, Response } from "express";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  getCategories,
} from "../services/category.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { successResponse, errorResponse } from "../utils/response.util";

export async function createCategoryHandler(req: Request, res: Response) {
  try {
    const { name } = req.body;
    const { store_id } = req.user!; // ✅ Now pulled securely from JWT

    if (!name)
      throw new ApiError(400, "NAME_REQUIRED", "Category name is required.");

    const result = await createCategory(store_id, name);

    return successResponse(res, "Category created successfully", result, 201);
  } catch (err: any) {
    console.error("Category create error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function deleteCategoryHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { store_id } = req.user!;

    if (!id)
      throw new ApiError(400, "ID_REQUIRED", "Category ID is required.");

    const result = await deleteCategory(store_id, Number(id));

    return successResponse(res, "Category deleted successfully", result);
  } catch (err: any) {
    console.error("Category delete error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function updateCategoryHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const { store_id } = req.user!;

    if (!id)
      throw new ApiError(400, "ID_REQUIRED", "Category ID is required.");
    if (!name)
      throw new ApiError(400, "NAME_REQUIRED", "Category name is required.");

    const result = await updateCategory(store_id, Number(id), name);

    return successResponse(res, "Category updated successfully", result);
  } catch (err: any) {
    console.error("Category update error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function getCategoriesHandler(req: Request, res: Response) {
  try {
    const { id } = req.query;
    const { store_id } = req.user!;

    const categories = await getCategories(
      store_id,
      id ? Number(id) : null
    );

    // ✅ Safe parsing for both objects and arrays
    const categoryJSON = safeJSONParse<any[]>(
      categories?.[0]?.categories_json,
      []
    );

    return successResponse(
      res,
      "Categories fetched successfully",
      categoryJSON
    );
  } catch (err: any) {
    console.error("Category fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}