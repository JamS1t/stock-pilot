import { Router } from "express";
import {
  getStoreSettingsHandler,
  listStoreUsersHandler,
  updateStoreSettingsHandler,
  updateStoreUserRoleHandler,
} from "../controllers/settings.controller";
import { requireStoreRole } from "../middlewares/role.middleware";

const router = Router();

router.get("/store", getStoreSettingsHandler);
router.put(
  "/store",
  requireStoreRole(["owner", "admin"]),
  updateStoreSettingsHandler
);
router.get("/users", requireStoreRole(["owner", "admin"]), listStoreUsersHandler);
router.patch(
  "/users/:userId/role",
  requireStoreRole(["owner"]),
  updateStoreUserRoleHandler
);

export default router;
