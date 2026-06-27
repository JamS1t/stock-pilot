import {
  CreatePayment,
  ListPayments,
  PaymentMethod,
  VoidPayment,
} from "../db/procedures/payment.proc";
import { ApiError } from "../utils/apiError";

function getAffected(result: any) {
  return result?.[0]?.affected_rows ?? result?.[0]?.affected ?? 0;
}

export async function createPayment(
  storeId: number,
  customerId: number,
  amount: number,
  method: PaymentMethod = "cash",
  note: string | null = null,
  createdBy: number | null = null
) {
  const result = await CreatePayment(
    storeId,
    customerId,
    amount,
    method,
    note,
    createdBy
  );
  const paymentId = result?.[0]?.id ?? null;

  if (!paymentId) {
    throw new ApiError(500, "CREATE_FAILED", "Failed to create payment.");
  }

  return { payment_id: paymentId };
}

export async function listPayments(
  storeId: number,
  customerId: number | null = null,
  from: string | null = null,
  to: string | null = null
) {
  return ListPayments(storeId, customerId, from, to);
}

export async function voidPayment(
  storeId: number,
  paymentId: number,
  voidedBy: number | null = null
) {
  const result = await VoidPayment(storeId, paymentId, voidedBy);
  const affected = getAffected(result);

  if (affected === 0) {
    throw new ApiError(
      404,
      "PAYMENT_NOT_FOUND",
      "No active payment found with the given ID."
    );
  }

  return { affected_rows: affected };
}
