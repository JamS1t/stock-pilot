import {
  CreateCustomer,
  DeleteCustomer,
  GetCustomers,
  UpdateCustomer,
} from "../db/procedures/customer.proc";
import { ApiError } from "../utils/apiError";

function getAffected(result: any) {
  return result?.[0]?.affected_rows ?? result?.[0]?.affected ?? 0;
}

export async function createCustomer(
  storeId: number,
  name: string,
  phone: string | null = null,
  photoUrl: string | null = null,
  notes: string | null = null
) {
  const result = await CreateCustomer(storeId, name, phone, photoUrl, notes);
  const customerId = result?.[0]?.id ?? null;

  if (!customerId) {
    throw new ApiError(500, "CREATE_FAILED", "Failed to create customer.");
  }

  return { customer_id: customerId };
}

export async function updateCustomer(
  storeId: number,
  customerId: number,
  name: string,
  phone: string | null = null,
  photoUrl: string | null = null,
  notes: string | null = null
) {
  const result = await UpdateCustomer(
    storeId,
    customerId,
    name,
    phone,
    photoUrl,
    notes
  );
  const affected = getAffected(result);

  if (affected === 0) {
    throw new ApiError(
      404,
      "CUSTOMER_NOT_FOUND",
      "No customer found with the given ID."
    );
  }

  return { affected_rows: affected };
}

export async function deleteCustomer(storeId: number, customerId: number) {
  const result = await DeleteCustomer(storeId, customerId);
  const affected = getAffected(result);

  if (affected === 0) {
    throw new ApiError(
      404,
      "CUSTOMER_NOT_FOUND",
      "No customer found with the given ID."
    );
  }

  return { affected_rows: affected };
}

export async function getCustomers(
  storeId: number,
  customerId: number | null = null,
  search: string | null = null
) {
  return GetCustomers(storeId, customerId, search);
}
