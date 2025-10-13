import { Response } from "express";

export function successResponse(res: Response, message: string, data: any = null, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({
    success: false,
    error: code,
    message,
  });
}
