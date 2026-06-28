import { callProc } from "../callProc";

export type PaymentMethod = "cash" | "gcash" | "other";

// CreatePayment(store_id, customer_id, amount, method, note, created_by, client_mutation_id, device_id, local_id)
export async function CreatePayment(
  storeId: number,
  customerId: number,
  amount: number,
  method: PaymentMethod = "cash",
  note: string | null = null,
  createdBy: number | null = null,
  clientMutationId: string | null = null,
  deviceId: string | null = null,
  localId: string | null = null
) {
  return callProc("CreatePayment", [
    storeId,
    customerId,
    amount,
    method,
    note,
    createdBy,
    clientMutationId,
    deviceId,
    localId,
  ]);
}

// ListPayments(store_id, customer_id, from, to) — returns [{ payments_json }]
export async function ListPayments(
  storeId: number,
  customerId: number | null = null,
  from: Date | string | null = null,
  to: Date | string | null = null
) {
  const rows = await callProc<any>("ListPayments", [
    storeId,
    customerId,
    from,
    to,
  ]);
  return rows;
}

// VoidPayment(store_id, payment_id, voided_by)
export async function VoidPayment(
  storeId: number,
  paymentId: number,
  voidedBy: number | null = null
) {
  return callProc("VoidPayment", [storeId, paymentId, voidedBy]);
}
