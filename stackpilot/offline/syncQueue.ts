import { fetchApi } from "../utils/api";
import {
  readCachedCustomerById,
  readCachedProductById,
} from "./cache";
import {
  deleteFromStore,
  getFromStore,
  putInStore,
  readAllFromStore,
} from "./db";

export type SyncQueueStatus =
  | "queued"
  | "syncing"
  | "synced"
  | "failed"
  | "conflict";

export type SyncConflictKind =
  | "missing_product"
  | "insufficient_stock"
  | "missing_customer"
  | "duplicate_customer"
  | "invalid_payload"
  | "server_rejected";

export interface SyncConflict {
  kind: SyncConflictKind;
  message: string;
  detected_at: string;
  retryable: boolean;
  resolution: "refresh_and_retry" | "manual_review" | "discard";
  server_snapshot?: Record<string, any> | null;
}

export interface SyncMutationContext {
  product_ids: number[];
  customer_ids: number[];
  required_stock_by_product_id: Record<string, number>;
  queued_snapshots: {
    products: Record<string, { name: string; stock: number }>;
    customers: Record<string, { name: string; phone: string | null }>;
  };
}

export interface SyncQueueItem {
  local_id: string;
  client_mutation_id: string;
  device_id: string;
  entity_type: string;
  operation_type: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: Record<string, any>;
  status: SyncQueueStatus;
  attempts: number;
  last_error: string | null;
  conflict: SyncConflict | null;
  mutation_context: SyncMutationContext | null;
  created_at: string;
  updated_at: string;
}

export interface SyncQueueSummary {
  queued: number;
  syncing: number;
  synced: number;
  failed: number;
  conflict: number;
  total: number;
}

const DEVICE_KEY = "device_id";

function createId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
}

function normalizeText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function asNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function addUniqueNumber(values: number[], value: unknown) {
  const numberValue = asNumber(value);
  if (numberValue === null || values.includes(numberValue)) return;
  values.push(numberValue);
}

function addRequiredStock(
  requirements: Record<string, number>,
  productId: unknown,
  quantity: unknown
) {
  const id = asNumber(productId);
  const stockQuantity = asNumber(quantity);
  if (id === null || stockQuantity === null || stockQuantity <= 0) return;
  requirements[String(id)] = (requirements[String(id)] || 0) + stockQuantity;
}

function getOrderPayload(payload: Record<string, any>) {
  return (payload.payload || payload) as Record<string, any>;
}

function extractMutationRequirements(item: {
  entity_type: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: Record<string, any>;
}) {
  const productIds: number[] = [];
  const customerIds: number[] = [];
  const requiredStockByProductId: Record<string, number> = {};
  const orderPayload = getOrderPayload(item.payload);

  if (item.entity_type === "sale" || item.endpoint === "/orders/process") {
    for (const line of orderPayload.items || []) {
      addUniqueNumber(productIds, line.product_id);
      addRequiredStock(requiredStockByProductId, line.product_id, line.quantity);
    }
  }

  if (item.entity_type === "stock_movement" || item.endpoint === "/stock-movements") {
    addUniqueNumber(productIds, item.payload.product_id);
    const delta = asNumber(item.payload.quantity_delta);
    if (delta !== null && delta < 0) {
      addRequiredStock(
        requiredStockByProductId,
        item.payload.product_id,
        Math.abs(delta)
      );
    }
  }

  if (
    item.entity_type === "utang_entry" ||
    item.entity_type === "utang_payment" ||
    item.endpoint === "/utang" ||
    item.endpoint === "/payments"
  ) {
    addUniqueNumber(customerIds, item.payload.customer_id);
  }

  if (item.entity_type === "customer" && item.method !== "POST") {
    addUniqueNumber(customerIds, item.payload.customer_id);
    const customerIdMatch = item.endpoint.match(/\/customers\/(\d+)/);
    if (customerIdMatch) addUniqueNumber(customerIds, customerIdMatch[1]);
  }

  return {
    productIds,
    customerIds,
    requiredStockByProductId,
  };
}

