import { Request, Response } from "express";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  getProducts,
  getProductById,
  searchProductsPOS,
} from "../services/product.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { successResponse, errorResponse } from "../utils/response.util";

export async function createProductHandler(req: Request, res: Response) {
  try {
    const {
      name,
      sku,
      unit_price,
      selling_price,
      stock,
      category_id,
      supplier_id,
      barcode,
    } = req.body;
    const { store_id } = req.user!;

    if (!name || !unit_price || !selling_price || !stock || !category_id) {
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELDS",
        "Missing required fields for product creation."
      );
    }

    const result = await createProduct(
      store_id,
      name,
      sku || null,
      unit_price,
      selling_price,
      stock,
      category_id,
      supplier_id,
      barcode || null
    );

    return successResponse(res, "Product created successfully", result, 201);
  } catch (err: any) {
    console.error("Product create error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function deleteProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { store_id } = req.user!;

    if (!id || isNaN(Number(id)))
      throw new ApiError(
        400,
        "INVALID_ID",
        "Product ID is required and must be a valid number."
      );

    const result = await deleteProduct(store_id, Number(id));

    return successResponse(res, "Product deleted successfully", result);
  } catch (err: any) {
    console.error("Product delete error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function updateProductHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      unit_price,
      selling_price,
      stock,
      category_id,
      supplier_id,
      barcode,
    } = req.body;
    const { store_id } = req.user!;

    if (!id || isNaN(Number(id)))
      throw new ApiError(
        400,
        "INVALID_ID",
        "Product ID is required and must be a valid number."
      );
    if (!name || !unit_price || !selling_price || !stock || !category_id) {
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELDS",
        "Missing required fields for product update."
      );
    }

    const result = await updateProduct(
      store_id,
      Number(id),
      name,
      sku || null,
      unit_price,
      selling_price,
      stock,
      category_id,
      supplier_id || null,
      barcode || null
    );

    return successResponse(res, "Product updated successfully", result);
  } catch (err: any) {
    console.error("Product update error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function getProductsHandler(req: Request, res: Response) {
  try {
    const { search, category_id, supplier_id, stock_status } = req.query;
    const { store_id } = req.user!;

    if (category_id && isNaN(Number(category_id)))
      throw new ApiError(
        400,
        "INVALID_CATEGORY_ID",
        "Category ID must be a valid number if provided."
      );
    if (supplier_id && isNaN(Number(supplier_id)))
      throw new ApiError(
        400,
        "INVALID_SUPPLIER_ID",
        "Supplier ID must be a valid number if provided."
      );

    const products = await getProducts(
      store_id,
      search ? String(search) : null,
      category_id ? Number(category_id) : null,
      stock_status
        ? (String(stock_status) as "Out of Stock" | "Low Stock" | "In Stock")
        : null
    );

    const productJSON = safeJSONParse<any[]>(products?.[0]?.products_json, []);

    return successResponse(res, "Products fetched successfully", productJSON);
  } catch (err: any) {
    console.error("Product fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function getProductByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { store_id } = req.user!;

    if (!id || isNaN(Number(id)))
      throw new ApiError(
        400,
        "INVALID_ID",
        "Product ID is required and must be a valid number."
      );

    const product = await getProductById(store_id, Number(id));

    const productJSON = safeJSONParse<any>(product?.product_json, null);

    if (!productJSON)
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");

    return successResponse(res, "Product fetched successfully", productJSON);
  } catch (err: any) {
    console.error("Product fetch by ID error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function searchProductsPOSHandler(req: Request, res: Response) {
  try {
    const { search, category_id } = req.query;
    console.log("HELLO");
    const { store_id } = req.user!;

    if (!search || typeof search !== "string") {
      throw new ApiError(
        400,
        "SEARCH_TERM_REQUIRED",
        "Search term is required and must be a string."
      );
    }
    if (category_id && isNaN(Number(category_id)))
      throw new ApiError(
        400,
        "INVALID_CATEGORY_ID",
        "Category ID must be a valid number if provided."
      );

    const products = await searchProductsPOS(
      store_id,
      search,
      category_id ? Number(category_id) : null
    );

    const productJSON = safeJSONParse<any[]>(products?.[0]?.products_json, []);

    return successResponse(
      res,
      "Products for POS fetched successfully",
      productJSON
    );
  } catch (err: any) {
    console.error("Product search POS error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
