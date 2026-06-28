import {
  AuthUpsertUser,
  AuthCreateUserStore,
  GetUserStoreInfo,
  GetRefreshToken,
  CreateRefreshToken,
  RevokeRefreshToken,
  RevokeAllRefreshTokensForUserStore,
} from "../db/procedures/auth.proc";
import { ApiError } from "../utils/apiError";
import { safeJSONParse } from "../utils/json.util";

import {
  signAccessToken,
  genRefreshRaw,
  hashRefresh,
  verifyGoogleToken,
} from "../utils/token.util";

export async function googleLoginService(
  token: string,
  ip: string,
  userAgent: string
) {
  let payload: any;

  if (process.env.MOCK_GOOGLE === "true") {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(
        500,
        "MOCK_GOOGLE_FORBIDDEN",
        "Mock Google auth cannot be enabled in production."
      );
    }
    console.warn("⚠️ MOCK MODE ENABLED — skipping Google token verification");
    // Simulated decoded token
    payload = {
      sub: "mock_sub_1234",
      email: "mockuser2323@example.com",
      name: "Mock User 45",
      email_verified: true,
    };
  } else {
    payload = await verifyGoogleToken(token);
  }

  const {
    sub: googleSub,
    email,
    name,
    email_verified: emailVerified,
  } = payload;
  const verified = !!emailVerified;

  // 2️⃣ Upsert user (creates if not existing)
  const upsertRes = await AuthUpsertUser(
    googleSub,
    email,
    name || null,
    verified
  );
  const userId = upsertRes[0]?.user_id;
  const isNew = upsertRes[0]?.is_new;
  if (!userId)
    throw new ApiError(500, "USER_UPSERT_FAILED", "User upsert failed.");

  // 4️⃣ If user has no store yet
  if (isNew === 1) {
    return {
      newUser: true,
      user: { user_id: userId, email, name },
    };
  }

  // 3️⃣ Check if user already has store(s)
  const infoRes = await GetUserStoreInfo(userId);
  const storeInfo = safeJSONParse<any>(infoRes[0]?.user_store_info, null);
  const storeId = storeInfo?.store?.store_id ?? null;

  // Generate refresh token
  const { raw: refreshRaw, hash: refreshHash, expiresAt } = genRefreshRaw();
  await CreateRefreshToken(
    userId,
    storeId,
    refreshHash,
    expiresAt,
    ip,
    userAgent
  );

  // Generate access token
  const accessToken = signAccessToken({ user_id: userId, store_id: storeId });

  return {
    newUser: false,
    accessToken,
    refreshToken: refreshRaw,
    expiresAt,
    ...storeInfo,
  };
}

export async function setupStoreService(
  userId: number,
  storeName: string,
  timezone: string,
  currency: string,
  ip: string,
  userAgent: string
) {
  // 1️⃣ Create the store
  const storeRes = await AuthCreateUserStore(
    userId,
    storeName,
    timezone,
    currency
  );
  const isCreated = storeRes[0]?.is_created;
  const storeId = storeRes[0]?.store_id;
  if (!isCreated)
    throw new ApiError(500, "STORE_CREATION_FAILED", "Store creation failed.");

  // 2️⃣ Generate refresh token
  const { raw: refreshRaw, hash: refreshHash, expiresAt } = genRefreshRaw();
  await CreateRefreshToken(
    userId,
    storeId,
    refreshHash,
    expiresAt,
    ip,
    userAgent
  );

  // 3️⃣ Sign access token
  const accessToken = signAccessToken({ user_id: userId, store_id: storeId });

  // 4️⃣ Return to controller
  return {
    accessToken,
    refreshToken: refreshRaw,
    expiresAt,
    user: { user_id: userId },
    store: { store_id: storeId, name: storeName, timezone, currency },
    role: "owner",
  };
}

export async function revokeUserSession(incomingRaw: string) {
  const incomingHash = hashRefresh(incomingRaw);
  await RevokeRefreshToken(incomingHash, null);
}

export async function refreshSession(
  incomingRaw: string,
  ip: string,
  userAgent: string
) {
  const incomingHash = hashRefresh(incomingRaw);
  const row = await GetRefreshToken(incomingHash);
  if (!row)
    throw new ApiError(401, "INVALID_REFRESH", "Invalid refresh token.");
  if (row.revoked) {
    if (row.replaced_by_token_hash) {
      await RevokeAllRefreshTokensForUserStore(row.user_id, row.store_id);
      throw new ApiError(
        401,
        "REUSE_DETECTED",
        "Refresh token reuse detected."
      );
    }
    throw new ApiError(401, "REVOKED", "Refresh token revoked.");
  }
  if (new Date(row.expires_at) < new Date())
    throw new ApiError(401, "EXPIRED", "Refresh token expired.");

  // rotate
  const { raw: newRaw, hash: newHash, expiresAt } = genRefreshRaw();
  await CreateRefreshToken(
    row.user_id,
    row.store_id,
    newHash,
    expiresAt,
    ip,
    userAgent
  );
  await RevokeRefreshToken(incomingHash, newHash);
  const accessToken = signAccessToken({
    user_id: row.user_id,
    store_id: row.store_id,
  });
  return { accessToken, newRefreshToken: newRaw, expiresAt };
}
