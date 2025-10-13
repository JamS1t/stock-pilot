import { callProc } from "../callProc";

export async function CreateRefreshToken(
  userId: number,
  storeId: number,
  tokenHash: string,
  expiresAt: Date,
  ip: string | null,
  ua: string | null
) {
  return callProc("CreateRefreshToken", [
    userId,
    storeId,
    tokenHash,
    expiresAt,
    ip,
    ua,
  ]);
}
export async function GetRefreshToken(tokenHash: string) {
  const rows = await callProc<any>("GetRefreshToken", [tokenHash]);
  return rows[0] ?? null;
}
export async function RevokeRefreshToken(
  tokenHash: string,
  replacedByHash: string | null
) {
  return callProc("RevokeRefreshToken", [tokenHash, replacedByHash]);
}
export async function RevokeAllRefreshTokensForUserStore(
  userId: number,
  storeId: number
) {
  return callProc("RevokeAllRefreshTokensForUserStore", [
    userId,
    storeId,
  ]);
}
export async function AuthCreateUserStore(
  userId: number,
  storeName: string,
  timezone: string,
  currency: string
) {
  return callProc("AuthCreateUserStore", [
    userId,
    storeName,
    timezone,
    currency,
  ]);
}
export async function AuthUpsertUser(
  googleSub: string,
  email: string,
  name: string,
  googleEmailVerified: boolean
) {
  return callProc("AuthUpsertUser", [
    googleSub,
    email,
    name,
    googleEmailVerified ? 1 : 0,
  ]);
}
export async function GetUserStoreInfo(userId: number) {
  const storeId = null;

  return callProc("GetUserStoreInfo", [userId, storeId]);
}
