import test from "node:test";
import assert from "node:assert/strict";
import type { Request, Response, NextFunction } from "express";

const settingsService = require("../services/settings.service") as typeof import("../services/settings.service");
const { requireStoreRole } = require("../middlewares/role.middleware") as typeof import("../middlewares/role.middleware");

function createResponse() {
  const response = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };

  return response as Response & typeof response;
}

async function runMiddleware(req: Partial<Request>) {
  const res = createResponse();
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };

  await requireStoreRole(["owner", "admin"])(
    req as Request,
    res as Response,
    next
  );

  return { res, nextCalled };
}

test("requireStoreRole rejects missing auth context", async () => {
  const { res, nextCalled } = await runMiddleware({});

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, {
    error: "MISSING_AUTH_CONTEXT",
    message: "Authentication required.",
  });
});

test("requireStoreRole allows configured roles", async () => {
  const original = settingsService.getStoreRole;
  settingsService.getStoreRole = async () => "admin";
  try {
    const req = { user: { user_id: 1, store_id: 2 } } as Partial<Request>;
    const { res, nextCalled } = await runMiddleware(req);

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
    assert.equal(req.storeRole, "admin");
  } finally {
    settingsService.getStoreRole = original;
  }
});

test("requireStoreRole rejects roles outside the allow list", async () => {
  const original = settingsService.getStoreRole;
  settingsService.getStoreRole = async () => "staff";
  try {
    const { res, nextCalled } = await runMiddleware({
      user: { user_id: 1, store_id: 2 },
    } as Partial<Request>);

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
      error: "FORBIDDEN",
      message: "You do not have permission to do this.",
    });
  } finally {
    settingsService.getStoreRole = original;
  }
});
