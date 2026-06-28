import { Request, Response, NextFunction } from "express";
import { getStoreRole, StoreRole } from "../services/settings.service";
import { ApiError } from "../utils/apiError";
import { logger } from "../utils/logger.util";

declare global {
  namespace Express {
    interface Request {
      storeRole?: StoreRole;
    }
  }
}

export function requireStoreRole(allowedRoles: StoreRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user?.user_id || !user.store_id) {
        throw new ApiError(401, "MISSING_AUTH_CONTEXT", "Authentication required.");
      }

      const role = await getStoreRole(user.store_id, user.user_id);
      if (!role || !allowedRoles.includes(role)) {
        throw new ApiError(403, "FORBIDDEN", "You do not have permission to do this.");
      }

      req.storeRole = role;
      next();
    } catch (err: any) {
      if (err instanceof ApiError) {
        return res
          .status(err.status)
          .json({ error: err.code, message: err.message });
      }

      logger.error("auth.role_check_failed", {
        error: err,
        store_id: req.user?.store_id || null,
        user_id: req.user?.user_id || null,
      });
      return res.status(500).json({
        error: "SERVER_ERROR",
        message: "Internal server error.",
      });
    }
  };
}
