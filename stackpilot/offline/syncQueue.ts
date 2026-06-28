import { fetchApi } from "../utils/api";
import {
  deleteFromStore,
  getFromStore,
  putInStore,
  readAllFromStore,
} from "./db";

export type SyncQueueStatus = "queued" | "syncing" | "synced" | "failed";

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
  created_at: string;
  updated_at: string;
}

export interface SyncQueueSummary {
  queued: number;
  syncing: number;
  synced: number;
  failed: number;
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
  return items.filter((item) => item.status === "failed");
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
    { queued: 0, syncing: 0, synced: 0, failed: 0, total: 0 }
  );
}

export async function retrySyncQueue() {
  const items = await listSyncQueue();
  const pending = items.filter(
    (item) => item.status === "queued" || item.status === "failed"
  );

  for (const item of pending) {
    const syncingItem: SyncQueueItem = {
      ...item,
      status: "syncing",
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
        updated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      await putInStore("sync_queue", {
        ...syncingItem,
        status: "failed",
        last_error: err.message || "Sync failed.",
        updated_at: new Date().toISOString(),
      });
    }
  }

  await cleanupSyncedQueueItems(0);
  return getSyncQueueSummary();
}
