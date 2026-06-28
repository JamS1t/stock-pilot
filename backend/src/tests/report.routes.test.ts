import test from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Express } from "express";
import jwt from "jsonwebtoken";

process.env.JWT_ACCESS_SECRET = "report-route-test-secret";

const reportService =
  require("../services/report.service") as typeof import("../services/report.service");
const { default: app } = require("../app") as { default: Express };

type ReportService = typeof import("../services/report.service");
type MutableReportService = {
  [K in keyof ReportService]: ReportService[K];
};

function replaceService<K extends keyof ReportService>(
  name: K,
  implementation: ReportService[K]
) {
  const mutableService = reportService as MutableReportService;
  const original = mutableService[name];
  mutableService[name] = implementation;
  return () => {
    mutableService[name] = original;
  };
}

function createToken() {
  return jwt.sign(
    { user_id: 123, store_id: 456 },
    process.env.JWT_ACCESS_SECRET!
  );
}

function listen() {
  return new Promise<{ server: Server; baseUrl: string }>((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
    server.on("error", reject);
  });
}

async function close(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

async function getReport(path: string) {
  const { server, baseUrl } = await listen();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${createToken()}` },
    });

    return {
      status: response.status,
      body: await response.json(),
    };
  } finally {
    await close(server);
  }
}

test("GET /api/reports/best-sellers passes parsed filters to report service", async () => {
  const calls: unknown[][] = [];
  const report = [{ product_id: 9, product_name: "Coffee", units_sold: 4 }];
  const restore = replaceService(
    "getBestSellersReport",
    (async (...args: Parameters<ReportService["getBestSellersReport"]>) => {
      calls.push([...args]);
      return report;
    }) as ReportService["getBestSellersReport"]
  );

  try {
    const { status, body } = await getReport(
      "/api/reports/best-sellers?start_date=2026-06-01&end_date=2026-06-07&category_id=3&product_id=5&limit=10"
    );

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.message, "Best sellers report fetched successfully");
    assert.deepEqual(body.data, report);
    assert.deepEqual(calls, [
      [456, "2026-06-01", "2026-06-07", 3, 5, 10],
    ]);
  } finally {
    restore();
  }
});

test("GET /api/reports/best-sellers rejects invalid limits before service call", async () => {
  const calls: unknown[][] = [];
  const originalConsoleError = console.error;
  const restore = replaceService(
    "getBestSellersReport",
    (async (...args: Parameters<ReportService["getBestSellersReport"]>) => {
      calls.push([...args]);
      return [];
    }) as ReportService["getBestSellersReport"]
  );

  try {
    console.error = () => {};
    const { status, body } = await getReport(
      "/api/reports/best-sellers?start_date=2026-06-01&end_date=2026-06-07&limit=251"
    );

    assert.equal(status, 400);
    assert.deepEqual(body, {
      success: false,
      error: "INVALID_LIMIT",
      message: "limit must be between 1 and 250.",
    });
    assert.deepEqual(calls, []);
  } finally {
    console.error = originalConsoleError;
    restore();
  }
});

test("GET /api/reports/previous-period-comparison derives prior date-only range", async () => {
  const calls: unknown[][] = [];
  const report = {
    current: { gross_sales: 300 },
    previous: { gross_sales: 200 },
    change: { gross_sales: 100 },
  };
  const restore = replaceService(
    "getPreviousPeriodComparisonReport",
    (async (
      ...args: Parameters<ReportService["getPreviousPeriodComparisonReport"]>
    ) => {
      calls.push([...args]);
      return report;
    }) as ReportService["getPreviousPeriodComparisonReport"]
  );

  try {
    const { status, body } = await getReport(
      "/api/reports/previous-period-comparison?start_date=2026-06-10&end_date=2026-06-12"
    );

    assert.equal(status, 200);
    assert.deepEqual(body.data, report);
    assert.deepEqual(calls, [
      [
        456,
        "2026-06-10",
        "2026-06-12",
        "2026-06-07",
        "2026-06-09",
        null,
        null,
      ],
    ]);
  } finally {
    restore();
  }
});
