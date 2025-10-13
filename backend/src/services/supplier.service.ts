import {
  CreateSupplier,
  DeleteSupplier,
  UpdateSupplier,
  GetSuppliers,
} from "../db/procedures/supplier.proc";
import { ApiError } from "../utils/apiError";

export async function createSupplier(
  storeId: number,
  name: string,
  contact_person: string | null = null,
  phone: string | null = null,
  email: string | null = null,
  address: string | null = null
) {
  const result = await CreateSupplier(
    storeId,
    name,
    contact_person,
    phone,
    email,
    address
  );
  const supplierId = result?.[0]?.id ?? null;

  if (!supplierId) {
    throw new ApiError(500, "CREATE_FAILED", "Failed to create supplier.");
  }

  return { supplier_id: supplierId };
}

export async function deleteSupplier(storeId: number, supplierId: number) {
  const result = await DeleteSupplier(storeId, supplierId);
  const affected = result?.[0]?.affected_rows ?? 0;

  if (affected === 0) {
    throw new ApiError(
      404,
      "SUPPLIER_NOT_FOUND",
      "No supplier found with the given ID."
    );
  }

  return { affected_rows: affected };
}

export async function updateSupplier(
  storeId: number,
  supplierId: number,
  name: string,
  contact_person: string | null = null,
  phone: string | null = null,
  email: string | null = null,
  address: string | null = null
) {
  const result = await UpdateSupplier(
    storeId,
    supplierId,
    name,
    contact_person,
    phone,
    email,
    address
  );
  const affected = result?.[0]?.affected_rows ?? 0;

  if (affected === 0) {
    throw new ApiError(
      404,
      "SUPPLIER_NOT_FOUND",
      "No supplier found with the given ID."
    );
  }

  return { affected_rows: affected };
}

export async function getSuppliers(
  storeId: number,
  supplierId: number | null = null
) {
  const rows = await GetSuppliers(storeId, supplierId);
  return rows;
}
