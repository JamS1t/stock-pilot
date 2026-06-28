import { Response } from "express";

export function successResponse(
  res: Response,
  message: string,
  data: any = null,
  status = 200,
  meta?: Record<string, any>
) {
  return res.status(status).json({
    success: true,
    message,
    data,
    ...(meta || {}),
  });
}

export function errorResponse(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({
    success: false,
    error: code,
    message,
  });
}
