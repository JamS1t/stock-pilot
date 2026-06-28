import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { pool } from "../config/db";
import { ApiError } from "../utils/apiError";
import { AuditContext, logAudit } from "./audit.service";

export type StoreRole = "owner" | "admin" | "staff";

export interface StoreSettingsInput {
  name: string;
  timezone: string;
  currency: string;
  receipt_name: string | null;
  receipt_address: string | null;
  receipt_phone: string | null;
  receipt_footer: string | null;
  tax_enabled: boolean;
  tax_rate: number;
  tax_label: string;
  require_cash_session: boolean;
  allow_negative_stock: boolean;
}

async function getRoleForUserStore(
  connection: PoolConnection,
  storeId: number,
  userId: number
) {
  const [rows] = await connection.query<any[]>(
    `SELECT role
       FROM userstores
      WHERE store_id = ? AND user_id = ?
      LIMIT 1`,
    [storeId, userId]
  );
  return (rows[0]?.role || null) as StoreRole | null;
}

export async function getStoreRole(storeId: number, userId: number) {
  const connection = await pool.getConnection();
  try {
    return await getRoleForUserStore(connection, storeId, userId);
  } finally {
    connection.release();
  }
}

export async function getStoreSettings(storeId: number) {
  const [rows] = await pool.query<any[]>(
    `SELECT
        s.store_id,
        s.name,
        s.timezone,
        s.currency,
        COALESCE(ss.receipt_name, s.name) AS receipt_name,
        ss.receipt_address,
        ss.receipt_phone,
        ss.receipt_footer,
        COALESCE(ss.tax_enabled, 0) AS tax_enabled,
        COALESCE(ss.tax_rate, 0) AS tax_rate,
        COALESCE(ss.tax_label, 'Tax') AS tax_label,
        COALESCE(ss.require_cash_session, 0) AS require_cash_session,
        COALESCE(ss.allow_negative_stock, 0) AS allow_negative_stock
       FROM stores s
       LEFT JOIN store_settings ss ON ss.store_id = s.store_id
      WHERE s.store_id = ?
      LIMIT 1`,
    [storeId]
  );

  const row = rows[0];
  if (!row) throw new ApiError(404, "STORE_NOT_FOUND", "Store not found.");

  return {
    ...row,
    tax_enabled: !!row.tax_enabled,
    require_cash_session: !!row.require_cash_session,
    allow_negative_stock: !!row.allow_negative_stock,
  };
}

export async function updateStoreSettings(
  storeId: number,
  input: StoreSettingsInput,
  audit: AuditContext
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE stores
          SET name = ?, timezone = ?, currency = ?
        WHERE store_id = ?`,
      [input.name, input.timezone, input.currency, storeId]
    );
    await connection.query(
      `INSERT INTO store_settings (
          store_id,
          receipt_name,
          receipt_address,
          receipt_phone,
          receipt_footer,
          tax_enabled,
          tax_rate,
          tax_label,
          require_cash_session,
          allow_negative_stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          receipt_name = VALUES(receipt_name),
          receipt_address = VALUES(receipt_address),
          receipt_phone = VALUES(receipt_phone),
          receipt_footer = VALUES(receipt_footer),
          tax_enabled = VALUES(tax_enabled),
          tax_rate = VALUES(tax_rate),
          tax_label = VALUES(tax_label),
          require_cash_session = VALUES(require_cash_session),
          allow_negative_stock = VALUES(allow_negative_stock)`,
      [
        storeId,
        input.receipt_name,
        input.receipt_address,
        input.receipt_phone,
        input.receipt_footer,
        input.tax_enabled ? 1 : 0,
        input.tax_rate,
        input.tax_label,
        input.require_cash_session ? 1 : 0,
        input.allow_negative_stock ? 1 : 0,
      ]
    );
    await connection.commit();

    await logAudit(audit, "settings.update", "store", storeId, {
      fields: Object.keys(input),
    });
    return getStoreSettings(storeId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function listStoreUsers(storeId: number) {
  const [rows] = await pool.query<any[]>(
    `SELECT
        u.user_id,
        u.email,
        u.name,
        u.is_active,
        us.role,
        us.created_at AS joined_at
       FROM userstores us
       INNER JOIN users u ON u.user_id = us.user_id
      WHERE us.store_id = ?
      ORDER BY
        CASE us.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
        u.name,
        u.email`,
    [storeId]
  );
  return rows.map((row) => ({ ...row, is_active: !!row.is_active }));
}

export async function updateStoreUserRole(
  storeId: number,
  targetUserId: number,
  role: StoreRole,
  audit: AuditContext
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const currentRole = await getRoleForUserStore(connection, storeId, targetUserId);
    if (!currentRole) {
      throw new ApiError(404, "USER_NOT_IN_STORE", "User is not part of this store.");
    }

    if (currentRole === "owner" && role !== "owner") {
      const [ownerRows] = await connection.query<any[]>(
        `SELECT COUNT(*) AS owner_count
           FROM userstores
          WHERE store_id = ? AND role = 'owner'`,
        [storeId]
      );
      if (Number(ownerRows[0]?.owner_count || 0) <= 1) {
        throw new ApiError(
          400,
          "LAST_OWNER",
          "A store must keep at least one owner."
        );
      }
    }

    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE userstores SET role = ? WHERE store_id = ? AND user_id = ?`,
      [role, storeId, targetUserId]
    );
    await connection.commit();

    await logAudit(audit, "user.role_update", "user", targetUserId, {
      previous_role: currentRole,
      role,
    });
    return { affected_rows: result.affectedRows };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
