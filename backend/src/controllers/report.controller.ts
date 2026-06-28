import { DateTime } from "luxon";
import { Request, Response } from "express";
import {
  getBestSellersReport,
  getDeadStockReport,
  getLowStockSellingFastReport,
  getPaymentSplitReport,
  getPreviousPeriodComparisonReport,
  getProfitBreakdownReport,
  getSalesReportJSON,
} from "../services/report.service";
import { ApiError } from "../utils/apiError";
import { successResponse, errorResponse } from "../utils/response.util";
import { logger } from "../utils/logger.util";

function parseReportDate(value: unknown, label: string) {
  if (!value) {
    throw new ApiError(
      400,
      "MISSING_REQUIRED_FIELDS",
      `${label} is required.`
    );
  }

  const raw = String(value);
  const parsed = DateTime.fromISO(raw);
  if (!parsed.isValid) {
    throw new ApiError(400, "INVALID_DATE", `${label} must be a valid ISO date.`);
  }

  return raw;
}

function parseReportFilters(query: Request["query"]) {
  const startDate = parseReportDate(query.start_date, "start_date");
  const endDate = parseReportDate(query.end_date, "end_date");
  const categoryId = parseOptionalPositiveInt(query.category_id, "category_id");
  const productId = parseOptionalPositiveInt(query.product_id, "product_id");

  return { startDate, endDate, categoryId, productId };
}

function parseOptionalPositiveInt(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, "INVALID_NUMBER", `${label} must be a positive integer.`);
  }
  return parsed;
}

function parseOptionalLimit(value: unknown) {
  const limit = parseOptionalPositiveInt(value, "limit");
  if (limit !== null && limit > 250) {
    throw new ApiError(400, "INVALID_LIMIT", "limit must be between 1 and 250.");
  }
  return limit;
}

function derivePreviousRange(startDate: string, endDate: string) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const isDateOnlyRange = dateOnly.test(startDate) && dateOnly.test(endDate);
  const currentStart = DateTime.fromISO(startDate);
  const currentEndExclusive = DateTime.fromISO(endDate).plus(
    isDateOnlyRange ? { days: 1 } : {}
  );
  const duration = currentEndExclusive.diff(currentStart);
  const previousEndExclusive = currentStart;
  const previousStart = previousEndExclusive.minus(duration);

  if (isDateOnlyRange) {
    return {
      previousStartDate: previousStart.toISODate()!,
      previousEndDate: previousEndExclusive.minus({ days: 1 }).toISODate()!,
    };
  }

  return {
    previousStartDate: previousStart.toISO()!,
    previousEndDate: previousEndExclusive.toISO()!,
  };
}

function getReportLogQuery(query: Request["query"]) {
  return {
    start_date: query.start_date || null,
    end_date: query.end_date || null,
    previous_start_date: query.previous_start_date || null,
    previous_end_date: query.previous_end_date || null,
    category_id: query.category_id || null,
    product_id: query.product_id || null,
    granularity: query.granularity || null,
    low_stock_threshold: query.low_stock_threshold || null,
    limit: query.limit || null,
  };
}

function handleReportError(req: Request, res: Response, reportType: string, err: any) {
  logger.error("report.request_failed", {
    error: err,
    report_type: reportType,
    store_id: req.user?.store_id || null,
    query: getReportLogQuery(req.query),
  });
  if (err instanceof ApiError) {
    return errorResponse(res, err.status, err.code, err.message);
  }
  return errorResponse(res, 500, "SERVER_ERROR", "Internal server error.");
}

export async function getSalesReportJSONHandler(req: Request, res: Response) {
  try {
    const { start_date, end_date, category_id, product_id, granularity } =
      req.query;
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
    return handleReportError(req, res, "sales", err);
  }
}