async function buildMutationContext(input: {
  entity_type: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: Record<string, any>;
}): Promise<SyncMutationContext | null> {
  const requirements = extractMutationRequirements(input);
  const productSnapshots: SyncMutationContext["queued_snapshots"]["products"] = {};
  const customerSnapshots: SyncMutationContext["queued_snapshots"]["customers"] = {};

  for (const productId of requirements.productIds) {
    const product = await readCachedProductById(productId);
    if (!product) continue;
    productSnapshots[String(productId)] = {
      name: product.name,
      stock: product.stock,
    };
  }

  for (const customerId of requirements.customerIds) {
    const customer = await readCachedCustomerById(customerId);
    if (!customer) continue;
    customerSnapshots[String(customerId)] = {
      name: customer.name,
      phone: customer.phone,
    };
  }

  if (
    requirements.productIds.length === 0 &&
    requirements.customerIds.length === 0
  ) {
    return null;
  }

  return {
    product_ids: requirements.productIds,
    customer_ids: requirements.customerIds,
    required_stock_by_product_id: requirements.requiredStockByProductId,
    queued_snapshots: {
      products: productSnapshots,
      customers: customerSnapshots,
    },
  };
}

function createConflict(
  kind: SyncConflictKind,
  message: string,
  options?: {
    retryable?: boolean;
    resolution?: SyncConflict["resolution"];
    serverSnapshot?: Record<string, any> | null;
  }
): SyncConflict {
  return {
    kind,
    message,
    detected_at: new Date().toISOString(),
    retryable: options?.retryable ?? false,
    resolution: options?.resolution || "manual_review",
    server_snapshot: options?.serverSnapshot ?? null,
  };
}

async function readServerProduct(productId: number) {
  try {
    const response = await fetchApi<{ data: any }>(`/products/${productId}`, "GET");
    return response.data || null;
  } catch (err: any) {
    const message = normalizeText(err?.message);
    if (message.includes("not found") || message.includes("deleted")) {
      return null;
    }
    throw err;
  }
}

async function readServerCustomer(customerId: number) {
  const query = new URLSearchParams({ id: String(customerId) });
  const response = await fetchApi<{ data: any[] }>(
    `/customers?${query.toString()}`,
    "GET"
  );
  return response.data?.[0] || null;
}

async function findDuplicateCustomer(payload: Record<string, any>) {
  const name = normalizeText(payload.name);
  const phone = normalizeText(payload.phone);
  if (!name && !phone) return null;

  const query = new URLSearchParams({ search: phone || name });
  const response = await fetchApi<{ data: any[] }>(
    `/customers?${query.toString()}`,
    "GET"
  );

  return (response.data || []).find((customer) => {
    const samePhone = phone && normalizeText(customer.phone) === phone;
    const sameName = name && normalizeText(customer.name) === name;
    return samePhone || sameName;
  });
}

async function detectPreflightConflict(
  item: SyncQueueItem
): Promise<SyncConflict | null> {
  const requirements = extractMutationRequirements(item);

  if (item.entity_type === "customer" && item.method === "POST") {
    const duplicate = await findDuplicateCustomer(item.payload);
    if (duplicate) {
      return createConflict(
        "duplicate_customer",
        "A customer with the same name or phone already exists.",
        {
          resolution: "manual_review",
          serverSnapshot: duplicate,
        }
      );
    }
  }

  for (const productId of requirements.productIds) {
    const product = await readServerProduct(productId);
    if (!product) {
      return createConflict(
        "missing_product",
        "The product for this offline mutation no longer exists.",
        {
          resolution: "discard",
          serverSnapshot: { product_id: productId },
        }
      );
    }

    const requiredStock = requirements.requiredStockByProductId[String(productId)];
    if (requiredStock && Number(product.stock) < requiredStock) {
      return createConflict(
        "insufficient_stock",
        `Only ${product.stock} in stock, but this offline mutation needs ${requiredStock}.`,
        {
          retryable: true,
          resolution: "refresh_and_retry",
          serverSnapshot: {
            product_id: product.product_id,
            name: product.name,
            stock: product.stock,
          },
        }
      );
    }
  }

  for (const customerId of requirements.customerIds) {
    const customer = await readServerCustomer(customerId);
    if (!customer) {
      return createConflict(
        "missing_customer",
        "The customer for this offline mutation no longer exists.",
        {
          resolution: "discard",
          serverSnapshot: { customer_id: customerId },
        }
      );
    }
  }

  return null;
}

function classifyServerConflict(err: any) {
  const message = err?.message || "Sync failed.";
  const lowerMessage = normalizeText(message);

  if (
    lowerMessage.includes("insufficient stock") ||
    lowerMessage.includes("out of stock")
  ) {
    return createConflict("insufficient_stock", message, {
      retryable: true,
      resolution: "refresh_and_retry",
    });
  }

  if (lowerMessage.includes("duplicate") || lowerMessage.includes("already exists")) {
    return createConflict("duplicate_customer", message);
  }

  if (lowerMessage.includes("product") && lowerMessage.includes("not found")) {
    return createConflict("missing_product", message, { resolution: "discard" });
  }

  if (lowerMessage.includes("customer") && lowerMessage.includes("not found")) {
    return createConflict("missing_customer", message, { resolution: "discard" });
  }

  if (
    lowerMessage.includes("conflict") ||
    lowerMessage.includes("stale") ||
    lowerMessage.includes("invalid")
  ) {
    return createConflict("server_rejected", message);
  }

  return null;
}

