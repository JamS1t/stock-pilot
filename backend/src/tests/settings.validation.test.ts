import test from "node:test";
import assert from "node:assert/strict";
import { parseStoreSettingsBody } from "../controllers/settings.controller";
import { ApiError } from "../utils/apiError";

const validBody = {
  name: "Main Store",
  timezone: "Asia/Manila",
  currency: "PHP",
  receipt_name: "Main Store",
  receipt_address: "",
  receipt_phone: null,
  receipt_footer: "Thanks",
  tax_enabled: "true",
  tax_rate: "12",
  tax_label: "VAT",
  require_cash_session: false,
  allow_negative_stock: "0",
};

test("parseStoreSettingsBody normalizes settings input", () => {
  const parsed = parseStoreSettingsBody(validBody);

  assert.equal(parsed.name, "Main Store");
  assert.equal(parsed.receipt_address, null);
  assert.equal(parsed.tax_enabled, true);
  assert.equal(parsed.tax_rate, 12);
  assert.equal(parsed.require_cash_session, false);
  assert.equal(parsed.allow_negative_stock, false);
});

test("parseStoreSettingsBody requires core store fields", () => {
  assert.throws(
    () => parseStoreSettingsBody({ ...validBody, name: " " }),
    (err) => err instanceof ApiError && err.code === "MISSING_FIELD"
  );
});

test("parseStoreSettingsBody rejects invalid tax rates", () => {
  assert.throws(
    () => parseStoreSettingsBody({ ...validBody, tax_rate: 101 }),
    (err) => err instanceof ApiError && err.code === "INVALID_TAX_RATE"
  );
});

test("parseStoreSettingsBody rejects invalid boolean values", () => {
  assert.throws(
    () => parseStoreSettingsBody({ ...validBody, tax_enabled: "sometimes" }),
    (err) => err instanceof ApiError && err.code === "INVALID_BOOLEAN"
  );
});
