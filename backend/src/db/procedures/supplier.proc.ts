import { callProc } from "../callProc";

// ✅ CreateSupplier(store_id, name, contact_person, phone, email, address)
export async function CreateSupplier(
  store_id: number,
  name: string,
  contact_person: string | null = null,
  phone: string | null = null,
  email: string | null = null,
  address: string | null = null
) {
  return callProc("CreateSupplier", [
    store_id,
    name,
    contact_person,
    phone,
    email,
    address,
  ]);
}

// ✅ DeleteSupplier(store_id, supplier_id)
export async function DeleteSupplier(store_id: number, supplier_id: number) {
  return callProc("DeleteSupplier", [store_id, supplier_id]);
}

// ✅ UpdateSupplier(store_id, supplier_id, name, contact_person, phone, email, address)
export async function UpdateSupplier(
  store_id: number,
  supplier_id: number,
  name: string,
  contact_person: string | null = null,
  phone: string | null = null,
  email: string | null = null,
  address: string | null = null
) {
  return callProc("UpdateSupplier", [
    store_id,
    supplier_id,
    name,
    contact_person,
    phone,
    email,
    address,
  ]);
}

// ✅ GetSuppliers(store_id, supplier_id)
export async function GetSuppliers(
  store_id: number,
  supplier_id: number | null = null
) {
  const rows = await callProc<any>("GetSuppliers", [
    store_id,
    supplier_id,
  ]);
  return rows;
}
