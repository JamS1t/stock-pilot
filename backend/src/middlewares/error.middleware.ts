import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.util";

interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;

  logger.error("request.error", {
    method: req.method,
    path: req.path,
    status,
    code: err.code || "SERVER_ERROR",
    message: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    details: err.details || null,
  });

  const message =
    status === 500
      ? "Internal server error"
      : err.message || "Unexpected error";

  res.status(status).json({
    success: false,
    error: {
      message,
      code: err.code || "SERVER_ERROR",
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}
