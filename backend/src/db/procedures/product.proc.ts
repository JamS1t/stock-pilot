import { callProc } from "../callProc";

export async function CreateProduct(
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
  return callProc("CreateProduct", [
    storeId,
    name,
    sku,
    unitPrice,
    sellingPrice,
    stock,
    categoryId,
    supplierId,
    barcode,
  ]);
}

export async function DeleteProduct(storeId: number, id: number) {
  return callProc("DeleteProduct", [storeId, id]);
}

export async function UpdateProduct(
  storeId: number,
  productId: number,
  name: string,
  sku: string | null,
  unitPrice: number,
  sellingPrice: number,
  stock: number,
  categoryId: number,
  supplierId: number | null,
  barcode: string | null
) {
  return callProc("UpdateProduct", [
    storeId,
    productId,
    name,
    sku,
    unitPrice,
    sellingPrice,
    stock,
    categoryId,
    supplierId,
    barcode,
  ]);
}

export async function GetProducts(
  storeId: number,
  search: string | null = null,
  categoryId: number | null = null,
  supplierId: number | null = null,
  stockStatus: "Out of Stock" | "Low Stock" | "In Stock" | null = null,
  noBarcodeOnly = false,
  sortBy = "name",
  sortDir = "asc",
  limit: number | null = null,
  offset: number | null = null
) {
  try {
    const rows = await callProc<any>("GetProducts", [
      storeId,
      search,
      categoryId,
      supplierId,
      stockStatus,
      noBarcodeOnly ? 1 : 0,
      sortBy,
      sortDir,
      limit,
      offset,
    ]);
    return rows;
  } catch (err: any) {
    if (err?.code !== "ER_SP_WRONG_NO_OF_ARGS") throw err;
  }

  try {
    const rows = await callProc<any>("GetProducts", [
      storeId,
      search,
      categoryId,
      supplierId,
      stockStatus,
    ]);
    return rows;
  } catch (err: any) {
    if (err?.code !== "ER_SP_WRONG_NO_OF_ARGS") throw err;

    return callProc<any>("GetProducts", [
      storeId,
      search,
      categoryId,
      stockStatus,
    ]);
  }
}

export async function GetProductById(storeId: number, id: number) {
  const rows = await callProc<any>("GetProductById", [storeId, id]);
  return rows[0] ?? null;
}

export async function SearchProductsPOS(
  storeId: number,
  search: string | null = null,
  categoryId: number | null = null
) {
  const rows = await callProc<any>("SearchProductsPOS", [
    storeId,
    search,
    categoryId,
    "all",
  ]);
  return rows;
}
