import { Request, Response } from "express";
import { getSalesReportJSON } from "../services/report.service";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";
import { successResponse, errorResponse } from "../utils/response.util";

export async function getSalesReportJSONHandler(req: Request, res: Response) {
  try {
    const { start_date, end_date, category_id, product_id, granularity } =
      req.query;
    const { store_id } = req.user!;

    if (!start_date || !end_date || !granularity) {
      throw new ApiError(
        400,
        "MISSING_REQUIRED_FIELDS",
        "Missing required fields for sales report."
      );
    }

    if (granularity !== "minute" && granularity !== "day") {
      throw new ApiError(
        400,
        "INVALID_GRANULARITY",
        "Granularity must be either 'minute' or 'day'."
      );
    }

    if (category_id && isNaN(Number(category_id)))
      throw new ApiError(
        400,
        "INVALID_CATEGORY_ID",
        "Category ID must be a valid number if provided."
      );
    if (product_id && isNaN(Number(product_id)))
      throw new ApiError(
        400,
        "INVALID_PRODUCT_ID",
        "Product ID must be a valid number if provided."
      );

    const report = await getSalesReportJSON(
      store_id,
      new Date(String(start_date)),
      new Date(String(end_date)),
      category_id ? Number(category_id) : null,
      product_id ? Number(product_id) : null,
      granularity as "minute" | "day"
    );

    const reportJSON = safeJSONParse<any[]>(report?.[0]?.report_json, []);

    return successResponse(
      res,
      "Sales report fetched successfully",
      reportJSON
    );
  } catch (err: any) {
    console.error("Sales report fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
