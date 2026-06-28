import { callProc } from "../callProc";

export type StockMovementReason =
  | "sale"
  | "stock_in"
  | "return"
  | "damage"
  | "expired"
  | "owner_use"
  | "correction";

export async function CreateStockMovement(
  storeId: number,
  productId: number,
  quantityDelta: number,
  reason: StockMovementReason,
  sourceType: string | null = null,
  sourceId: number | null = null,
  note: string | null = null,
  createdBy: number | null = null,
  clientMutationId: string | null = null
) {
  return callProc("CreateStockMovement", [
    storeId,
    productId,
    quantityDelta,
    reason,
    sourceType,
    sourceId,
    note,
    createdBy,
    clientMutationId,
  ]);
}

export async function ListStockMovements(
  storeId: number,
  productId: number | null = null,
  from: string | null = null,
  to: string | null = null
) {
  return callProc<any>("ListStockMovements", [storeId, productId, from, to]);
}
