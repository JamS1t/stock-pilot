import { Request, Response, NextFunction } from "express";

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
  console.error("❌ [ERROR]", {
    message: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    details: err.details || null,
  });

  // Handle known app errors
  const status = err.status || 500;
  const message =
    status === 500
      ? "Internal server error"
      : err.message || "Unexpected error";

  // Include structured response
  res.status(status).json({
    success: false,
    error: {
      message,
      code: err.code || "SERVER_ERROR",
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}
