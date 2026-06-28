import {
  CreateStockMovement,
  ListStockMovements,
  StockMovementReason,
} from "../db/procedures/stockMovement.proc";
import { ApiError } from "../utils/apiError";

export async function createStockMovement(
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
  const result = await CreateStockMovement(
    storeId,
    productId,
    quantityDelta,
    reason,
    sourceType,
    sourceId,
    note,
    createdBy,
    clientMutationId
  );
  const movementId = result?.[0]?.id ?? null;

  if (!movementId) {
    throw new ApiError(
      500,
      "CREATE_FAILED",
      "Failed to create stock movement."
    );
  }

  return { movement_id: movementId };
}

export async function listStockMovements(
  storeId: number,
  productId: number | null = null,
  from: string | null = null,
  to: string | null = null
) {
  return ListStockMovements(storeId, productId, from, to);
}
