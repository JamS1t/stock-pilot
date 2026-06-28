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

const REQUIRED_NUMBER_FIELDS = {
  unit_price: "Unit price",
  selling_price: "Selling price",
  stock: "Stock",
  category_id: "Category",
};

function parseRequiredNumber(
  value: unknown,
  field: keyof typeof REQUIRED_NUMBER_FIELDS,
  options: { min?: number; integer?: boolean } = {}
) {
  if (value === null || value === undefined || value === "") {
    throw new ApiError(
      400,
      "MISSING_REQUIRED_FIELDS",
      `${REQUIRED_NUMBER_FIELDS[field]} is required.`
    );
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ApiError(
      400,
      "INVALID_NUMBER",
      `${REQUIRED_NUMBER_FIELDS[field]} must be a valid number.`
    );
  }

  if (options.integer && !Number.isInteger(parsed)) {
    throw new ApiError(
      400,
      "INVALID_INTEGER",
      `${REQUIRED_NUMBER_FIELDS[field]} must be a whole number.`
    );
  }

  if (options.min !== undefined && parsed < options.min) {
    throw new ApiError(
      400,
      "INVALID_NUMBER_RANGE",
      `${REQUIRED_NUMBER_FIELDS[field]} must be at least ${options.min}.`
    );
  }

  return parsed;
}

function parseOptionalId(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, "INVALID_ID", `${label} must be a valid number.`);
  }
  return parsed;
}

async function assertBarcodeIsAvailable(
  storeId: number,
  barcode: string | null,
  currentProductId: number | null = null
) {
  const normalizedBarcode = barcode?.trim();
  if (!normalizedBarcode) return;

  const products = await getProducts(storeId, normalizedBarcode, null, null, null);
  const productJSON = safeJSONParse<any[]>(products?.[0]?.products_json, []);
  const duplicate = productJSON.find(
    (product) =>
      String(product.barcode || "").trim() === normalizedBarcode &&
      product.product_id !== currentProductId
  );

  if (duplicate) {
    throw new ApiError(
      409,
      "DUPLICATE_BARCODE",
      "Barcode is already assigned to another product."
    );
  }
}

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

    if (!name?.trim()) {
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELDS",
        "Product name is required."
      );
    }
    const parsedUnitPrice = parseRequiredNumber(unit_price, "unit_price", {
      min: 0,
    });
    const parsedSellingPrice = parseRequiredNumber(
      selling_price,
      "selling_price",
      { min: 0.01 }
    );
    const parsedStock = parseRequiredNumber(stock, "stock", {
      min: 0,
      integer: true,
    });
    const parsedCategoryId = parseRequiredNumber(category_id, "category_id", {
      min: 1,
      integer: true,
    });
    const parsedSupplierId = parseOptionalId(supplier_id, "Supplier ID");
    const normalizedBarcode = barcode?.trim() || null;

    await assertBarcodeIsAvailable(store_id, normalizedBarcode);

    const result = await createProduct(
      store_id,
      name.trim(),
      sku?.trim() || null,
      parsedUnitPrice,
      parsedSellingPrice,
      parsedStock,
      parsedCategoryId,
      parsedSupplierId,
      normalizedBarcode
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
    if (!name?.trim()) {
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELDS",
        "Product name is required."
      );
    }
    const parsedUnitPrice = parseRequiredNumber(unit_price, "unit_price", {
      min: 0,
    });
    const parsedSellingPrice = parseRequiredNumber(
      selling_price,
      "selling_price",
      { min: 0.01 }
    );
    const parsedStock = parseRequiredNumber(stock, "stock", {
      min: 0,
      integer: true,
    });
    const parsedCategoryId = parseRequiredNumber(category_id, "category_id", {
      min: 1,
      integer: true,
    });
    const parsedSupplierId = parseOptionalId(supplier_id, "Supplier ID");
    const normalizedBarcode = barcode?.trim() || null;

    await assertBarcodeIsAvailable(store_id, normalizedBarcode, Number(id));

    const result = await updateProduct(
      store_id,
      Number(id),
      name.trim(),
      sku?.trim() || null,
      parsedUnitPrice,
      parsedSellingPrice,
      parsedStock,
      parsedCategoryId,
      parsedSupplierId,
      normalizedBarcode
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

    const supplierFilterId = supplier_id ? Number(supplier_id) : null;
    const products = await getProducts(
      store_id,
      search ? String(search) : null,
      category_id ? Number(category_id) : null,
      supplierFilterId,
      stock_status
        ? (String(stock_status) as "Out of Stock" | "Low Stock" | "In Stock")
        : null
    );

    let productJSON = safeJSONParse<any[]>(products?.[0]?.products_json, []);
    if (supplierFilterId !== null) {
      productJSON = productJSON.filter(
        (product) => Number(product.supplier_id) === supplierFilterId
      );
    }

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