export async function getDeviceId() {
  const existing = await getFromStore<{ key: string; value: string }>(
    "device_metadata",
    DEVICE_KEY
  );

  if (existing?.value) return existing.value;

  const deviceId = createId("device");
  await putInStore("device_metadata", { key: DEVICE_KEY, value: deviceId });
  return deviceId;
}

export async function queueOfflineMutation(input: {
  entity_type: string;
  operation_type: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: Record<string, any>;
}) {
  const now = new Date().toISOString();
  const deviceId = await getDeviceId();
  const localId = createId(input.entity_type);
  const clientMutationId = createId("mutation");
  const mutationContext = await buildMutationContext(input);
  const item: SyncQueueItem = {
    local_id: localId,
    client_mutation_id: clientMutationId,
    device_id: deviceId,
    entity_type: input.entity_type,
    operation_type: input.operation_type,
    endpoint: input.endpoint,
    method: input.method,
    payload: {
      ...input.payload,
      client_mutation_id: clientMutationId,
      device_id: deviceId,
      local_id: localId,
    },
    status: "queued",
    attempts: 0,
    last_error: null,
    conflict: null,
    mutation_context: mutationContext,
    created_at: now,
    updated_at: now,
  };

  await putInStore("sync_queue", item);
  return item;
}

export async function listSyncQueue() {
  const items = await readAllFromStore<SyncQueueItem>("sync_queue");
  return items.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function listFailedSyncQueue() {
  const items = await listSyncQueue();
  return items.filter(
    (item) => item.status === "failed" || item.status === "conflict"
  );
}

export async function discardSyncQueueItem(localId: string) {
  await deleteFromStore("sync_queue", localId);
  return getSyncQueueSummary();
}

export async function cleanupSyncedQueueItems(retentionMs = 60 * 60 * 1000) {
  const items = await listSyncQueue();
  const cutoff = Date.now() - retentionMs;
  const syncedItems = items.filter(
    (item) =>
      item.status === "synced" && new Date(item.updated_at).getTime() < cutoff
  );

  for (const item of syncedItems) {
    await deleteFromStore("sync_queue", item.local_id);
  }
}

export async function getSyncQueueSummary(): Promise<SyncQueueSummary> {
  await cleanupSyncedQueueItems();
  const items = await listSyncQueue();
  return items.reduce<SyncQueueSummary>(
    (summary, item) => ({
      ...summary,
      [item.status]: summary[item.status] + 1,
      total: summary.total + 1,
    }),
    {
      queued: 0,
      syncing: 0,
      synced: 0,
      failed: 0,
      conflict: 0,
      total: 0,
    }
  );
}

export async function retrySyncQueue() {
  const items = await listSyncQueue();
  const pending = items.filter(
    (item) =>
      item.status === "queued" ||
      item.status === "failed" ||
      (item.status === "conflict" && item.conflict?.retryable)
  );

  for (const item of pending) {
    let preflightConflict: SyncConflict | null = null;
    try {
      preflightConflict = await detectPreflightConflict(item);
    } catch {
      preflightConflict = null;
    }

    if (preflightConflict) {
      await putInStore("sync_queue", {
        ...item,
        status: "conflict",
        conflict: preflightConflict,
        last_error: preflightConflict.message,
        updated_at: new Date().toISOString(),
      });
      continue;
    }

    const syncingItem: SyncQueueItem = {
      ...item,
      status: "syncing",
      conflict: null,
      attempts: item.attempts + 1,
      updated_at: new Date().toISOString(),
    };
    await putInStore("sync_queue", syncingItem);

    try {
      await fetchApi(item.endpoint, item.method, item.payload);
      await putInStore("sync_queue", {
        ...syncingItem,
        status: "synced",
        last_error: null,
        conflict: null,
        updated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      const serverConflict = classifyServerConflict(err);
      await putInStore("sync_queue", {
        ...syncingItem,
        status: serverConflict ? "conflict" : "failed",
        last_error: serverConflict?.message || err.message || "Sync failed.",
        conflict: serverConflict,
        updated_at: new Date().toISOString(),
      });
    }
  }

  await cleanupSyncedQueueItems(0);
  return getSyncQueueSummary();
}
