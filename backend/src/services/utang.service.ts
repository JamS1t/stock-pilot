import {
  CreateUtang,
  GetCustomerBalance,
  GetWhoOwes,
  ListUtang,
  UtangItemInput,
  UtangSource,
  VoidUtang,
} from "../db/procedures/utang.proc";
import { ApiError } from "../utils/apiError";

function getAffected(result: any) {
  return result?.[0]?.affected_rows ?? result?.[0]?.affected ?? 0;
}

export async function createUtang(
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
  const result = await CreateUtang(
    storeId,
    customerId,
    amount,
    note,
    source,
    createdBy,
    items,
    clientMutationId,
    deviceId,
    localId
  );
  const entryId = result?.[0]?.id ?? null;

  if (!entryId) {
    throw new ApiError(500, "CREATE_FAILED", "Failed to create utang entry.");
  }

  return { entry_id: entryId };
}

export async function listUtang(
  storeId: number,
  customerId: number | null = null,
  from: string | null = null,
  to: string | null = null
) {
  return ListUtang(storeId, customerId, from, to);
}

export async function voidUtang(
  storeId: number,
  entryId: number,
  voidedBy: number | null = null
) {
  const result = await VoidUtang(storeId, entryId, voidedBy);
  const affected = getAffected(result);

  if (affected === 0) {
    throw new ApiError(
      404,
      "UTANG_NOT_FOUND",
      "No active utang entry found with the given ID."
    );
  }

  return { affected_rows: affected };
}

export async function getCustomerBalance(storeId: number, customerId: number) {
  return GetCustomerBalance(storeId, customerId);
}

export async function getWhoOwes(storeId: number) {
  return GetWhoOwes(storeId);
}
