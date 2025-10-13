import { callProc } from "../callProc";

export async function CreateCategory(storeId: number, name: string) {
  return callProc("CreateCategory", [storeId, name]);
}

export async function DeleteCategory(storeId: number, id: number) {
  return callProc("DeleteCategory", [storeId, id]);
}

export async function UpdateCategory(
  storeId: number,
  id: number,
  name: string
) {
  return callProc("UpdateCategory", [storeId, id, name]);
}

export async function GetCategories(storeId: number, id: number | null = null) {
  const rows = await callProc<any>("GetCategories", [storeId, id]);
  return rows;
}
