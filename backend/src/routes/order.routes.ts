import { Router } from "express";
import {
  processOrderPOSHandler,
  getOrderHistoryHandler,
  voidOrderHandler,
} from "../controllers/order.controller";

const router = Router();

router.post("/process", processOrderPOSHandler);
router.get("/history", getOrderHistoryHandler);
router.post("/:id/void", voidOrderHandler);

export default router;
