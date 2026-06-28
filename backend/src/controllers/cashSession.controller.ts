import { Request, Response } from "express";
import {
  closeCashSession,
  getCashSessions,
  getOpenCashSession,
  openCashSession,
} from "../services/cashSession.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { errorResponse, successResponse } from "../utils/response.util";
import { logAuditSafe } from "../services/audit.service";
import { logger } from "../utils/logger.util";

function parseId(value: unknown, code: string, message: string) {
  const id = Number(value);
  if (!value || !Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, code, message);
  }
  return id;
}

function parseMoney(value: unknown, code: string, message: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new ApiError(400, code, message);
  }
  return amount;
}

export async function openCashSessionHandler(req: Request, res: Response) {
  try {
    const { opening_cash } = req.body;
    const { store_id, user_id } = req.user!;
    const openingCash = parseMoney(
      opening_cash ?? 0,
      "INVALID_OPENING_CASH",
      "Opening cash must be a non-negative number."
    );

    const result = await openCashSession(store_id, openingCash, user_id);
    await logAuditSafe(
      {
        storeId: store_id,
        userId: user_id,
        ip: req.ip || null,
        userAgent: req.get("User-Agent") || null,
      },
      "cash_session.open",
      "cash_session",
      result.cash_session_id,
      { opening_cash: openingCash }
    );
    logger.info("cash_session.open_succeeded", {
      store_id,
      user_id,
      cash_session_id: result.cash_session_id,
      opening_cash: openingCash,
    });

    return successResponse(res, "Cash session opened successfully", result, 201);
  } catch (err: any) {
    logger.error("cash_session.open_failed", {
      error: err,
      store_id: req.user?.store_id || null,
      user_id: req.user?.user_id || null,
      opening_cash: Number.isFinite(Number(req.body?.opening_cash))
        ? Number(req.body.opening_cash)
        : null,
    });
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function closeCashSessionHandler(req: Request, res: Response) {
  try {
    const cashSessionId = parseId(
      req.params.id,
      "INVALID_CASH_SESSION_ID",
      "Cash session ID is required and must be a valid number."
    );
    const { expected_cash, actual_cash } = req.body;
    const { store_id, user_id } = req.user!;
    const expectedCash = parseMoney(
      expected_cash ?? 0,
      "INVALID_EXPECTED_CASH",
      "Expected cash must be a non-negative number."
    );
    const actualCash = parseMoney(
      actual_cash,
      "INVALID_ACTUAL_CASH",
      "Actual cash is required and must be a non-negative number."
    );

    const result = await closeCashSession(
      store_id,
      cashSessionId,
      expectedCash,
      actualCash,
      user_id
    );
    await logAuditSafe(
      {
        storeId: store_id,
        userId: user_id,
        ip: req.ip || null,
        userAgent: req.get("User-Agent") || null,
      },
      "cash_session.close",
      "cash_session",
      cashSessionId,
      {
        expected_cash: expectedCash,
        actual_cash: actualCash,
        difference: actualCash - expectedCash,
      }
    );
    logger.info("cash_session.close_succeeded", {
      store_id,
      user_id,
      cash_session_id: cashSessionId,
      expected_cash: expectedCash,
      actual_cash: actualCash,
      difference: actualCash - expectedCash,
      affected_rows: result.affected_rows,
    });

    return successResponse(res, "Cash session closed successfully", result);
  } catch (err: any) {
    logger.error("cash_session.close_failed", {
      error: err,
      store_id: req.user?.store_id || null,
      user_id: req.user?.user_id || null,
      cash_session_id: req.params.id || null,
      expected_cash: Number.isFinite(Number(req.body?.expected_cash))
        ? Number(req.body.expected_cash)
        : null,
      actual_cash: Number.isFinite(Number(req.body?.actual_cash))
        ? Number(req.body.actual_cash)
        : null,
    });
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function getCashSessionsHandler(req: Request, res: Response) {
  try {
    const { status } = req.query;
    const { store_id } = req.user!;
    const parsedStatus = status ? String(status) : null;

    if (parsedStatus && !["open", "closed"].includes(parsedStatus)) {
      throw new ApiError(
        400,
        "INVALID_STATUS",
        "Status must be open or closed if provided."
      );
    }

    const rows = await getCashSessions(
      store_id,
      parsedStatus as "open" | "closed" | null
    );
    const sessions = safeJSONParse<any[]>(rows?.[0]?.cash_sessions_json, []);

    return successResponse(res, "Cash sessions fetched successfully", sessions);
  } catch (err: any) {
    logger.error("cash_session.list_failed", {
      error: err,
      store_id: req.user?.store_id || null,
      status: req.query?.status || null,
    });
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}

export async function getOpenCashSessionHandler(req: Request, res: Response) {
  try {
    const { store_id } = req.user!;
    const rows = await getOpenCashSession(store_id);
    const session = safeJSONParse<any>(rows?.[0]?.cash_session_json, null);

    return successResponse(res, "Open cash session fetched successfully", session);
  } catch (err: any) {
    logger.error("cash_session.open_fetch_failed", {
      error: err,
      store_id: req.user?.store_id || null,
    });
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
