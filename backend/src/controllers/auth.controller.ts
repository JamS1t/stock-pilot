import { Request, Response } from "express";
import {
  refreshSession,
  googleLoginService,
  setupStoreService,
  revokeUserSession,
} from "../services/auth.service";
import { ApiError } from "../utils/apiError";

export async function googleLoginHandler(req: Request, res: Response) {
  try {
    const { token } = req.body;
    if (!token)
      throw new ApiError(400, "MISSING_ID_TOKEN", "Missing ID token.");

    const result = await googleLoginService(
      token,
      req.ip || "",
      req.get("User-Agent") || ""
    );

    console.log(result);

    // If new user, don’t issue tokens yet
    if (result.newUser) {
      return res.json({
        newUser: true,
        user: result.user,
      });
    }

    // If existing user, issue tokens
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: result.expiresAt,
    });

    return res.json({
      newUser: false,
      accessToken: result.accessToken,
      user: result.user,
      store: result.store,
      role: result.role,
      metadata: result.metadata,
    });
  } catch (err: any) {
    if (err instanceof ApiError) {
      return res
        .status(err.status)
        .json({ error: err.code, message: err.message });
    }
    console.error("[GOOGLE_LOGIN_ERROR]", err);
    return res.status(500).json({ error: "GOOGLE_LOGIN_FAILED" });
  }
}

export async function setupStoreHandler(req: Request, res: Response) {
  try {
    const { user_id, store_name, timezone, currency } = req.body;

    if (!user_id || !store_name || !timezone || !currency)
      throw new ApiError(
        400,
        "MISSING_FIELDS",
        "Missing required fields for store setup."
      );

    const result = await setupStoreService(
      user_id,
      store_name,
      timezone,
      currency,
      req.ip || "",
      req.get("User-Agent") || ""
    );

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: result.expiresAt,
    });

    return res.json({
      accessToken: result.accessToken,
      user: result.user,
      store: result.store,
      role: result.role,
    });
  } catch (err: any) {
    if (err instanceof ApiError) {
      return res
        .status(err.status)
        .json({ error: err.code, message: err.message });
    }
    console.error("[SETUP_STORE_ERROR]", err);
    return res.status(500).json({ error: "STORE_SETUP_FAILED" });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    const incoming =
      (req.cookies && req.cookies.refreshToken) || req.body.refreshToken;
    if (!incoming)
      throw new ApiError(
        400,
        "MISSING_REFRESH_TOKEN",
        "Missing refresh token."
      );

    await revokeUserSession(incoming);

    // clear refresh cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.json({ message: "logout_success" });
  } catch (err: any) {
    if (err instanceof ApiError) {
      return res
        .status(err.status)
        .json({ error: err.code, message: err.message });
    }
    console.error("Logout Error:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const incoming =
      (req.cookies && req.cookies.refreshToken) || req.body.refresh_token;

      console.log("refresh token: "+incoming);

    if (!incoming)
      throw new ApiError(401, "NO_REFRESH_TOKEN", "No refresh token provided.");

    const { accessToken, newRefreshToken, expiresAt } = await refreshSession(
      incoming,
      req.ip || "",
      req.get("User-Agent") || ""
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return res.json({ accessToken });
  } catch (err: any) {
    if (err instanceof ApiError) {
      return res
        .status(err.status)
        .json({ error: err.code, message: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
