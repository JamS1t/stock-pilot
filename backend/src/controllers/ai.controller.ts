import { Request, Response } from "express";
import { extractReceiptDraft } from "../services/ai.service";
import { ApiError } from "../utils/apiError";
import { errorResponse, successResponse } from "../utils/response.util";

export async function extractReceiptHandler(req: Request, res: Response) {
  try {
    const { image_url, image_base64, supplier_hint, receipt_date_hint } =
      req.body;
    const { store_id } = req.user!;

    if (!image_url && !image_base64) {
      throw new ApiError(
        400,
        "RECEIPT_IMAGE_REQUIRED",
        "Receipt image URL or base64 payload is required."
      );
    }

    const result = await extractReceiptDraft(store_id, {
      image_url,
      image_base64,
      supplier_hint,
      receipt_date_hint,
    });

    return successResponse(
      res,
      "Receipt extraction draft created successfully",
      result,
      201
    );
  } catch (err: any) {
    console.error("Receipt extraction error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
