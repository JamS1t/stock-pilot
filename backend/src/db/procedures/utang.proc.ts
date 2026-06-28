import { callProc } from "../callProc";

export type UtangSource = "manual" | "voice" | "ocr";

export interface UtangItemInput {
  product_id?: number | null;
  name: string;
  quantity?: number;
  unit_price?: number | null;
  line_total?: number | null;
}

// CreateUtang(store_id, customer_id, amount, note, source, created_by, items_json, client_mutation_id, device_id, local_id)
export async function CreateUtang(
  storeId: number,
  customerId: number,
  amount: number,
  note: string | null = null,
  source: UtangSource = "manual",
  createdBy: number | null = null,
  items: UtangItemInput[] | null = null,
  clientMutationId: string | null = null,
  deviceId: string | null = null,
  localId: string | null = null
) {
  return callProc("CreateUtang", [
    storeId,
    customerId,
    amount,
    note,
    source,
    createdBy,
    items && items.length ? JSON.stringify(items) : null,
    clientMutationId,
    deviceId,
    localId,
  ]);
}

// ListUtang(store_id, customer_id, from, to) — returns [{ entries_json }]
export async function ListUtang(
  storeId: number,
  customerId: number | null = null,
  from: Date | string | null = null,
  to: Date | string | null = null
) {
  const rows = await callProc<any>("ListUtang", [storeId, customerId, from, to]);
  return rows;
}

// VoidUtang(store_id, entry_id, voided_by)
export async function VoidUtang(
  storeId: number,
  entryId: number,
  voidedBy: number | null = null
) {
  return callProc("VoidUtang", [storeId, entryId, voidedBy]);
}

// GetCustomerBalance(store_id, customer_id) — returns [{ balance_json }]
export async function GetCustomerBalance(storeId: number, customerId: number) {
  const rows = await callProc<any>("GetCustomerBalance", [storeId, customerId]);
  return rows[0] ?? null;
}

// GetWhoOwes(store_id) — returns [{ who_owes_json }]
export async function GetWhoOwes(storeId: number) {
  const rows = await callProc<any>("GetWhoOwes", [storeId]);
  return rows;
}
