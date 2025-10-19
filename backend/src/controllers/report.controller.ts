import { Request, Response } from "express";
import { getSalesReportJSON } from "../services/report.service";
import { ApiError } from "../utils/apiError";
import { successResponse, errorResponse } from "../utils/response.util";

export async function getSalesReportJSONHandler(req: Request, res: Response) {
  try {
    const { start_date, end_date, category_id, product_id, granularity } = req.query;
    const { store_id } = req.user!;

    if (!start_date || !end_date || !granularity) {
      throw new ApiError(400, "MISSING_REQUIRED_FIELDS", "Missing required fields for sales report.");
    }

    if (granularity !== "minute" && granularity !== "day") {
      throw new ApiError(400, "INVALID_GRANULARITY", "Granularity must be either 'minute' or 'day'.");
    }

    const startDate = new Date(String(start_date));
    const endDate = new Date(String(end_date));

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ApiError(400, "INVALID_DATE", "Invalid date format.");
    }

    const report = await getSalesReportJSON(
      store_id,
      startDate,
      endDate,
      category_id ? Number(category_id) : null,
      product_id ? Number(product_id) : null,
      granularity as "minute" | "day"
    );

    return successResponse(res, "Sales report fetched successfully", report);
  } catch (err: any) {
    console.error("Sales report fetch error:", err);
    if (err instanceof ApiError)
      return errorResponse(res, err.status, err.code, err.message);
    return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
  }
}