export async function getBestSellersReportHandler(req: Request, res: Response) {
  try {
    const { store_id } = req.user!;
    const { startDate, endDate, categoryId, productId } = parseReportFilters(
      req.query
    );
    const report = await getBestSellersReport(
      store_id,
      startDate,
      endDate,
      categoryId,
      productId,
      parseOptionalLimit(req.query.limit)
    );

    return successResponse(res, "Best sellers report fetched successfully", report);
  } catch (err: any) {
    return handleReportError(req, res, "best_sellers", err);
  }
}

export async function getProfitBreakdownReportHandler(
  req: Request,
  res: Response
) {
  try {
    const { store_id } = req.user!;
    const { startDate, endDate, categoryId, productId } = parseReportFilters(
      req.query
    );
    const report = await getProfitBreakdownReport(
      store_id,
      startDate,
      endDate,
      categoryId,
      productId,
      parseOptionalLimit(req.query.limit)
    );

    return successResponse(
      res,
      "Profit breakdown report fetched successfully",
      report
    );
  } catch (err: any) {
    return handleReportError(req, res, "profit_breakdown", err);
  }
}

export async function getPaymentSplitReportHandler(req: Request, res: Response) {
  try {
    const { store_id } = req.user!;
    const { startDate, endDate, categoryId, productId } = parseReportFilters(
      req.query
    );
    const report = await getPaymentSplitReport(
      store_id,
      startDate,
      endDate,
      categoryId,
      productId
    );

    return successResponse(res, "Payment split report fetched successfully", report);
  } catch (err: any) {
    return handleReportError(req, res, "payment_split", err);
  }
}

export async function getLowStockSellingFastReportHandler(
  req: Request,
  res: Response
) {
  try {
    const { store_id } = req.user!;
    const { startDate, endDate, categoryId, productId } = parseReportFilters(
      req.query
    );
    const lowStockThreshold = parseOptionalPositiveInt(
      req.query.low_stock_threshold,
      "low_stock_threshold"
    );
    const report = await getLowStockSellingFastReport(
      store_id,
      startDate,
      endDate,
      categoryId,
      productId,
      lowStockThreshold,
      parseOptionalLimit(req.query.limit)
    );

    return successResponse(
      res,
      "Low-stock selling-fast report fetched successfully",
      report
    );
  } catch (err: any) {
    return handleReportError(req, res, "low_stock_selling_fast", err);
  }
}

export async function getDeadStockReportHandler(req: Request, res: Response) {
  try {
    const { store_id } = req.user!;
    const { startDate, endDate, categoryId, productId } = parseReportFilters(
      req.query
    );
    const report = await getDeadStockReport(
      store_id,
      startDate,
      endDate,
      categoryId,
      productId,
      parseOptionalLimit(req.query.limit)
    );

    return successResponse(res, "Dead stock report fetched successfully", report);
  } catch (err: any) {
    return handleReportError(req, res, "dead_stock", err);
  }
}

export async function getPreviousPeriodComparisonReportHandler(
  req: Request,
  res: Response
) {
  try {
    const { store_id } = req.user!;
    const { startDate, endDate, categoryId, productId } = parseReportFilters(
      req.query
    );
    const hasExplicitPrevious =
      req.query.previous_start_date || req.query.previous_end_date;
    let previousStartDate: string;
    let previousEndDate: string;

    if (hasExplicitPrevious) {
      previousStartDate = parseReportDate(
        req.query.previous_start_date,
        "previous_start_date"
      );
      previousEndDate = parseReportDate(
        req.query.previous_end_date,
        "previous_end_date"
      );
    } else {
      const previous = derivePreviousRange(startDate, endDate);
      previousStartDate = previous.previousStartDate;
      previousEndDate = previous.previousEndDate;
    }

    const report = await getPreviousPeriodComparisonReport(
      store_id,
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      categoryId,
      productId
    );

    return successResponse(
      res,
      "Previous-period comparison report fetched successfully",
      report
    );
  } catch (err: any) {
    return handleReportError(req, res, "previous_period_comparison", err);
  }
}
