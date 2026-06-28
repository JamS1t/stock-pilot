import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPaginationMeta,
  parseOptionalBoolean,
  parsePaginationParams,
} from "../utils/pagination.util";
import { ApiError } from "../utils/apiError";

test("parsePaginationParams returns sorting without paging when page is absent", () => {
  const parsed = parsePaginationParams(
    { sort_by: "name", sort_dir: "desc" },
    ["name", "stock"] as const,
    "name",
    "asc"
  );

  assert.deepEqual(parsed, {
    page: null,
    pageSize: null,
    offset: null,
    sortBy: "name",
    sortDir: "desc",
  });
});

test("parsePaginationParams parses page, page_size, and offset", () => {
  const parsed = parsePaginationParams(
    { page: "3", page_size: "25", sort_by: "stock" },
    ["name", "stock"] as const,
    "name",
    "asc"
  );

  assert.equal(parsed.page, 3);
  assert.equal(parsed.pageSize, 25);
  assert.equal(parsed.offset, 50);
  assert.equal(parsed.sortBy, "stock");
});

test("parsePaginationParams rejects unsupported sort fields", () => {
  assert.throws(
    () =>
      parsePaginationParams(
        { sort_by: "created_at" },
        ["name", "stock"] as const,
        "name",
        "asc"
      ),
    (err) => err instanceof ApiError && err.code === "INVALID_SORT"
  );
});

test("parsePaginationParams rejects out-of-range page sizes", () => {
  assert.throws(
    () =>
      parsePaginationParams(
        { page: "1", page_size: "251" },
        ["name"] as const,
        "name",
        "asc"
      ),
    (err) => err instanceof ApiError && err.code === "INVALID_PAGE_SIZE"
  );
});

test("parseOptionalBoolean accepts common query boolean values", () => {
  assert.equal(parseOptionalBoolean("true", "flag"), true);
  assert.equal(parseOptionalBoolean("0", "flag"), false);
  assert.equal(parseOptionalBoolean(undefined, "flag"), false);
});

test("buildPaginationMeta omits metadata when pagination is not requested", () => {
  assert.equal(buildPaginationMeta(null, null, 10), undefined);
  assert.deepEqual(buildPaginationMeta(2, 5, 11), {
    pagination: {
      page: 2,
      page_size: 5,
      total: 11,
      page_count: 3,
    },
  });
});
