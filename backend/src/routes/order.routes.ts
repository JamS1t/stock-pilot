import { Router } from "express";
import {
  processOrderPOSHandler,
  getOrderHistoryHandler,
} from "../controllers/order.controller";

const router = Router();

router.post("/process", processOrderPOSHandler);
router.get("/history", getOrderHistoryHandler);

export default router;
