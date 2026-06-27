import {
  CloseCashSession,
  GetCashSessions,
  GetOpenCashSession,
  OpenCashSession,
} from "../db/procedures/cashSession.proc";
import { ApiError } from "../utils/apiError";

function getAffected(result: any) {
  return result?.[0]?.affected_rows ?? result?.[0]?.affected ?? 0;
}

export async function openCashSession(
  storeId: number,
  openingCash: number,
  openedBy: number | null = null
) {
  const result = await OpenCashSession(storeId, openingCash, openedBy);
  const cashSessionId = result?.[0]?.id ?? null;

  if (!cashSessionId) {
    throw new ApiError(
      500,
      "OPEN_FAILED",
      "Failed to open cash session."
    );
  }

  return { cash_session_id: cashSessionId };
}

export async function closeCashSession(
  storeId: number,
  cashSessionId: number,
  expectedCash: number,
  actualCash: number,
  closedBy: number | null = null
) {
  const result = await CloseCashSession(
    storeId,
    cashSessionId,
    expectedCash,
    actualCash,
    closedBy
  );
  const affected = getAffected(result);

  if (affected === 0) {
    throw new ApiError(
      404,
      "CASH_SESSION_NOT_FOUND",
      "No open cash session found with the given ID."
    );
  }

  return { affected_rows: affected };
}

export async function getCashSessions(
  storeId: number,
  status: "open" | "closed" | null = null
) {
  return GetCashSessions(storeId, status);
}

export async function getOpenCashSession(storeId: number) {
  return GetOpenCashSession(storeId);
}
