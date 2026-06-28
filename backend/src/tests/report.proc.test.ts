import test from "node:test";
import assert from "node:assert/strict";

process.env.DB_NAME = "stock_pilot_test";

const db = require("../config/db") as typeof import("../config/db");
const callProcModule =
  require("../db/callProc") as typeof import("../db/callProc");
const reportProc =
  require("../db/procedures/report.proc") as typeof import("../db/procedures/report.proc");

interface TimezoneQuery {
  sql: string;
  params: unknown[];
}

interface ProcCall {
  procName: string;
  params: unknown[];
}

async function withProcedureStubs<T>(
  procImpl: (procName: string, params: unknown[]) => Promise<unknown[]>,
  run: (state: {
    timezoneQueries: TimezoneQuery[];
    procCalls: ProcCall[];
  }) => Promise<T>
) {
  const poolForStubs = db.pool as unknown as {
    query: (sql: string, params: unknown[]) => Promise<unknown>;
  };
  const callProcForStubs = callProcModule as unknown as {
    callProc: (procName: string, params?: unknown[]) => Promise<unknown[]>;
  };
  const originalQuery = poolForStubs.query;
  const originalCallProc = callProcForStubs.callProc;
  const timezoneQueries: TimezoneQuery[] = [];
  const procCalls: ProcCall[] = [];

  poolForStubs.query = async (sql: string, params: unknown[]) => {
    timezoneQueries.push({ sql, params });
    return [[{ timezone: "Asia/Manila" }], []];
  };
  callProcForStubs.callProc = async (
    procName: string,
    params: unknown[] = []
  ) => {
    procCalls.push({ procName, params });
    return procImpl(procName, params);
  };

  try {
    return await run({ timezoneQueries, procCalls });
  } finally {
    poolForStubs.query = originalQuery;
    callProcForStubs.callProc = originalCallProc;
  }
}

test("GetBestSellersReport calls the best-sellers procedure with UTC date-only range", async () => {
  await withProcedureStubs(
    async () => [
      {
        best_sellers_json: JSON.stringify([
          { product_id: 11, product_name: "Beans", units_sold: 6 },
        ]),
      },
    ],
    async ({ timezoneQueries, procCalls }) => {
      const result = await reportProc.GetBestSellersReport(
        7,
        "2026-06-01",
        "2026-06-02",
        3,
        5,
        20
      );

      assert.deepEqual(result, [
        { product_id: 11, product_name: "Beans", units_sold: 6 },
      ]);
      assert.deepEqual(timezoneQueries, [
        {
          sql: "SELECT timezone FROM stock_pilot_test.stores WHERE store_id = ?",
          params: [7],
        },
      ]);
      assert.deepEqual(procCalls, [
        {
          procName: "GetReportBestSellers",
          params: [
            7,
            "2026-05-31 16:00:00.000",
            "2026-06-02 16:00:00.000",
            3,
            5,
            20,
          ],
        },
      ]);
    }
  );
});

test("GetLowStockSellingFastReport passes threshold and limit extras", async () => {
  await withProcedureStubs(
    async () => [
      {
        low_stock_selling_fast_json: [{ product_id: 14, current_stock: 2 }],
      },
    ],
    async ({ procCalls }) => {
      const result = await reportProc.GetLowStockSellingFastReport(
        7,
        "2026-06-01T08:30:00",
        "2026-06-01T10:00:00",
        null,
        null,
        4,
        15
      );

      assert.deepEqual(result, [{ product_id: 14, current_stock: 2 }]);
      assert.deepEqual(procCalls, [
        {
          procName: "GetReportLowStockSellingFast",
          params: [
            7,
            "2026-06-01 00:30:00.000",
            "2026-06-01 02:00:00.000",
            null,
            null,
            4,
            15,
          ],
        },
      ]);
    }
  );
});

test("GetPreviousPeriodComparisonReport calls comparison procedure with both UTC ranges", async () => {
  await withProcedureStubs(
    async () => [
      {
        comparison_json: JSON.stringify({
          current: { gross_sales: 1000 },
          previous: { gross_sales: 800 },
          change: { gross_sales: 200 },
        }),
      },
    ],
    async ({ procCalls }) => {
      const result = await reportProc.GetPreviousPeriodComparisonReport(
        7,
        "2026-06-10",
        "2026-06-12",
        "2026-06-07",
        "2026-06-09",
        3,
        null
      );

      assert.deepEqual(result, {
        current: { gross_sales: 1000 },
        previous: { gross_sales: 800 },
        change: { gross_sales: 200 },
      });
      assert.deepEqual(procCalls, [
        {
          procName: "GetReportPreviousPeriodComparison",
          params: [
            7,
            "2026-06-09 16:00:00.000",
            "2026-06-12 16:00:00.000",
            "2026-06-06 16:00:00.000",
            "2026-06-09 16:00:00.000",
            3,
            null,
          ],
        },
      ]);
    }
  );
});

test("GetSalesReportJSON parses report JSON and localizes chart periods", async () => {
  await withProcedureStubs(
    async () => [
      {
        report_json: JSON.stringify({
          total_sales: 90,
          chart: [{ period: "2026-05-31 16:00:00", total_sales: 90 }],
        }),
      },
    ],
    async ({ procCalls }) => {
      const result = await reportProc.GetSalesReportJSON(
        7,
        "2026-06-01T00:00:00",
        "2026-06-01T23:59:59",
        null,
        null,
        "day"
      );

      assert.deepEqual(result, {
        total_sales: 90,
        chart: [{ period: "2026-06-01", total_sales: 90 }],
      });
      assert.deepEqual(procCalls, [
        {
          procName: "GetSalesReportJSON",
          params: [
            7,
            "2026-05-31 16:00:00.000",
            "2026-06-01 15:59:59.000",
            null,
            null,
            "day",
          ],
        },
      ]);
    }
  );
});

test("GetPaymentSplitReport falls back to an empty array for invalid JSON", async () => {
  const originalConsoleWarn = console.warn;
  try {
    console.warn = () => {};
    await withProcedureStubs(
      async () => [{ payment_split_json: "not json" }],
      async () => {
        const result = await reportProc.GetPaymentSplitReport(
          7,
          "2026-06-01",
          "2026-06-01",
          null,
          null
        );

        assert.deepEqual(result, []);
      }
    );
  } finally {
    console.warn = originalConsoleWarn;
  }
});
