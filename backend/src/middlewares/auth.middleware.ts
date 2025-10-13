import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";

// ✅ Define the shape of your token payload
interface JwtPayload {
  user_id: number;
  store_id: number;
  iat?: number;
  exp?: number;
}

// ✅ Extend Express Request to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "MISSING_TOKEN", "Access token is required.");
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      console.error(
        "⚠️ JWT_ACCESS_SECRET is missing in environment variables."
      );
      throw new ApiError(500, "SERVER_MISCONFIG", "Server misconfiguration.");
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded?.user_id || !decoded?.store_id) {
      throw new ApiError(401, "INVALID_TOKEN", "Malformed access token.");
    }

    req.user = decoded; // ✅ Attach user to the request
    next();
  } catch (err: any) {
    if (err instanceof ApiError) {
      return res
        .status(err.status)
        .json({ error: err.code, message: err.message });
    }

    console.error("JWT verification failed:", err);
    return res
      .status(401)
      .json({
        error: "INVALID_TOKEN",
        message: "Access token is invalid or expired.",
      });
  }
}
