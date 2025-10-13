import {
  CreateCategory,
  DeleteCategory,
  UpdateCategory,
  GetCategories,
} from "../db/procedures/category.proc";
import { ApiError } from "../utils/apiError";

export async function createCategory(storeId: number, name: string) {
  const result = await CreateCategory(storeId, name);
  const categoryId = result?.[0]?.id ?? null;

  if (!categoryId) {
    throw new ApiError(500, "CREATE_FAILED", "Failed to create category.");
  }

  return { category_id: categoryId };
}

export async function deleteCategory(storeId: number, id: number) {
  const result = await DeleteCategory(storeId, id);
  const affected = result?.[0]?.affected_rows ?? 0;

  if (affected === 0) {
    throw new ApiError(
      404,
      "CATEGORY_NOT_FOUND",
      "No category found with the given ID."
    );
  }

  console.log(affected);

  return { affected_rows: affected };
}

export async function updateCategory(
  storeId: number,
  id: number,
  name: string
) {
  const result = await UpdateCategory(storeId, id, name);
  const affected = result?.[0]?.affected_rows ?? 0;

  if (affected === 0) {
    throw new ApiError(
      404,
      "CATEGORY_NOT_FOUND",
      "No category found with the given ID."
    );
  }

  return { affected_rows: affected };
}

export async function getCategories(storeId: number, id: number | null = null) {
  const rows = await GetCategories(storeId, id);
  return rows;
}
