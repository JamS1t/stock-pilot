import { callProc } from "../callProc";

export async function OpenCashSession(
  storeId: number,
  openingCash: number,
  openedBy: number | null = null
) {
  return callProc("OpenCashSession", [storeId, openingCash, openedBy]);
}

export async function CloseCashSession(
  storeId: number,
  cashSessionId: number,
  expectedCash: number,
  actualCash: number,
  closedBy: number | null = null
) {
  return callProc("CloseCashSession", [
    storeId,
    cashSessionId,
    expectedCash,
    actualCash,
    closedBy,
  ]);
}

export async function GetCashSessions(
  storeId: number,
  status: "open" | "closed" | null = null
) {
  return callProc<any>("GetCashSessions", [storeId, status]);
}

export async function GetOpenCashSession(storeId: number) {
  return callProc<any>("GetOpenCashSession", [storeId]);
}
