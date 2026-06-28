import { ApiError } from "./apiError";

export type SortDirection = "asc" | "desc";

export interface PaginationParams<TSort extends string> {
  page: number | null;
  pageSize: number | null;
  offset: number | null;
  sortBy: TSort;
  sortDir: SortDirection;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  page_count: number;
}

export function parseOptionalBoolean(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return false;
  const normalized = String(value).toLowerCase();
  if (["1", "true", "yes"].includes(normalized)) return true;
  if (["0", "false", "no"].includes(normalized)) return false;
  throw new ApiError(400, "INVALID_BOOLEAN", `${label} must be true or false.`);
}

export function parsePaginationParams<TSort extends string>(
  query: Record<string, unknown>,
  allowedSorts: readonly TSort[],
  defaultSortBy: TSort,
  defaultSortDir: SortDirection
): PaginationParams<TSort> {
  const sortBy = query.sort_by ? String(query.sort_by) : defaultSortBy;
  if (!allowedSorts.includes(sortBy as TSort)) {
    throw new ApiError(400, "INVALID_SORT", "Sort field is not supported.");
  }

  const sortDir = query.sort_dir
    ? String(query.sort_dir).toLowerCase()
    : defaultSortDir;
  if (sortDir !== "asc" && sortDir !== "desc") {
    throw new ApiError(400, "INVALID_SORT", "Sort direction must be asc or desc.");
  }

  const rawPage = query.page;
  const rawPageSize = query.page_size ?? query.limit;
  const hasPagination =
    rawPage !== null &&
    rawPage !== undefined &&
    rawPage !== "" &&
    rawPageSize !== null &&
    rawPageSize !== undefined &&
    rawPageSize !== "";

  if (!hasPagination) {
    return {
      page: null,
      pageSize: null,
      offset: null,
      sortBy: sortBy as TSort,
      sortDir,
    };
  }

  const page = Number(rawPage);
  const pageSize = Number(rawPageSize);
  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, "INVALID_PAGE", "Page must be a positive integer.");
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 250) {
    throw new ApiError(
      400,
      "INVALID_PAGE_SIZE",
      "Page size must be an integer between 1 and 250."
    );
  }

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    sortBy: sortBy as TSort,
    sortDir,
  };
}

export function buildPaginationMeta(
  page: number | null,
  pageSize: number | null,
  total: number
): { pagination: PaginationMeta } | undefined {
  if (!page || !pageSize) return undefined;

  return {
    pagination: {
      page,
      page_size: pageSize,
      total,
      page_count: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
