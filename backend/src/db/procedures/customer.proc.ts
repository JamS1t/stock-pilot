import { callProc } from "../callProc";

// CreateCustomer(store_id, name, phone, photo_url, notes)
export async function CreateCustomer(
  storeId: number,
  name: string,
  phone: string | null = null,
  photoUrl: string | null = null,
  notes: string | null = null
) {
  return callProc("CreateCustomer", [storeId, name, phone, photoUrl, notes]);
}

// UpdateCustomer(store_id, customer_id, name, phone, photo_url, notes)
export async function UpdateCustomer(
  storeId: number,
  customerId: number,
  name: string,
  phone: string | null = null,
  photoUrl: string | null = null,
  notes: string | null = null
) {
  return callProc("UpdateCustomer", [
    storeId,
    customerId,
    name,
    phone,
    photoUrl,
    notes,
  ]);
}

// DeleteCustomer(store_id, customer_id) — soft delete
export async function DeleteCustomer(storeId: number, customerId: number) {
  return callProc("DeleteCustomer", [storeId, customerId]);
}

// GetCustomers(store_id, customer_id, search) — returns [{ customers_json }]
export async function GetCustomers(
  storeId: number,
  customerId: number | null = null,
  search: string | null = null
) {
  const rows = await callProc<any>("GetCustomers", [storeId, customerId, search]);
  return rows;
}
