import {
  CreateProduct,
  DeleteProduct,
  UpdateProduct,
  GetProducts,
  GetProductById,
  SearchProductsPOS,
} from "../db/procedures/product.proc";
import { ApiError } from "../utils/apiError";

export async function createProduct(
  storeId: number,
  name: string,
  sku: string | null,
  unitPrice: number,
  sellingPrice: number,
  stock: number,
  categoryId: number,
  supplierId: number | null,
  barcode: string | null
) {
  const result = await CreateProduct(
    storeId,
    name,
    sku,
    unitPrice,
    sellingPrice,
    stock,
    categoryId,
    supplierId,
    barcode
  );
  const productId = result?.[0]?.id ?? null;

  if (!productId) {
    throw new ApiError(500, "CREATE_FAILED", "Failed to create product.");
  }

  return { product_id: productId };
}

export async function deleteProduct(storeId: number, id: number) {
  const result = await DeleteProduct(storeId, id);
  const affected = result?.[0]?.affected_rows ?? 0;

  if (affected === 0) {
    throw new ApiError(
      404,
      "PRODUCT_NOT_FOUND",
      "No product found with the given ID."
    );
  }

  return { affected_rows: affected };
}

export async function updateProduct(
  storeId: number,
  id: number,
  name: string,
  sku: string | null,
  unitPrice: number,
  sellingPrice: number,
  stock: number,
  categoryId: number,
  supplierId: number | null,
  barcode: string | null
) {
  const result = await UpdateProduct(
    storeId,
    id,
    name,
    sku,
    unitPrice,
    sellingPrice,
    stock,
    categoryId,
    supplierId,
    barcode
  );
  const affected = result?.[0]?.affected_rows ?? 0;

  if (affected === 0) {
    throw new ApiError(
      404,
      "PRODUCT_NOT_FOUND",
      "No product found with the given ID."
    );
  }

  return { affected_rows: affected };
}

export async function getProducts(
  storeId: number,
  search: string | null = null,
  categoryId: number | null = null,
  supplierId: number | null = null,
  stockStatus: "Out of Stock" | "Low Stock" | "In Stock" | null = null
) {
  const rows = await GetProducts(
    storeId,
    search,
    categoryId,
    supplierId,
    stockStatus
  );
  return rows;
}

export async function getProductById(storeId: number, id: number) {
  const rows = await GetProductById(storeId, id);
  return rows;
}

export async function searchProductsPOS(
  storeId: number,
  search: string | null = null,
  categoryId: number | null = null
) {
  const rows = await SearchProductsPOS(storeId, search, categoryId);
  return rows;
}
