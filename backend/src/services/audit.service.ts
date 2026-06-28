import { pool } from "../config/db";
import { logger } from "../utils/logger.util";

export interface AuditContext {
  storeId: number;
  userId: number | null;
  ip?: string | null;
  userAgent?: string | null;
}

export async function logAudit(
  context: AuditContext,
  action: string,
  entityType: string,
  entityId: string | number | null,
  metadata: Record<string, any> | null = null
) {
  await pool.query(
    `INSERT INTO audit_logs
      (store_id, user_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      context.storeId,
      context.userId,
      action,
      entityType,
      entityId === null ? null : String(entityId),
      metadata ? JSON.stringify(metadata) : null,
      context.ip || null,
      context.userAgent || null,
    ]
  );
}

export async function logAuditSafe(
  context: AuditContext,
  action: string,
  entityType: string,
  entityId: string | number | null,
  metadata: Record<string, any> | null = null
) {
  try {
    await logAudit(context, action, entityType, entityId, metadata);
  } catch (err) {
    logger.error("audit.write_failed", {
      error: err,
      store_id: context.storeId,
      user_id: context.userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
    });
  }
}
