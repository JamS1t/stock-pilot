import test from "node:test";
import assert from "node:assert/strict";
import { validateOrderVoidTransition } from "../services/order.service";
import { ApiError } from "../utils/apiError";

test("validateOrderVoidTransition allows refunding paid orders", () => {
  assert.doesNotThrow(() => validateOrderVoidTransition("paid", "refund"));
});

test("validateOrderVoidTransition allows cancelling pending orders", () => {
  assert.doesNotThrow(() => validateOrderVoidTransition("pending", "cancel"));
});

test("validateOrderVoidTransition blocks refunding pending orders", () => {
  assert.throws(
    () => validateOrderVoidTransition("pending", "refund"),
    (err) => err instanceof ApiError && err.code === "ORDER_NOT_REFUNDABLE"
  );
});

test("validateOrderVoidTransition blocks cancelling paid orders", () => {
  assert.throws(
    () => validateOrderVoidTransition("paid", "cancel"),
    (err) => err instanceof ApiError && err.code === "ORDER_NOT_CANCELLABLE"
  );
});

test("validateOrderVoidTransition blocks already voided orders", () => {
  assert.throws(
    () => validateOrderVoidTransition("refunded", "refund"),
    (err) => err instanceof ApiError && err.code === "ORDER_ALREADY_VOIDED"
  );
});
