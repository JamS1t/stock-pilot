import { pool } from "../config/db";

export async function callProc<T = any>(
  procName: string,
  params: any[] = []
): Promise<T[]> {
  const placeholders = params.length ? params.map(() => "?").join(",") : "";
  const sql = `CALL ${process.env.DB_NAME}.${procName}(${placeholders})`;
  const [rows] = await pool.query(sql, params);
  // rows for CALL is usually an array of resultsets; rows[0] is first.
  if (Array.isArray(rows) && rows.length > 0) return rows[0] as T[];
  return [];
}
